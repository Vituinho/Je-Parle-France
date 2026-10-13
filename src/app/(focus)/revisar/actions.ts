"use server";

import { z } from "zod";
import { activityResponseSchema } from "@/lib/learning/grading/grade";
import { DIMENSIONS } from "@/lib/learning/skills";
import { PracticeError, type SubmitResult } from "@/server/services/practice";
import { submitReview, reviewIsStale } from "@/server/services/review";
import { requireLearner } from "@/server/session";

const reviewSchema = z.object({
  conceptId: z.string().min(1).max(80),
  dimension: z.enum(DIMENSIONS),
  variant: z.number().int().min(0).max(99).optional(),
  lab: z.boolean().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  response: activityResponseSchema,
  hinted: z.boolean().optional(),
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
  sessionId: z.string().max(64).optional(),
  scheduleVersion: z.string().max(150).optional(),
  correctiveRetry: z.boolean().optional(),
  blockIndex: z.number().int().min(0).max(500).optional(),
});

export type ReviewCheckResult =
  { ok: true; result: SubmitResult } | { ok: true; skipped: true } | { ok: false; error: string };

const referenceSchema = reviewSchema.omit({ response: true, hinted: true, durationMs: true });
export async function checkReviewStateAction(
  input: unknown,
): Promise<{ ok: true; stale: boolean } | { ok: false; error: string }> {
  const { user } = await requireLearner();
  const parsed = referenceSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Não foi possível atualizar esta revisão. Recarregue a página para continuar.",
    };
  const {
    conceptId,
    dimension,
    variant,
    date,
    sessionId,
    lab,
    scheduleVersion,
    correctiveRetry,
    blockIndex,
  } = parsed.data;
  try {
    return {
      ok: true,
      stale: await reviewIsStale({
        userId: user.id,
        item: { conceptId, dimension, variant },
        date,
        sessionId,
        context: sessionId ? "session" : lab ? "lab" : "review",
        scheduleVersion,
        correctiveRetry,
        blockIndex,
      }),
    };
  } catch {
    return {
      ok: false,
      error: "Não foi possível atualizar esta revisão. Recarregue a página para continuar.",
    };
  }
}

export async function checkReviewAction(input: unknown): Promise<ReviewCheckResult> {
  const { user } = await requireLearner();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Resposta inválida." };
  const {
    conceptId,
    dimension,
    variant,
    lab,
    date,
    response,
    hinted,
    durationMs,
    sessionId,
    scheduleVersion,
    correctiveRetry,
    blockIndex,
  } = parsed.data;
  try {
    const result = await submitReview({
      userId: user.id,
      item: { conceptId, dimension, variant },
      date,
      response,
      context: sessionId ? "session" : lab ? "lab" : "review",
      sessionId,
      hinted,
      durationMs,
      scheduleVersion,
      correctiveRetry,
      blockIndex,
    });
    if ("skipped" in result) return { ok: true, skipped: true };
    return { ok: true, result };
  } catch (error) {
    if (error instanceof PracticeError) return { ok: false, error: error.message };
    throw error;
  }
}
