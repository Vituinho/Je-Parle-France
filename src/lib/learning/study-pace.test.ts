import { describe, expect, it } from "vitest";
import { dailyMinutesSchema, studyPace } from "./study-pace";
import { onboardingSchema } from "./onboarding";
import { preferencesSchema } from "./preferences";

describe("study pace preferences", () => {
  it.each([5, 15, 30, 45, 60, 90, 120, 180, 75, 240])(
    "accepts %i minutes including custom time",
    (minutes) => {
      expect(dailyMinutesSchema.parse(minutes)).toBe(minutes);
    },
  );
  it.each([0, 4, 241, 20.5, NaN, Infinity])("rejects invalid budget %s", (minutes) => {
    expect(dailyMinutesSchema.safeParse(minutes).success).toBe(false);
  });
  it("infers legacy pace while preserving explicit workload independently of time", () => {
    expect([5, 15, 30, 60].map((m) => studyPace(null, m))).toEqual([
      "light",
      "light",
      "balanced",
      "balanced",
    ]);
    expect(studyPace("light", 120)).toBe("light");
    expect(studyPace("immersion", 5)).toBe("immersion");
  });
  it("validates pace in onboarding and account schemas", () => {
    expect(onboardingSchema.shape.studyPace.parse("accelerated")).toBe("accelerated");
    expect(preferencesSchema.shape.studyPace.safeParse("reckless").success).toBe(false);
    expect(preferencesSchema.shape.studyPace.parse(undefined)).toBeUndefined();
  });
});
