"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { completeBlock, SessionError, startExtraSession } from "@/server/services/session";
import { requireLearner } from "@/server/session";

export async function completeBlockAction(
  input: unknown,
): Promise<{ ok: boolean; cursor?: number }> {
  const { user } = await requireLearner();
  const parsed = z
    .object({ sessionId: z.string().min(1).max(64), blockIndex: z.number().int().min(0).max(50) })
    .parse(input);
  try {
    const session = await completeBlock(user.id, parsed.sessionId, parsed.blockIndex);
    return { ok: true, cursor: session.cursor };
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
