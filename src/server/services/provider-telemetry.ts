import "server-only";
import { LLMUnavailableError } from "@/lib/ai/llm/types";
import { SpeechProviderError } from "@/lib/ai/speech/types";
import type { LearningEvent } from "@/lib/learning/telemetry/events";
import { db } from "@/server/db";
import { recordLearningEvent } from "./learning-events";

type Usage = Extract<LearningEvent, { type: "provider_usage" }>["payload"];
type Invocation = Pick<Usage, "provider" | "operation" | "simulated"> & {
  audioMs?: number;
  locale?: "fr-FR" | "fr-CA";
  textCharacters?: number;
};
export async function observeProvider<T>(
  userId: string,
  invocation: Invocation,
  call: () => Promise<T>,
  units?: (result: T) => Partial<Usage>,
): Promise<T> {
  const start = performance.now();
  async function record(extra: Partial<Usage>) {
    try {
      await recordLearningEvent(db, userId, {
        type: "provider_usage",
        payload: {
          ...invocation,
          audioMs: invocation.audioMs ?? null,
          inputTokens: null,
          outputTokens: null,
          status: "ok",
          reason: null,
          elapsedMs: Math.min(600000, Math.max(0, Math.round(performance.now() - start))),
          ...extra,
        },
      });
    } catch {
      // Observability must not replace or fail the original learning result. No Error contents.
      if (process.env.NODE_ENV !== "test")
        console.warn(
          JSON.stringify({ event: "telemetry_write_failed", operation: invocation.operation }),
        );
    }
  }
  let result: T;
  try {
    result = await call();
  } catch (error) {
    const reason =
      error instanceof LLMUnavailableError || error instanceof SpeechProviderError
        ? error.reason
        : "unknown";
    await record({
      status: "failed",
      reason: reason === "malformed_audio" ? "invalid_output" : reason,
    });
    throw error;
  }
  // A malformed usage extractor must never turn a successful invocation into another call/failure.
  let usage: Partial<Usage> = {};
  try {
    usage = units?.(result) ?? {};
  } catch {
    usage = {};
  }
  await record(usage);
  return result;
}
