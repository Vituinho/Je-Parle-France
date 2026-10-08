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
  try {
    grade = gradeActivity(activity, toAuthoredResponse(activity, response, seed));
  } catch (error) {
    if (error instanceof GradingError)
      throw new PracticeError("Resposta inválida para esta atividade.");
    throw error;
  }
  const feedback = toClientFeedback(activity, grade, seed);

  const conceptIds = [...new Set(activity.targets.map((target) => target.concept))];
  const existing = await loadTraces(db, userId, conceptIds);
  const byKey = new Map(
    existing.map((trace) => [traceKey(trace.conceptId, trace.dimension), trace]),
  );
  const source: TraceSource =
    context === "review" ? "review" : context === "lab" ? "practice" : "lesson";

  const updated: MemoryTraceState[] = [];
  const logs: (ReviewLogRecord & { activityId: string })[] = [];
  const changes: MasteryChange[] = [];
  for (const target of activity.targets) {
    const key = traceKey(target.concept, target.dimension);
    const before = byKey.get(key) ?? null;
    const { trace, log } = applyReview({
      trace: before,
      conceptId: target.concept,
      dimension: target.dimension,
      outcome: {
        score: grade.score,
        correct: grade.correct,
        verdict: grade.verdict,
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

  const seconds = Math.min(Math.round((params.durationMs ?? 0) / 1000), MAX_CREDIT_SECONDS);
  const buckets = timeBuckets(activity, seconds);
  const date = localDate(now, await timezoneOf(userId));

  await db.$transaction(async (tx) => {
    await saveTraces(tx, userId, updated);
    await saveReviewLogs(tx, userId, logs);
    await tx.activityAttempt.create({
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
        response: params.response as unknown as Prisma.InputJsonValue,
      },
    });
    await bumpDailyActivity(tx, userId, date, {
      seconds,
      activities: 1,
      reviews: context === "review" ? 1 : 0,
      listening: buckets.listening,
      speaking: buckets.speaking,
    });
  });

  return { feedback, changes };
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
