"use server";

import { z } from "zod";
import { activityResponseSchema } from "@/lib/learning/grading/grade";
import { DIMENSIONS } from "@/lib/learning/skills";
import { PracticeError, type SubmitResult } from "@/server/services/practice";
import { submitReview } from "@/server/services/review";
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
});

export type ReviewCheckResult = { ok: true; result: SubmitResult } | { ok: false; error: string };

export async function checkReviewAction(input: unknown): Promise<ReviewCheckResult> {
  const { user } = await requireLearner();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Resposta inválida." };
  const { conceptId, dimension, variant, lab, date, response, hinted, durationMs, sessionId } =
    parsed.data;
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
    });
    return { ok: true, result };
  } catch (error) {
    if (error instanceof PracticeError) return { ok: false, error: error.message };
    throw error;
  }
}
