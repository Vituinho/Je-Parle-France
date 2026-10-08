import "server-only";
import type { LearnerProfile } from "@/generated/prisma/client";
import { getContent } from "@/lib/content";
import {
  ACHIEVEMENTS,
  achievementStatus,
  newlyEarned,
  type AchievementDefinition,
  type AchievementMetrics,
} from "@/lib/learning/achievements";
import { MASTERY_VALUE, masteryOf, type MasteryState } from "@/lib/learning/memory/memory";
import { habitSummary, isActiveDay, vocabularyCounts } from "@/lib/learning/progress";
import { addDays } from "@/lib/learning/time";
import { db } from "@/server/db";
import { loadTraces } from "@/server/repositories/memory";
import { today } from "./learner";

/**
 * Learner-facing analytics: study activity over time, how much is really
 * known (by mastery, not by lessons seen) and achievements.
 */
async function collect(userId: string, profile: LearnerProfile, now: Date) {
  const content = getContent();
  const date = today(profile, now);
  const [traces, days, lessons, sessions, placement, conversations, earnedRows] = await Promise.all(
    [
      loadTraces(db, userId),
      db.dailyActivity.findMany({ where: { userId }, orderBy: { localDate: "asc" } }),
      db.lessonProgress.findMany({
        where: { userId, status: "completed" },
        select: { lessonId: true },
      }),
      db.dailySession.count({ where: { userId, status: "completed" } }),
      db.placementAttempt.count({ where: { userId, status: "completed" } }),
      db.conversation.count({ where: { userId, status: "ended" } }),
      db.userAchievement.findMany({ where: { userId } }),
    ],
  );

  const completed = new Set(lessons.map((row) => row.lessonId));
  const units = [...content.units.values()];
  const unitsCompleted = units.filter(({ unit }) =>
    unit.lessons.every((lesson) => completed.has(lesson.id)),
  ).length;
  const trackLessons = [...completed].filter(
    (id) => (content.lessons.get(id)?.track ?? "core") !== "core",
  ).length;
  const vocabulary = vocabularyCounts([...content.concepts.values()], traces, now);
  const habits = habitSummary({
    activeDates: days.filter(isActiveDay).map((day) => day.localDate),
    today: date,
    weeklyGoal: profile.weeklyGoalDays,
  });

  const metrics: AchievementMetrics = {
    placementCompleted: placement > 0 ? 1 : 0,
    lessonsCompleted: completed.size,
    unitsCompleted,
    sessionsCompleted: sessions,
    trackLessons,
    wordsLearned: vocabulary.learned,
    wordsStrong: vocabulary.strong,
    reviewsDone: days.reduce((total, day) => total + day.reviewsDone, 0),
    conversations,
    streakDays: habits.streakDays,
    weeksInARow: habits.weeksInARow,
  };
  const earned = new Map(earnedRows.map((row) => [row.achievementId, row.earnedAt]));
  return { content, date, traces, days, habits, metrics, earned };
}

/** Collects the metrics and records achievements reached since the last check. */
async function collectAndSync(userId: string, profile: LearnerProfile, now: Date) {
  const data = await collect(userId, profile, now);
  const fresh = newlyEarned(data.metrics, new Set(data.earned.keys()));
  if (fresh.length > 0) {
    await db.userAchievement.createMany({
      data: fresh.map((achievement) => ({ userId, achievementId: achievement.id, earnedAt: now })),
      skipDuplicates: true,
    });
    for (const achievement of fresh) data.earned.set(achievement.id, now);
  }
  return { ...data, fresh };
}

/** Records achievements reached since the last check and returns the new ones. */
export async function syncAchievements(
  userId: string,
  profile: LearnerProfile,
  now = new Date(),
): Promise<AchievementDefinition[]> {
  return (await collectAndSync(userId, profile, now)).fresh;
}

/** Mastery states as shown to learners ("introduced" counts as learning). */
export type StateGroup = "learning" | "familiar" | "strong" | "mastered" | "decaying";

function group(state: MasteryState): StateGroup | null {
  if (state === "unseen") return null;
  if (state === "introduced") return "learning";
  return state;
}

export async function getProgressReport(userId: string, profile: LearnerProfile, now = new Date()) {
  const { content, date, traces, days, habits, metrics, earned } = await collectAndSync(
    userId,
    profile,
    now,
  );

  const byDate = new Map(days.map((day) => [day.localDate, day]));
  const recent = Array.from({ length: 28 }, (_, i) => {
    const day = addDays(date, i - 27);
    const row = byDate.get(day);
    return {
      date: day,
      seconds: row?.studySeconds ?? 0,
      minutes: Math.round((row?.studySeconds ?? 0) / 60),
      reviews: row?.reviewsDone ?? 0,
      active: row ? isActiveDay(row) : false,
    };
  });

  const byConcept = new Map<string, MasteryState[]>();
  for (const trace of traces) {
    const list = byConcept.get(trace.conceptId) ?? [];
    list.push(masteryOf(trace, now));
    byConcept.set(trace.conceptId, list);
  }
  const mastery = (["lexical", "grammar", "pronunciation"] as const).map((kind) => {
    const counts: Record<StateGroup, number> = {
      learning: 0,
      familiar: 0,
      strong: 0,
      mastered: 0,
      decaying: 0,
    };
    let total = 0;
    for (const concept of content.concepts.values()) {
      if (concept.kind !== kind) continue;
      total += 1;
      const states = (byConcept.get(concept.id) ?? []).filter((state) => state !== "unseen");
      if (states.length === 0) continue;
      const practised = states.filter((state) => state !== "introduced");
      const weakest = (practised.length > 0 ? practised : states).reduce((min, state) =>
        MASTERY_VALUE[state] < MASTERY_VALUE[min] ? state : min,
      );
      const bucket = group(weakest);
      if (bucket) counts[bucket] += 1;
    }
    return { kind, counts, total };
  });

  return {
    recent,
    totals: {
      activeDays: days.filter(isActiveDay).length,
      minutes: Math.round(days.reduce((total, day) => total + day.studySeconds, 0) / 60),
      reviews: metrics.reviewsDone,
      lessons: metrics.lessonsCompleted,
      conversations: metrics.conversations,
    },
    habits,
    mastery,
    achievements: achievementStatus(metrics, earned),
  };
}

export type ProgressReport = Awaited<ReturnType<typeof getProgressReport>>;

/** Achievements earned in the last few days, newest first (for the dashboard). */
export async function recentAchievements(
  userId: string,
  profile: LearnerProfile,
  now = new Date(),
) {
  await syncAchievements(userId, profile, now);
  const since = new Date(now.getTime() - 3 * 86_400_000);
  const rows = await db.userAchievement.findMany({
    where: { userId, earnedAt: { gte: since } },
    orderBy: { earnedAt: "desc" },
    take: 3,
  });
  return rows.flatMap((row) => {
    const definition = ACHIEVEMENTS.find((achievement) => achievement.id === row.achievementId);
    return definition ? [{ ...definition, earnedAt: row.earnedAt.toISOString() }] : [];
  });
}
