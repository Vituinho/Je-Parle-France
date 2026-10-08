"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { LLMUnavailableError } from "@/lib/ai/llm/types";
import { CORRECTION_MODES, type StoredReport } from "@/lib/learning/tutor/tutor";
import { QuotaError } from "@/server/quota";
import { completeBlock, getSession, sessionPlan } from "@/server/services/session";
import {
  deleteConversation,
  endConversation,
  sendLearnerMessage,
  startConversation,
  TutorError,
  type TurnResult,
} from "@/server/services/tutor";
import { requireLearner } from "@/server/session";

const startSchema = z.object({
  scenarioId: z.string().max(80).optional(),
  correctionMode: z.enum(CORRECTION_MODES).optional(),
  sessionId: z.string().max(64).optional(),
});

export async function startConversationAction(formData: FormData) {
  const { user } = await requireLearner();
  const parsed = startSchema.parse({
    scenarioId: formData.get("scenarioId") || undefined,
    correctionMode: formData.get("correctionMode") || undefined,
    sessionId: formData.get("sessionId") || undefined,
  });
  const conversation = await startConversation(user.id, parsed);
  redirect(`/conversa/${conversation.id}${parsed.sessionId ? `?sessao=${parsed.sessionId}` : ""}`);
}

export type SendResult = { ok: true; turn: TurnResult } | { ok: false; error: string };

function friendly(error: unknown): string | null {
  if (
    error instanceof TutorError ||
    error instanceof QuotaError ||
    error instanceof LLMUnavailableError
  ) {
    return error.message;
  }
  return null;
}

export async function sendMessageAction(input: unknown): Promise<SendResult> {
  const { user } = await requireLearner();
  const parsed = z
    .object({
      conversationId: z.string().min(1).max(64),
      text: z.string().max(2000),
      spoken: z.boolean().optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Mensagem inválida." };
  try {
    return {
      ok: true,
      turn: await sendLearnerMessage(user.id, parsed.data.conversationId, parsed.data.text, {
        spoken: parsed.data.spoken,
      }),
    };
  } catch (error) {
    const message = friendly(error);
    if (message) return { ok: false, error: message };
    throw error;
  }
}

export type EndResult = { ok: true; report: StoredReport } | { ok: false; error: string };

export async function endConversationAction(input: unknown): Promise<EndResult> {
  const { user } = await requireLearner();
  const parsed = z
    .object({ conversationId: z.string().min(1).max(64), sessionId: z.string().max(64).optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pedido inválido." };
  try {
    const report = await endConversation(user.id, parsed.data.conversationId);
    if (parsed.data.sessionId) {
      // A conversation started from the daily session completes that block.
      const session = await getSession(user.id, parsed.data.sessionId);
      const block = sessionPlan(session).blocks[session.cursor];
      if (block?.kind === "conversation") await completeBlock(user.id, session.id, session.cursor);
    }
    return { ok: true, report };
  } catch (error) {
    const message = friendly(error);
    if (message) return { ok: false, error: message };
    throw error;
  }
}

export async function deleteConversationAction(formData: FormData) {
  const { user } = await requireLearner();
  const id = z.string().min(1).max(64).parse(formData.get("conversationId"));
  await deleteConversation(user.id, id);
  redirect("/tutor");
}
