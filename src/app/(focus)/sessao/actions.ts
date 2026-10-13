"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getContent } from "@/lib/content";
import { activityResponseSchema } from "@/lib/learning/grading/grade";
import { submitActivity, PracticeError } from "@/server/services/practice";
import { getSession, sessionPlan, recordedStudySeconds } from "@/server/services/session";
import type { ReviewCheckResult } from "@/app/(focus)/revisar/actions";
import { completeBlock, SessionError, startExtraSession } from "@/server/services/session";
import { requireLearner } from "@/server/session";
import { reconcileSessionReviews } from "@/server/services/review";

export async function completeBlockAction(
  input: unknown,
): Promise<{ ok: boolean; cursor?: number; recordedSeconds?: number }> {
  const { user } = await requireLearner();
  const parsed = z
    .object({ sessionId: z.string().min(1).max(64), blockIndex: z.number().int().min(0).max(50) })
    .parse(input);
  try {
    await completeBlock(user.id, parsed.sessionId, parsed.blockIndex);
    const session = await reconcileSessionReviews(user.id, parsed.sessionId);
    return {
      ok: true,
      cursor: session.cursor,
      recordedSeconds: await recordedStudySeconds(user.id, session.localDate),
    };
  } catch (error) {
    if (error instanceof SessionError) return { ok: false };
    throw error;
  }
}

export async function extraSessionAction() {
  const { user, profile } = await requireLearner();
  const session = await startExtraSession(user.id, profile);
  redirect(`/sessao?id=${session.id}`);
}

export async function checkSessionPracticeAction(input: unknown): Promise<ReviewCheckResult> {
  const { user } = await requireLearner();
  const parsed = z
    .object({
      sessionId: z.string().min(1).max(64),
      activityId: z.string().min(1).max(80),
      response: activityResponseSchema,
      hinted: z.boolean().optional(),
      durationMs: z.number().int().min(0).max(3_600_000).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Resposta inválida." };
  try {
    const session = await getSession(user.id, parsed.data.sessionId);
    const block = sessionPlan(session).blocks[session.cursor];
    if (block?.kind !== "focus" || !block.activityIds?.includes(parsed.data.activityId))
      return { ok: false, error: "Esta atividade não pertence à etapa atual." };
    const activity = getContent().activities.get(parsed.data.activityId)?.activity;
    if (!activity) return { ok: false, error: "Atividade indisponível." };
    const result = await submitActivity({
      userId: user.id,
      activity,
      context: "session",
      sessionId: session.id,
      response: parsed.data.response,
      hinted: parsed.data.hinted,
      durationMs: parsed.data.durationMs,
      scheduleMemory: false,
    });
    return { ok: true, result };
  } catch (error) {
    if (error instanceof SessionError || error instanceof PracticeError)
      return { ok: false, error: error.message };
    throw error;
  }
}
