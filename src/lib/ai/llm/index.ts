import "server-only";
import { serverEnv } from "@/lib/env";
import { AnthropicProvider } from "./anthropic";
import { MockProvider } from "./mock";
import type { LLMProvider } from "./types";

export * from "./types";

let cached: LLMProvider | undefined;

/** The configured LLM provider; the labelled mock when none is configured. */
export function getLLM(): LLMProvider {
  if (cached) return cached;
  const env = serverEnv();
  cached =
    env.LLM_PROVIDER === "anthropic" && env.ANTHROPIC_API_KEY
      ? new AnthropicProvider(env.ANTHROPIC_API_KEY, env.LLM_MODEL)
      : new MockProvider();
  return cached;
}
