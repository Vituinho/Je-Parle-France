import { z } from "zod";
import { getSpeech, SpeechProviderError } from "@/lib/ai/speech";
import { getContent } from "@/lib/content";
import { localDate } from "@/lib/learning/time";
import { db } from "@/server/db";
import { consumeQuota, QuotaError } from "@/server/quota";
import { getCurrentUser } from "@/server/session";

const querySchema = z.object({
  attemptId: z.string().min(1).max(64),
  itemId: z.string().min(1).max(64),
});

/** Opaque assessment audio: neither the URL nor the client payload names the correct word. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Faça login para continuar.", { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return new Response("Pedido inválido.", { status: 400 });
  const { attemptId, itemId } = parsed.data;
  const attempt = await db.placementAttempt.findFirst({
    where: { id: attemptId, userId: user.id, status: "in_progress", currentItemId: itemId },
    select: { id: true },
  });
  const activity = getContent().placementItems.get(itemId)?.activity;
  if (!attempt || activity?.type !== "minimal_pair") return new Response(null, { status: 404 });
  const speech = getSpeech();
  if (!speech) return new Response("Áudio do diagnóstico indisponível.", { status: 501 });
  try {
    await consumeQuota(user.id, "tts", localDate(new Date(), "UTC"), 3000);
    const result = await speech.tts.synthesize({
      text: activity.pair[activity.answer].word,
      locale: activity.region,
      gender: "f",
      rate: "normal",
    });
    return new Response(result.audio, {
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof QuotaError) return new Response(error.message, { status: 429 });
    if (error instanceof SpeechProviderError)
      return new Response("O serviço de áudio não respondeu. Tente de novo.", { status: 502 });
    throw error;
  }
}
