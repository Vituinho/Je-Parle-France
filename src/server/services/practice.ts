import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { conceptDimensions, getContent } from "@/lib/content";
import type { Activity } from "@/lib/content/schema";
import {
  toAuthoredResponse,
  toClientFeedback,
  type ClientFeedback,
} from "@/lib/learning/activities/client";
import { gradeActivity, GradingError, type ActivityResponse } from "@/lib/learning/grading/grade";
import {
  applyReview,
  introduceTrace,
  masteryOf,
  type MasteryState,
  type MemoryTraceState,
  type ReviewLogRecord,
  type TraceSource,
} from "@/lib/learning/memory/memory";
import type { Dimension } from "@/lib/learning/skills";
import { localDate } from "@/lib/learning/time";
import { db } from "@/server/db";
import { loadTraces, saveReviewLogs, saveTraces, traceKey } from "@/server/repositories/memory";
import { resolveSpeechResponse, SpeechEvidenceError } from "./speech-evidence";
import { activityEvidence } from "@/lib/learning/skill-estimation/activity-evidence";
import { lockLearner, recordSkillEvidence } from "./skill-estimation";
import { evaluateWriting } from "./writing";
import type { WritingAssessment } from "@/lib/learning/writing/assessment";
import { compareLevels } from "@/lib/learning/cefr";
import { recordLearningEvent } from "./learning-events";

export class PracticeError extends Error {}

export type PracticeContext = "lesson" | "review" | "session" | "lab";

/** Seed for option shuffles: stable per learner so an activity looks the same on reload. */
export const activitySeed = (userId: string) => `u:${userId}`;

export interface MasteryChange {
  conceptId: string;
  dimension: Dimension;
  before: MasteryState;
  after: MasteryState;
}

export interface SubmitResult {
  feedback: ClientFeedback;
  changes: MasteryChange[];
}

async function resolveSpeech(userId: string, response: ActivityResponse, activity: Activity) {
  try {
    return await resolveSpeechResponse(userId, response, activity);
  } catch (error) {
    if (error instanceof SpeechEvidenceError) throw new PracticeError(error.message);
    throw error;
  }
}

/** Seconds credited per activity are capped so an idle tab does not inflate study time. */
const MAX_CREDIT_SECONDS = 120;

function timeBuckets(activity: Activity, seconds: number) {
  const listening = ["listening", "dictation", "minimal_pair"].includes(activity.type)
    ? seconds
    : 0;
  const speaking = activity.type === "speak" ? seconds : 0;
  return { listening, speaking };
}

export async function bumpDailyActivity(
  tx: Prisma.TransactionClient,
  userId: string,
  date: string,
  delta: {
    seconds: number;
    activities?: number;
    reviews?: number;
    newConcepts?: number;
    listening?: number;
    speaking?: number;
  },
) {
  const increments = {
    studySeconds: { increment: delta.seconds },
    activitiesCompleted: { increment: delta.activities ?? 0 },
    reviewsDone: { increment: delta.reviews ?? 0 },
    newConcepts: { increment: delta.newConcepts ?? 0 },
    listeningSeconds: { increment: delta.listening ?? 0 },
    speakingSeconds: { increment: delta.speaking ?? 0 },
  };
  await tx.dailyActivity.upsert({
    where: { userId_localDate: { userId, localDate: date } },
    create: {
      userId,
      localDate: date,
      studySeconds: delta.seconds,
      activitiesCompleted: delta.activities ?? 0,
      reviewsDone: delta.reviews ?? 0,
      newConcepts: delta.newConcepts ?? 0,
      listeningSeconds: delta.listening ?? 0,
      speakingSeconds: delta.speaking ?? 0,
    },
    update: increments,
  });
}

async function timezoneOf(userId: string) {
  const profile = await db.learnerProfile.findUnique({
    where: { userId },
    select: { timezone: true },
  });
  return profile?.timezone ?? "America/Sao_Paulo";
}

/**
 * Grades an activity on the server and records the evidence: one FSRS update
 * per targeted concept × dimension, the attempt, review logs and the day's
 * aggregate — in a single transaction.
 */
