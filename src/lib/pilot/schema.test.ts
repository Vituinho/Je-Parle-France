import { describe, expect, it } from "vitest";
import { consentSchema, feedbackSchema, PILOT_CONSENT_VERSION } from "./schema";
describe("explicit pilot inputs", () => {
  it("requires the current notice and affirmative consent", () => {
    expect(
      consentSchema.safeParse({ version: PILOT_CONSENT_VERSION, accepted: true }).success,
    ).toBe(true);
    for (const input of [
      { version: "old", accepted: true },
      { version: PILOT_CONSENT_VERSION, accepted: false },
      { version: PILOT_CONSENT_VERSION, accepted: true, userId: "other" },
    ])
      expect(consentSchema.safeParse(input).success).toBe(false);
  });
  it("keeps subjective feedback bounded and rejects supplied objective scores", () => {
    expect(
      feedbackSchema.parse({
        context: "session",
        sourceId: "own",
        difficulty: "hard",
        text: "  Som baixo  ",
      }),
    ).toMatchObject({ difficulty: "hard", text: "Som baixo" });
    expect(
      feedbackSchema.safeParse({
        context: "session",
        sourceId: "own",
        difficulty: "hard",
        score: 0.9,
      }).success,
    ).toBe(false);
    expect(
      feedbackSchema.safeParse({
        context: "session",
        sourceId: "own",
        difficulty: "hard",
        text: "x".repeat(501),
      }).success,
    ).toBe(false);
  });
});
