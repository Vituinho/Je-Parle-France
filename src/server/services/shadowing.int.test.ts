import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { today } from "./learner";
import { completeOnboarding } from "./onboarding";
import { startLesson } from "./practice";
import { getShadowingLines, recordShadowing } from "./shadowing";

async function learner(destination: "canada_quebec" | "france") {
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: ["move_quebec"],
    destination,
    priorExperience: "never",
    dailyMinutes: 15,
    targetLevel: "B1",
    start: "from_zero",
  });
  const profile = await db.learnerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  return { user, profile };
}

describe.skipIf(!hasTestDatabase)("shadowing", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());

  it("offers real dialogue lines, even to a brand-new learner", async () => {
    const { user, profile } = await learner("france");
    const lines = await getShadowingLines(user.id, profile, "A0");
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      const words = line.text.split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(3);
      expect(words).toBeLessThanOrEqual(16);
    }
    expect(new Set(lines.map((line) => line.text)).size).toBe(lines.length);
  });

  it("starts with lines from lessons the learner studied, destination voices first", async () => {
    const { user, profile } = await learner("canada_quebec");
    await startLesson(user.id, "ca-u2-l2");
    const lines = await getShadowingLines(user.id, profile, "A1");
    expect(lines[0]?.region).toBe("fr-CA");
    expect(lines.some((line) => line.id.startsWith("ca-u2-l2-"))).toBe(true);
  });

  it("counts practice time as study and speaking, within bounds", async () => {
    const { user, profile } = await learner("france");
    await recordShadowing(user.id, profile, 95.4);
    await recordShadowing(user.id, profile, 99_999);
    const day = await db.dailyActivity.findUniqueOrThrow({
      where: { userId_localDate: { userId: user.id, localDate: today(profile) } },
    });
    expect(day.studySeconds).toBe(95 + 1800);
    expect(day.speakingSeconds).toBe(95 + 1800);
  });
});