export async function submitActivity(params: {
  userId: string;
  activity: Activity;
  response: ActivityResponse;
  context: PracticeContext;
  lessonId?: string;
  sessionId?: string;
  hinted?: boolean;
  durationMs?: number;
  now?: Date;
  /** Server-owned choice for additional skill practice; no FSRS mutation or review log. */
  scheduleMemory?: boolean;
  /** Server-owned review receipt, stored with the attempt; never accepted from an activity response. */
  reviewReceipt?: { key: string; phase: "first" | "retry"; version?: string };
  /** Revalidate a review after taking the learner lock, immediately before any persistence. */
  reviewGuard?: (tx: Prisma.TransactionClient) => Promise<void>;
}): Promise<SubmitResult> {
  const { userId, activity, context } = params;
  if (params.sessionId) {
    const session = await db.dailySession.findFirst({
      where: { id: params.sessionId, userId },
      select: { id: true },
    });
    if (!session) throw new PracticeError("Sessão não encontrada.");
  }
  if (activity.type === "teach") throw new PracticeError("Teaching cards are not graded.");
  const now = params.now ?? new Date();
  const seed = activitySeed(userId);
  const response = await resolveSpeech(userId, params.response, activity);
  let grade;
  let writing: WritingAssessment | undefined;
  try {
    if (activity.type === "open_writing") {
      if (response.kind !== "text") throw new GradingError("Expected text.");
      writing = await evaluateWriting(userId, activity, response.text);
      if (writing.score === null) throw new PracticeError(writing.limitations.join(" "));
      grade = {
        score: writing.score,
        correct: writing.score >= 0.8,
        verdict:
          writing.score >= 0.8
            ? ("correct" as const)
            : writing.score >= 0.5
              ? ("almost" as const)
              : ("wrong" as const),
        note: { pt: writing.feedbackPt },
      };
    } else grade = gradeActivity(activity, toAuthoredResponse(activity, response, seed));
  } catch (error) {
    if (error instanceof GradingError)
      throw new PracticeError("Resposta inválida para esta atividade.");
    throw error;
  }
  const feedback = toClientFeedback(activity, grade, seed);

  const content = getContent();
  const lessonId = params.lessonId ?? content.activities.get(activity.id)?.lessonId;
  const level =
    activity.type === "open_writing"
      ? activity.rubric?.expectedLevel
      : ((lessonId ? content.lessons.get(lessonId)?.unit.level : undefined) ??
        activity.targets
          .map((t) => content.concepts.get(t.concept)?.level)
          .filter((l): l is NonNullable<typeof l> => !!l)
          .sort(compareLevels)
          .at(-1));
  const evidence = level
    ? activityEvidence({
        activity,
        grade,
        response,
        now,
        level,
        context,
        hinted: params.hinted,
        concepts: content.concepts,
        speechProof:
          params.response.kind === "speech" ? params.response.speechAttemptId : undefined,
        writing,
      })
    : [];
  const targets = writing
    ? [
        ...new Set(
          writing.issues.flatMap((i) => (i.deterministic && i.confidence >= 0.9 ? i.concepts : [])),
        ),
      ].map((concept) => ({ concept, dimension: "writing" as const, weight: 1 }))
    : activity.targets;
  const seconds = Math.min(Math.round((params.durationMs ?? 0) / 1000), MAX_CREDIT_SECONDS);
  const buckets = timeBuckets(activity, seconds);
  const date = localDate(now, await timezoneOf(userId));
  return db.$transaction(
    async (tx) => {
      await lockLearner(tx, userId);
      await params.reviewGuard?.(tx);
      const conceptIds = [...new Set(targets.map((target) => target.concept))];
      const existing = await loadTraces(tx, userId, conceptIds);
      const byKey = new Map(
        existing.map((trace) => [traceKey(trace.conceptId, trace.dimension), trace]),
      );
      const source: TraceSource =
        context === "review" ? "review" : context === "lab" ? "practice" : "lesson";

      const updated: MemoryTraceState[] = [];
      const logs: (ReviewLogRecord & { activityId: string })[] = [];
      const changes: MasteryChange[] = [];
      for (const target of targets) {
        if (params.scheduleMemory === false) continue;
        const key = traceKey(target.concept, target.dimension);
        const before = byKey.get(key) ?? null;
        const { trace, log } = applyReview({
          trace: before,
          conceptId: target.concept,
          dimension: target.dimension,
          outcome: {
            score: writing ? 0 : grade.score,
            correct: writing ? false : grade.correct,
            verdict: writing ? "wrong" : grade.verdict,
            selfRated: grade.selfRated,
            hinted: params.hinted,
          },
          weight: target.weight,
          now,
          source,
        });
        byKey.set(key, trace);
        updated.push(trace);
        if (log) logs.push({ ...log, activityId: activity.id });
        const beforeState = masteryOf(before, now);
        const afterState = masteryOf(trace, now);
        if (beforeState !== afterState) {
          changes.push({
            conceptId: target.concept,
            dimension: target.dimension,
            before: beforeState,
            after: afterState,
          });
        }
      }

      await saveTraces(tx, userId, updated);
      await saveReviewLogs(tx, userId, logs);
      const attempt = await tx.activityAttempt.create({
        data: {
          userId,
          activityId: activity.id,
          lessonId: params.lessonId ?? null,
          sessionId: params.sessionId ?? null,
          context,
          type: activity.type,
          score: grade.score,
          correct: grade.correct,
          durationMs: params.durationMs ?? null,
          level: level ?? null,
          hinted: params.hinted ?? false,
          selfRated: grade.selfRated || grade.verdict === "recorded" || false,
          createdAt: now,
          response: {
            ...(writing
              ? { answer: params.response, writingAssessment: writing }
              : params.response),
            ...(params.reviewReceipt ? { reviewReceipt: params.reviewReceipt } : {}),
          } as unknown as Prisma.InputJsonValue,
        },
      });
      await bumpDailyActivity(tx, userId, date, {
        seconds,
        activities: 1,
        reviews: context === "review" ? 1 : 0,
        listening: buckets.listening,
        speaking: buckets.speaking,
      });
      await recordSkillEvidence(tx, userId, evidence, now);
      await recordLearningEvent(
        tx,
        userId,
        {
          type: "activity_completed",
          payload: { attemptId: attempt.id, masteryChanges: changes.slice(0, 40) },
        },
        { sessionId: params.sessionId, dedupeKey: `attempt:${attempt.id}`, now },
      );
      return { feedback, changes };
    },
    { timeout: 20_000 },
  );
}

