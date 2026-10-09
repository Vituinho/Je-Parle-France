import { describe, expect, it } from "vitest";
import { activeSliceSchema, learningEventSchema } from "./events";

describe("private learning metadata", () => {
  it("rejects private content, arbitrary events and oversized timing", () => {
    expect(
      learningEventSchema.safeParse({
        type: "activity_completed",
        payload: { attemptId: "attempt-1", masteryChanges: [], transcript: "private" },
      }).success,
    ).toBe(false);
    expect(learningEventSchema.safeParse({ type: "password", payload: {} }).success).toBe(false);
    expect(
      activeSliceSchema.safeParse({
        streamId: crypto.randomUUID(),
        activityId: "task-1",
        sequence: 1,
        activeMs: 30001,
      }).success,
    ).toBe(false);
  });
  it("accepts only bounded educational references", () => {
    expect(
      learningEventSchema.parse({
        type: "activity_completed",
        payload: {
          attemptId: "attempt-1",
          masteryChanges: [
            {
              conceptId: "lex:bonjour",
              dimension: "recall",
              before: "introduced",
              after: "learning",
            },
          ],
        },
      }).type,
    ).toBe("activity_completed");
  });
});
