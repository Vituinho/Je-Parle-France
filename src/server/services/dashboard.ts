import "server-only";
import type { LearnerProfile } from "@/generated/prisma/client";
import { getContent } from "@/lib/content";
import { describeTheta } from "@/lib/learning/cefr";
import { reviewCandidates, learningSegments } from "@/lib/learning/planner/planner";
import { studyPace } from "@/lib/learning/study-pace";
import { weeklyWorkload, deadlinePace } from "@/lib/learning/study-workload";
import {
  habitSummary,
  isActiveDay,
  levelProgress,
  vocabularyCounts,
} from "@/lib/learning/progress";
import { addDays, weekStart } from "@/lib/learning/time";
import { db } from "@/server/db";
import { loadTraces } from "@/server/repositories/memory";
import { getLearnerLevel, today } from "./learner";
import { blockTitle, getTodaySession, sessionPlan } from "./session";

export async function getDashboard(userId: string, profile: LearnerProfile, now = new Date()) {
  const content = getContent();
  const date = today(profile, now);
  const [traces, level, session, days] = await Promise.all([
    loadTraces(db, userId),
    getLearnerLevel(userId),
    getTodaySession(userId, profile, now),
    db.dailyActivity.findMany({
      where: { userId, localDate: { gte: addDays(date, -400) } },
      orderBy: { localDate: "desc" },
    }),
  ]);

  const concepts = [...content.concepts.values()];
  // Progress is shown for the stage the learner is actually studying (their next core lesson).
  const progressRows = await db.lessonProgress.findMany({ where: { userId, status: "completed" } });
  const completed = new Set(progressRows.map((row) => row.lessonId));
  const startIndex = Math.max(
    0,
    content.paths.core.findIndex((ref) => ref.lesson.id === profile.startLessonId),
  );
  const current = content.paths.core.slice(startIndex).find((ref) => !completed.has(ref.lesson.id));
  const progress = levelProgress(current?.unit.level ?? level.level, concepts, traces, now);
  const vocabulary = vocabularyCounts(concepts, traces, now);
  const habits = habitSummary({
    activeDates: days.filter(isActiveDay).map((day) => day.localDate),
    today: date,
    weeklyGoal: profile.weeklyGoalDays,
  });
  const monday = weekStart(date);
  const week = days.filter((day) => day.localDate >= monday);
  const sum = (key: "studySeconds" | "listeningSeconds" | "speakingSeconds") =>
    week.reduce((total, day) => total + day[key], 0);

  const due = reviewCandidates({
    traces,
    now,
    concept: (id) => {
      const concept = content.concepts.get(id);
      return concept ? { kind: concept.kind, level: concept.level } : undefined;
    },
  }).filter((candidate) => candidate.priority >= 1).length;

  const plan = sessionPlan(session);
  return {
    date,
    level: { ...level, label: describeTheta(level.theta) },
    progress,
    vocabulary,
    habits,
    workload: weeklyWorkload(days, date, profile.dailyMinutes, profile.weeklyGoalDays),
    paceIndicator: deadlinePace({
      skills: level.skills,
      dailyMinutes: profile.dailyMinutes,
      weeklyGoalDays: profile.weeklyGoalDays,
      targetLevel: profile.targetLevel,
      targetMonth: profile.targetDate?.toISOString().slice(0, 7) ?? null,
      date,
    }),
    week: {
      studyMinutes: Math.round(sum("studySeconds") / 60),
      listeningMinutes: Math.round(sum("listeningSeconds") / 60),
      speakingMinutes: Math.round(sum("speakingSeconds") / 60),
    },
    due,
    session: {
      id: session.id,
      status: session.status,
      cursor: session.cursor,
      pace: studyPace(plan.pace, plan.minutes),
      completedMinutes: Math.floor(
        (days.find((d) => d.localDate === date)?.studySeconds ?? 0) / 60,
      ),
      segments: plan.segments ?? learningSegments(plan.blocks, plan.minutes),
      minutes: plan.minutes,
      plannedMinutes: Math.max(1, Math.round(plan.seconds / 60)),
      blocks: plan.blocks.map((block) => ({
        title: blockTitle(block, content),
        minutes: Math.max(1, Math.round(block.seconds / 60)),
      })),
    },
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;