/** A teaching card was read: concepts become "introduced" on every tracked dimension. */
export async function markTeachSeen(params: {
  userId: string;
  activity: Activity;
  durationMs?: number;
  now?: Date;
}) {
  const { userId, activity } = params;
  if (activity.type !== "teach")
    throw new PracticeError("Only teaching cards can be marked as seen.");
  const now = params.now ?? new Date();
  const content = getContent();
  const existing = await loadTraces(db, userId, activity.introduces);
  const keys = new Set(existing.map((trace) => traceKey(trace.conceptId, trace.dimension)));
  const fresh: MemoryTraceState[] = [];
  for (const conceptId of activity.introduces) {
    const concept = content.concepts.get(conceptId);
    if (!concept) continue;
    for (const dimension of conceptDimensions(concept)) {
      if (!keys.has(traceKey(conceptId, dimension)))
        fresh.push(introduceTrace(conceptId, dimension, now));
    }
  }
  const newConcepts = new Set(fresh.map((trace) => trace.conceptId)).size;
  const seconds = Math.min(Math.round((params.durationMs ?? 0) / 1000), MAX_CREDIT_SECONDS);
  const date = localDate(now, await timezoneOf(userId));
  await db.$transaction(async (tx) => {
    await saveTraces(tx, userId, fresh);
    await bumpDailyActivity(tx, userId, date, { seconds, newConcepts });
  });
  return { introduced: newConcepts };
}

// ─── Lessons ───────────────────────────────────────────────────────────────

export function lessonActivity(lessonId: string, activityId: string): Activity {
  const ref = getContent().activities.get(activityId);
  if (!ref || ref.lessonId !== lessonId)
    throw new PracticeError("Atividade não encontrada nesta lição.");
  return ref.activity;
}

export async function startLesson(userId: string, lessonId: string) {
  if (!getContent().lessons.has(lessonId)) throw new PracticeError("Lição não encontrada.");
  const existing = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  if (!existing) {
    // Navigation and prefetch may open the same lesson concurrently. A native
    // upsert prevents duplicate creation without resetting another request's cursor.
    return db.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId },
      update: { lessonId },
    });
  }
  if (existing.status === "completed") {
    // Replaying a finished lesson starts a new run but keeps the completion record.
    return db.lessonProgress.update({
      where: { userId_lessonId: { userId, lessonId } },
      data: { stepIndex: 0, runs: { increment: 1 } },
    });
  }
  return existing;
}

export async function saveLessonStep(userId: string, lessonId: string, stepIndex: number) {
  await db.lessonProgress.updateMany({
    where: { userId, lessonId },
    data: { stepIndex: Math.max(0, stepIndex) },
  });
}

export async function completeLesson(userId: string, lessonId: string, score: number) {
  const ref = getContent().lessons.get(lessonId);
  if (!ref) throw new PracticeError("Lição não encontrada.");
  const clamped = Math.min(Math.max(score, 0), 1);
  const now = new Date();
  await db.$transaction(async (tx) => {
    const current = await tx.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    await tx.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status: "completed",
        score: clamped,
        completedAt: now,
        stepIndex: 0,
      },
      update: {
        status: "completed",
        stepIndex: 0,
        completedAt: current?.completedAt ?? now,
        score: Math.max(current?.score ?? 0, clamped),
      },
    });
    await tx.studyEvent.create({
      data: {
        userId,
        type: "lesson_completed",
        payload: { lessonId, score: clamped, unitId: ref.unit.id },
      },
    });
  });
}
