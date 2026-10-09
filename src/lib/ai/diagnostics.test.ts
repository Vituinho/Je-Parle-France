import { afterEach, expect, it, vi } from "vitest";
import { reportProviderFailure } from "./diagnostics";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it("emits only allowlisted production diagnostic fields", () => {
  vi.stubEnv("NODE_ENV", "production");
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  reportProviderFailure("anthropic", "writing_feedback", "invalid_output");
  expect(warn).toHaveBeenCalledExactlyOnceWith(
    JSON.stringify({
      event: "provider_failure",
      provider: "anthropic",
      operation: "writing_feedback",
      reason: "invalid_output",
    }),
  );
});
