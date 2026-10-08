import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  achievementStatus,
  newlyEarned,
  type AchievementMetrics,
} from "./achievements";

const zero: AchievementMetrics = {
  placementCompleted: 0,
  lessonsCompleted: 0,
  unitsCompleted: 0,
  sessionsCompleted: 0,
  trackLessons: 0,
  wordsLearned: 0,
  wordsStrong: 0,
  reviewsDone: 0,
  conversations: 0,
  streakDays: 0,
  weeksInARow: 0,
};

describe("achievements", () => {
  it("has unique ids and positive targets", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    expect(ACHIEVEMENTS.every((a) => a.target > 0)).toBe(true);
  });

  it("awards nothing to a learner who has not done anything", () => {
    expect(newlyEarned(zero, new Set())).toEqual([]);
  });

  it("awards milestones once their target is reached, and only once", () => {
    const metrics = { ...zero, lessonsCompleted: 3, wordsLearned: 30, streakDays: 6 };
    const first = newlyEarned(metrics, new Set()).map((a) => a.id);
    expect(first).toEqual(["first-lesson", "words-25"]);
    expect(newlyEarned(metrics, new Set(first))).toEqual([]);
  });

  it("keeps earned milestones when a metric later drops and caps progress at the target", () => {
    const earnedAt = new Date("2026-10-01T12:00:00Z");
    const status = achievementStatus(
      { ...zero, streakDays: 2, wordsLearned: 140 },
      new Map([["streak-7", earnedAt]]),
    );
    const streak = status.find((a) => a.id === "streak-7");
    expect(streak).toMatchObject({ earned: true, value: 2, earnedAt: earnedAt.toISOString() });
    expect(status.find((a) => a.id === "words-100")).toMatchObject({ earned: false, value: 100 });
  });
});
