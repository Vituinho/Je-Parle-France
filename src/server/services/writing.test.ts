import { beforeEach, describe, expect, it, vi } from "vitest";
import { openWritingActivitySchema } from "@/lib/content/schema";
import { WRITING_CRITERIA } from "@/lib/learning/writing/assessment";
import { LLMUnavailableError } from "@/lib/ai/llm/types";
vi.mock("./provider-telemetry", () => ({
  observeProvider: <T>(_user: string, _metadata: unknown, call: () => Promise<T>) => call(),
}));
const mocks = vi.hoisted(() => ({
  generateObject: vi.fn(),
  consumeQuota: vi.fn(),
  simulated: false,
}));
vi.mock("@/lib/ai/llm", async () => ({
  ...(await vi.importActual("@/lib/ai/llm/types")),
  getLLM: () => ({ simulated: mocks.simulated, generateObject: mocks.generateObject }),
}));
vi.mock("@/lib/env", () => ({ serverEnv: () => ({ WRITING_DAILY_ASSESSMENTS: 10 }) }));
vi.mock("@/server/quota", () => ({
  consumeQuota: mocks.consumeQuota,
  addUsageUnits: vi.fn(),
  throttle: () => true,
}));
import { evaluateWriting } from "./writing";
const activity = openWritingActivitySchema.parse({
  id: "writing-test",
  type: "open_writing",
  prompt: { pt: "Apresente-se." },
  minWords: 3,
  modelAnswer: "Bonjour.",
  focus: ["Clareza"],
  rubric: { version: 1, expectedLevel: "A2", taskRequirements: ["Identidade", "Objetivo"] },
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.simulated = false;
});
describe("writing provider orchestration", () => {
  it("does not call a mock for assessment", async () => {
    mocks.simulated = true;
    expect(await evaluateWriting("user", activity, "Bonjour je suis Ana")).toMatchObject({
      score: null,
      method: "not_assessed",
    });
    expect(mocks.generateObject).not.toHaveBeenCalled();
    expect(mocks.consumeQuota).not.toHaveBeenCalled();
  });
  it("preserves an answer during a provider failure", async () => {
    mocks.generateObject.mockRejectedValueOnce(new LLMUnavailableError("Indisponível.", "timeout"));
    expect(await evaluateWriting("user", activity, "Bonjour je suis Ana")).toMatchObject({
      original: "Bonjour je suis Ana",
      score: null,
      limitations: ["Indisponível."],
    });
  });
  it("rejects simulated or fabricated output from a real-configured provider", async () => {
    const object = {
      criteria: Object.fromEntries(
        WRITING_CRITERIA.map((c) => [c, { band: 3, evidence: ["invented"] }]),
      ),
      confidence: 0.9,
      feedbackPt: "Bien",
      limitations: [],
      issues: [],
    };
    for (const simulated of [true, false]) {
      mocks.generateObject.mockResolvedValueOnce({
        object,
        model: "test",
        simulated,
        usage: { inputTokens: 1, outputTokens: 1 },
      });
      expect((await evaluateWriting("user", activity, "Bonjour je suis Ana")).score).toBeNull();
    }
  });
});
