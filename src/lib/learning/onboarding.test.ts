import { describe, expect, it } from "vitest";
import {
  estimateTimeToLevel,
  experiencePrior,
  minutesPerDayForDeadline,
  monthsUntil,
  onboardingSchema,
  recommendedStart,
} from "./onboarding";

const valid = {
  goals: ["move_quebec", "work"],
  destination: "canada_quebec",
  priorExperience: "a_little",
  dailyMinutes: 30,
  targetLevel: "B2",
  start: "quick",
};

describe("onboarding schema", () => {
  it("accepts a complete answer set", () => {
    expect(onboardingSchema.safeParse(valid).success).toBe(true);
  });

  it("requires at least one goal and a description for 'other'", () => {
    expect(onboardingSchema.safeParse({ ...valid, goals: [] }).success).toBe(false);
    const other = onboardingSchema.safeParse({ ...valid, goals: ["other"] });
    expect(other.success).toBe(false);
    expect(
      onboardingSchema.safeParse({ ...valid, goals: ["other"], goalOther: "Ler Proust" }).success,
    ).toBe(true);
  });

  it("accepts bounded custom durations and real target levels", () => {
    expect(onboardingSchema.safeParse({ ...valid, dailyMinutes: 20 }).success).toBe(true);
    expect(onboardingSchema.safeParse({ ...valid, dailyMinutes: 241 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...valid, targetLevel: "A0" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...valid, targetLevel: null }).success).toBe(true);
  });
});

describe("experience priors", () => {
  it("increase with reported experience and stay wide when unknown", () => {
    expect(experiencePrior("never").mean).toBeLessThan(experiencePrior("a_little").mean);
    expect(experiencePrior("a_little").mean).toBeLessThan(experiencePrior("advanced").mean);
    expect(experiencePrior("unknown").sd).toBeGreaterThan(experiencePrior("intermediate").sd);
  });

  it("recommends starting from zero only for true beginners", () => {
    expect(recommendedStart("never")).toBe("from_zero");
    expect(recommendedStart("intermediate")).toBe("quick");
  });
});

describe("time to level", () => {
  it("gives a range, never a single promise", () => {
    const estimate = estimateTimeToLevel({
      currentTheta: 0,
      targetLevel: "B1",
      dailyMinutes: 30,
      daysPerWeek: 5,
    });
    expect(estimate.hours).toEqual([350, 400]);
    expect(estimate.months[0]).toBeLessThan(estimate.months[1]);
    // 30 min × 5 days ≈ 10.8 h/month → 350 h ≈ 33 months
    expect(estimate.months[0]).toBe(33);
  });

  it("counts what the learner already knows", () => {
    const fromA2 = estimateTimeToLevel({
      currentTheta: 2,
      targetLevel: "B1",
      dailyMinutes: 30,
      daysPerWeek: 5,
    });
    expect(fromA2.hours).toEqual([170, 220]);
  });

  it("recognises a target already reached", () => {
    expect(
      estimateTimeToLevel({
        currentTheta: 3.2,
        targetLevel: "B1",
        dailyMinutes: 15,
        daysPerWeek: 5,
      }).alreadyThere,
    ).toBe(true);
  });

  it("computes months until a deadline and the daily time it would take", () => {
    expect(monthsUntil("2027-10", new Date(2026, 9, 7))).toBe(12);
    expect(monthsUntil("2020-01", new Date(2026, 9, 7))).toBe(0);
    expect(minutesPerDayForDeadline(130, 12, 5)).toBe(30);
    expect(minutesPerDayForDeadline(100, 0, 5)).toBeNull();
  });
});
