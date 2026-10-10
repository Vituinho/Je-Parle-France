import { z } from "zod";
import { serverEnv } from "@/lib/env";
import type { Prisma } from "@/generated/prisma/client";
import { getSpeech, SpeechProviderError } from "@/lib/ai/speech";
import { validateSpeechWav } from "@/lib/ai/speech/audio";
import { localDate } from "@/lib/learning/time";
import { db } from "@/server/db";
import { consumeQuota, QuotaError, throttle } from "@/server/quota";
import { getCurrentUser } from "@/server/session";
import { observeProvider } from "@/server/services/provider-telemetry";

const MAX_BYTES = 1_200_000; // Container cap; PCM duration is validated <=30 s (recorder caps at 15 s).

const fieldsSchema = z.object({
  referenceText: z.string().trim().min(1).max(300),
  locale: z.enum(["fr-FR", "fr-CA"]).default("fr-FR"),
  activityId: z.string().max(120).optional(),
});

/**
 * Scores a recording against a reference text. The audio is processed in
 * memory and never stored (recordings are only kept on explicit opt-in, which
 * requires object storage — not configured yet); only scores are saved.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Faça login para continuar." }, { status: 401 });
  const speech = getSpeech();
  if (!speech || !serverEnv().SPEECH_PRONUNCIATION_ENABLED)
    return Response.json({ error: "Avaliação de pronúncia não configurada." }, { status: 501 });
  if (!throttle(user.id, "speech-assess", 1000)) {
    return Response.json({ error: "Espere um instante." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const audio = form.get("audio");
  const fields = fieldsSchema.safeParse({
    referenceText: form.get("referenceText"),
    locale: form.get("locale") ?? undefined,
    activityId: form.get("activityId") ?? undefined,
  });
  if (!(audio instanceof Blob) || !fields.success) {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (audio.size === 0 || audio.size > MAX_BYTES) {
    return Response.json({ error: "Gravação muito longa ou vazia." }, { status: 413 });
  }

  try {
    const wav = await audio.arrayBuffer();
    const durationMs = validateSpeechWav(wav);
    const env = serverEnv();
    await consumeQuota(
      user.id,
      "speech",
      localDate(new Date(), "UTC"),
      env.SPEECH_DAILY_REQUESTS,
      durationMs,
      env.SPEECH_DAILY_MINUTES * 60_000,
    );
    const result = await observeProvider(
      user.id,
      {
        provider: "azure",
        operation: "pronunciation",
        simulated: false,
        audioMs: durationMs,
        locale: fields.data.locale,
      },
      () => speech.pronunciation.assess(wav, fields.data.referenceText, fields.data.locale),
      (result) => (result.status === "error" ? { status: "failed", reason: "unavailable" } : {}),
    );
    const attempt = await db.speechAttempt.create({
      data: {
        userId: user.id,
        targetText: fields.data.referenceText,
        activityId: fields.data.activityId ?? null,
        provider: speech.pronunciation.id,
        locale: fields.data.locale,
        durationMs,
        transcript: result.transcript,
        scores: {
          status: result.status,
          scores: result.scores,
          words: result.words,
        } as unknown as Prisma.InputJsonValue,
      },
    });
    return Response.json({
      ...result,
      features: speech.pronunciation.features(fields.data.locale),
      attemptId: attempt.id,
    });
  } catch (error) {
    if (error instanceof QuotaError)
      return Response.json({ error: error.message }, { status: 429 });
    if (error instanceof SpeechProviderError) {
      if (error.reason === "malformed_audio")
        return Response.json({ error: "Gravação inválida. Grave novamente." }, { status: 400 });
      return Response.json(
        { error: "O serviço de fala não respondeu. Tente de novo." },
        { status: 502 },
      );
    }
    throw error;
  }
}
