"use server";

import { z } from "zod";
import { getContent } from "@/lib/content";
import { activityResponseSchema } from "@/lib/learning/grading/grade";
import {
  completeLesson,
  lessonActivity,
  markTeachSeen,
  PracticeError,
  saveLessonStep,
  submitActivity,
  type SubmitResult,
} from "@/server/services/practice";
import { requireLearner } from "@/server/session";

const ids = { lessonId: z.string().min(1).max(80), activityId: z.string().min(1).max(80) };
const duration = z.number().int().min(0).max(3_600_000).optional();

export async function markSeenAction(input: unknown) {
  const { user } = await requireLearner();
  const parsed = z.object({ ...ids, durationMs: duration }).parse(input);
  await markTeachSeen({
    userId: user.id,
    activity: lessonActivity(parsed.lessonId, parsed.activityId),
    durationMs: parsed.durationMs,
  });
}

export type CheckResult = { ok: true; result: SubmitResult } | { ok: false; error: string };

export async function checkActivityAction(input: unknown): Promise<CheckResult> {
  const { user } = await requireLearner();
  const parsed = z
    .object({
      ...ids,
      response: activityResponseSchema,
      hinted: z.boolean().optional(),
      durationMs: duration,
      sessionId: z.string().max(64).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Resposta inválida." };
  try {
    const result = await submitActivity({
      userId: user.id,
      activity: lessonActivity(parsed.data.lessonId, parsed.data.activityId),
      response: parsed.data.response,
      context: parsed.data.sessionId ? "session" : "lesson",
      lessonId: parsed.data.lessonId,
      sessionId: parsed.data.sessionId,
      hinted: parsed.data.hinted,
      durationMs: parsed.data.durationMs,
    });
    return { ok: true, result };
  } catch (error) {
    if (error instanceof PracticeError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function saveStepAction(input: unknown) {
  const { user } = await requireLearner();
  const parsed = z
    .object({ lessonId: ids.lessonId, stepIndex: z.number().int().min(0).max(100) })
    .parse(input);
  await saveLessonStep(user.id, parsed.lessonId, parsed.stepIndex);
}

export async function completeLessonAction(input: unknown) {
  const { user } = await requireLearner();
  const parsed = z.object({ lessonId: ids.lessonId, score: z.number().min(0).max(1) }).parse(input);
  await completeLesson(user.id, parsed.lessonId, parsed.score);
  const ref = getContent().lessons.get(parsed.lessonId);
  const next = ref ? getContent().paths[ref.track][ref.order + 1] : undefined;
  return next ? { id: next.lesson.id, title: next.lesson.title.pt } : null;
}
