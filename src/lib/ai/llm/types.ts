import type { z } from "zod";

/**
 * Provider-agnostic LLM interface (ADR-004). Business logic depends on this,
 * never on a vendor SDK. Every provider reports whether its output is
 * simulated so the UI can label it and assessments can ignore it.
 */
export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export type LLMEffort = "low" | "medium" | "high";

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface GenerateObjectParams<T> {
  /** Stable instructions (cacheable). */
  system: string;
  messages: LLMMessage[];
  schema: z.ZodType<T>;
  /** What the call is for — used by mocks to produce plausible output, and for logs. */
  purpose: "tutor_turn" | "tutor_report" | "writing_feedback";
  effort?: LLMEffort;
  maxTokens?: number;
}

export interface GenerateObjectResult<T> {
  object: T;
  usage: LLMUsage;
  simulated: boolean;
  model: string;
}

export interface LLMProvider {
  readonly id: "anthropic" | "mock";
  readonly simulated: boolean;
  generateObject<T>(params: GenerateObjectParams<T>): Promise<GenerateObjectResult<T>>;
}

/** The provider declined (safety) or could not produce valid output. */
export class LLMUnavailableError extends Error {
  constructor(
    message: string,
    readonly reason: "refusal" | "invalid_output" | "rate_limited" | "unavailable",
  ) {
    super(message);
  }
}
