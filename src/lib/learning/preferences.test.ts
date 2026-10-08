import { describe, expect, it } from "vitest";
import { isTimeZone, preferencesSchema } from "./preferences";

const valid = {
  name: "Ana",
  dailyMinutes: 15,
  weeklyGoalDays: 5,
  destination: "canada_quebec",
  targetLevel: "B1",
  targetMonth: "2027-06",
  correctionMode: "important_only",
  supportPreference: "auto",
  timezone: "America/Toronto",
};

describe("preferencesSchema", () => {
  it("accepts a complete set of preferences", () => {
    expect(preferencesSchema.parse(valid)).toMatchObject({ dailyMinutes: 15, targetLevel: "B1" });
  });

  it("accepts form strings and empty optional fields", () => {
    const parsed = preferencesSchema.parse({
      ...valid,
      dailyMinutes: "30",
      weeklyGoalDays: "7",
      targetLevel: "",
      targetMonth: "",
    });
    expect(parsed).toMatchObject({ dailyMinutes: 30, weeklyGoalDays: 7, targetLevel: null });
    expect(parsed.targetMonth).toBeUndefined();
  });

  it("rejects values outside the offered choices", () => {
    expect(preferencesSchema.safeParse({ ...valid, dailyMinutes: 20 }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...valid, weeklyGoalDays: 2 }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...valid, targetLevel: "A0" }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...valid, timezone: "Mars/Olympus" }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...valid, name: "  " }).success).toBe(false);
  });
});

describe("isTimeZone", () => {
  it("knows IANA zones", () => {
    expect(isTimeZone("Europe/Paris")).toBe(true);
    expect(isTimeZone("Nowhere/Land")).toBe(false);
  });
});
