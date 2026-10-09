import "server-only";

type Reason =
  "unavailable" | "timeout" | "rate_limited" | "invalid_output" | "unsupported" | "refusal";
type Operation =
  | "capabilities"
  | "tts"
  | "stt"
  | "pronunciation"
  | "tutor_turn"
  | "tutor_report"
  | "writing_feedback";

/** Deliberately accepts no Error, request, text, audio, user ID or credentials. */
export function reportProviderFailure(
  provider: "azure" | "anthropic",
  operation: Operation,
  reason: Reason,
) {
  if (process.env.NODE_ENV !== "test") {
    console.warn(JSON.stringify({ event: "provider_failure", provider, operation, reason }));
  }
}
