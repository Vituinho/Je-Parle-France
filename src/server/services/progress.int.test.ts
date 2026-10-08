import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { oracleResponse } from "@/test/oracle";
import { completeOnboarding } from "./onboarding";
import {
  activitySeed,
  completeLesson,
  lessonActivity,
  markTeachSeen,
  submitActivity,
} from "./practice";
import { getProgressReport, recentAchievements, syncAchievements } from "./progress";

async function learner() {
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: ["move_quebec"],
    destination: "canada_quebec",
    priorExperience: "never",
    dailyMinutes: 15,
    targetLevel: "B1",
    start: "from_zero",
  });
  const profile = await db.learnerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  return { user, profile };
}

describe.skipIf(!hasTestDatabase)("progress and achievements", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());

  it("starts empty and awards nothing before any learning", async () => {
    const { user, profile } = await learner();
    expect(await syncAchievements(user.id, profile)).toEqual([]);
    const report = await getProgressReport(user.id, profile);
    expect(report.recent).toHaveLength(28);
    expect(report.totals).toEqual({
      activeDays: 0,
      minutes: 0,
      reviews: 0,
      lessons: 0,
      conversations: 0,
    });
    expect(report.achievements.every((achievement) => !achievement.earned)).toBe(true);
    expect(report.mastery.map((row) => row.kind)).toEqual(["lexical", "grammar", "pronunciation"]);
  });

  it("awards a milestone once, shows it as recent and counts studied items", async () => {
    const { user, profile } = await learner();
    await markTeachSeen({ userId: user.id, activity: lessonActivity("a0-u1-l1", "a0-u1-l1-t1") });
    const activity = lessonActivity("a0-u1-l1", "a0-u1-l1-a1");
    await submitActivity({
      userId: user.id,
      activity,
      response: oracleResponse(activity, activitySeed(user.id), true),
      context: "lesson",
      lessonId: "a0-u1-l1",
    });
    await completeLesson(user.id, "a0-u1-l1", 1);

    const fresh = await syncAchievements(user.id, profile);
    expect(fresh.map((achievement) => achievement.id)).toEqual(["first-lesson"]);
    expect(await syncAchievements(user.id, profile)).toEqual([]);
    expect((await recentAchievements(user.id, profile)).map((a) => a.id)).toEqual(["first-lesson"]);

    const report = await getProgressReport(user.id, profile);
    expect(report.totals.lessons).toBe(1);
    const lexical = report.mastery.find((row) => row.kind === "lexical");
    const studied = Object.values(lexical?.counts ?? {}).reduce((sum, n) => sum + n, 0);
    expect(studied).toBeGreaterThan(0);
    expect(report.achievements.find((a) => a.id === "first-lesson")?.earned).toBe(true);
  });
});
