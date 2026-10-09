import { z } from "zod";
import { getSpeech } from "@/lib/ai/speech";
import { hashString } from "@/lib/learning/random";
import { localDate } from "@/lib/learning/time";
import { consumeQuota, QuotaError } from "@/server/quota";
import { getCurrentUser } from "@/server/session";
import { observeProvider } from "@/server/services/provider-telemetry";

const querySchema = z.object({
  text: z.string().trim().min(1).max(300),
  locale: z.enum(["fr-FR", "fr-CA"]).default("fr-FR"),
  gender: z.enum(["f", "m"]).default("f"),
  rate: z.enum(["slow", "normal"]).default("normal"),
});

/** Small in-memory cache: course audio is highly repetitive, synthesis is not free. */
const cache = new Map<number, { audio: ArrayBuffer; contentType: string }>();
const MAX_ENTRIES = 400;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const speech = getSpeech();
  if (!speech) return new Response("Server TTS not configured", { status: 501 });

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return new Response("Bad request", { status: 400 });
  const key = hashString(JSON.stringify(parsed.data));

  let entry = cache.get(key);
  if (!entry) {
    try {
      await consumeQuota(user.id, "tts", localDate(new Date(), "UTC"), 3000);
    } catch (error) {
      if (error instanceof QuotaError) return new Response(error.message, { status: 429 });
      throw error;
    }
    entry = await observeProvider(
      user.id,
      {
        provider: "azure",
        operation: "tts",
        simulated: false,
        locale: parsed.data.locale,
        textCharacters: parsed.data.text.length,
      },
      () => speech.tts.synthesize(parsed.data),
    );
    if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as number);
    cache.set(key, entry);
  }
  return new Response(entry.audio, {
    headers: {
      "Content-Type": entry.contentType,
      "Cache-Control": "private, max-age=604800",
    },
  });
}
