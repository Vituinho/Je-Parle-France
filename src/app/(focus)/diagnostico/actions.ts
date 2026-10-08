"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { activityResponseSchema } from "@/lib/learning/grading/grade";
import { SKILLS } from "@/lib/learning/skills";
import {
  answerPlacement,
  chooseStartLesson,
  loadPlacement,
  PlacementError,
  skipPlacement,
  startPlacement,
  type PlacementView,
} from "@/server/services/placement";
import { requireLearner } from "@/server/session";

const startSchema = z.object({
  mode: z.enum(["quick", "complete", "skill"]),
  skill: z.enum(SKILLS).optional(),
});

export async function startPlacementAction(formData: FormData) {
  const { user } = await requireLearner();
  const parsed = startSchema.parse({
    mode: formData.get("mode"),
    skill: formData.get("skill") || undefined,
  });
  const attemptId = await startPlacement(
    user.id,
    parsed.mode,
    parsed.mode === "skill" && parsed.skill ? [parsed.skill] : [],
  );
  redirect(`/diagnostico/${attemptId}`);
}

export async function skipPlacementAction() {
  const { user } = await requireLearner();
  await skipPlacement(user.id);
  redirect("/hoje");
}

const answerSchema = z.object({
  attemptId: z.string().min(1).max(64),
  itemId: z.string().min(1).max(64),
  response: z.union([activityResponseSchema, z.object({ kind: z.literal("dont_know") })]),
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
});

export type AnswerResult = { ok: true; view: PlacementView } | { ok: false; error: string };

export async function answerPlacementAction(input: unknown): Promise<AnswerResult> {
  const { user } = await requireLearner();
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Resposta inválida." };
  const { attemptId, itemId, response, durationMs } = parsed.data;
  try {
    await answerPlacement(user.id, attemptId, itemId, response, durationMs);
    return { ok: true, view: await loadPlacement(user.id, attemptId) };
  } catch (error) {
    if (!(error instanceof PlacementError)) throw error;
    // The page may be stale (answered in another tab): return the current state.
    try {
      const view = await loadPlacement(user.id, attemptId);
      if (view.status === "completed" || view.itemId !== itemId) return { ok: true, view };
      return { ok: false, error: error.message };
    } catch {
      return { ok: false, error: error.message };
    }
  }
}

export async function chooseStartAction(formData: FormData) {
  const { user } = await requireLearner();
  const lessonId = z.string().min(1).max(80).parse(formData.get("lessonId"));
  await chooseStartLesson(user.id, lessonId);
  redirect("/hoje");
}
