import { z } from "zod";
import { serverEnv } from "@/lib/env";
import { getSpeech, SpeechProviderError } from "@/lib/ai/speech";
import { validateSpeechWav } from "@/lib/ai/speech/audio";
import { localDate } from "@/lib/learning/time";
import { consumeQuota, QuotaError, throttle } from "@/server/quota";
import { getCurrentUser } from "@/server/session";
import { observeProvider } from "@/server/services/provider-telemetry";

const MAX_BYTES = 1_200_000; // Container cap; PCM duration is validated <=30 s (recorder caps at 15 s).

const fieldsSchema = z.object({ locale: z.enum(["fr-FR", "fr-CA"]).default("fr-FR") });

/**
 * Transcribes a spoken tutor turn. Nothing is stored here: the audio is
 * processed in memory, and the transcript only becomes data if the learner
 * reviews it and sends it as a message.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Faça login para continuar." }, { status: 401 });
  const speech = getSpeech();
  if (!speech || !serverEnv().SPEECH_STT_ENABLED)
    return Response.json({ error: "Reconhecimento de fala não configurado." }, { status: 501 });
  if (!throttle(user.id, "speech-transcribe", 1000)) {
    return Response.json({ error: "Espere um instante." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const audio = form.get("audio");
  const fields = fieldsSchema.safeParse({ locale: form.get("locale") ?? undefined });
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
        operation: "stt",
        simulated: false,
        audioMs: durationMs,
        locale: fields.data.locale,
      },
      () => speech.stt.transcribe(wav, fields.data.locale),
      (result) => (result.status === "error" ? { status: "failed", reason: "unavailable" } : {}),
    );
    return Response.json(result);
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
