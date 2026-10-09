import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { LLMUnavailableError } from "@/lib/ai/llm/types";
import { observeProvider } from "./provider-telemetry";
import { getLearningTelemetry } from "./learning-telemetry";

describe.skipIf(!hasTestDatabase)("actual invocation telemetry", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());
  it("counts exactly one call, exposed units and safe failure reasons; preserves the provider result/error", async () => {
    const user = await createTestUser();
    const meta = {
      provider: "anthropic" as const,
      operation: "tutor_turn" as const,
      simulated: false,
    };
    const call = vi.fn(async () => ({
      usage: { inputTokens: 12, outputTokens: 8 },
      text: "PRIVATE CONVERSATION",
    }));
    expect((await observeProvider(user.id, meta, call, (r) => r.usage)).text).toBe(
      "PRIVATE CONVERSATION",
    );
    expect(call).toHaveBeenCalledTimes(1);
    const error = new LLMUnavailableError("PRIVATE PROVIDER DETAIL", "timeout");
    await expect(
      observeProvider(user.id, meta, async () => {
        throw error;
      }),
    ).rejects.toBe(error);
    await observeProvider(
      user.id,
      { ...meta, provider: "mock", simulated: true },
      async () => ({ usage: { inputTokens: 0, outputTokens: 0 } }),
      (r) => r.usage,
    );
    const events = await db.studyEvent.findMany({ where: { userId: user.id } });
    expect(events).toHaveLength(3);
    expect(JSON.stringify(events)).not.toContain("PRIVATE");
    const metrics = await getLearningTelemetry(user.id);
    expect(metrics.provider.find((p) => !p.simulated)).toMatchObject({
      requests: 2,
      failures: 1,
      inputTokens: 12,
      outputTokens: 8,
    });
    expect(metrics.provider.find((p) => p.simulated)?.requests).toBe(1);
    await db.user.delete({ where: { id: user.id } });
    // A deleted account or a telemetry DB failure must not invalidate an already generated reply.
    expect(await observeProvider(user.id, meta, async () => 42)).toBe(42);
  });
});
