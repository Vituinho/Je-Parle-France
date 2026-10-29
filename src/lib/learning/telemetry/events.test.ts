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

const event = {
  type: "skill_estimate_changed",
  payload: {
    skill: "listening",
    before: "A0",
    after: "A0",
    thetaBefore: -0.4,
    thetaAfter: 0,
    reason: "collecting",
    evidenceCount: 1,
    evidenceDays: 1,
    method: "objective",
  },
};

describe("skill estimate telemetry", () => {
  it("accepts the entire placement grid without changing values", () => {
    for (const theta of [-0.75, -0.4, 0, 6, 6.75]) {
      const value = {
        ...event,
        payload: { ...event.payload, thetaBefore: theta, thetaAfter: theta },
      };
      expect(learningEventSchema.parse(value)).toEqual(value);
    }
  });
  it.each([-0.751, 6.751, NaN, Infinity, -Infinity])(
    "rejects invalid theta %s in either field",
    (theta) => {
      for (const field of ["thetaBefore", "thetaAfter"]) {
        expect(
          learningEventSchema.safeParse({ ...event, payload: { ...event.payload, [field]: theta } })
            .success,
        ).toBe(false);
      }
    },
  );
});
