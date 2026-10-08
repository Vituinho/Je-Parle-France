import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { getCourseMap } from "./course";
import { completeOnboarding } from "./onboarding";
import { completeLesson, lessonActivity, markTeachSeen } from "./practice";
import { getTodaySession, sessionPlan } from "./session";

async function learner(destination: "canada_quebec" | "france", dailyMinutes: 15 | 60 = 15) {
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: [destination === "france" ? "move_france" : "move_quebec"],
    destination,
    priorExperience: "never",
    dailyMinutes,
    targetLevel: "B1",
    start: "from_zero",
  });
  const profile = await db.learnerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  return { user, profile };
}

describe.skipIf(!hasTestDatabase)("course map and destination tracks", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());

  it("shows every path with the learner's lesson states", async () => {
    const { user, profile } = await learner("canada_quebec");
    const map = await getCourseMap(user.id, profile);
    expect(map.map((track) => track.track)).toEqual(["core", "canada", "france"]);
    const canada = map.find((track) => track.track === "canada")!;
    expect(canada.total).toBeGreaterThanOrEqual(5);
    expect(canada.units[0]?.lessons[0]).toMatchObject({ id: "ca-u1-l1", state: "new" });
    expect(canada.units[0]?.mission?.id).toBe("scn-cafe-montreal");

    await markTeachSeen({ userId: user.id, activity: lessonActivity("ca-u1-l1", "ca-u1-l1-t1") });
    await completeLesson(user.id, "ca-u1-l1", 0.9);
    const after = await getCourseMap(user.id, profile);
    const lesson = after
      .find((track) => track.track === "canada")!
      .units[0]!.lessons.find((l) => l.id === "ca-u1-l1");
    expect(lesson?.state).toBe("completed");
    expect(after.find((track) => track.track === "canada")!.completed).toBe(1);
  });

  it("puts a destination-track lesson in a long session for someone relocating", async () => {
    const { user, profile } = await learner("france", 60);
    const plan = sessionPlan(await getTodaySession(user.id, profile));
    const lessons = plan.blocks.filter((block) => block.kind === "lesson");
    expect(lessons[0]).toMatchObject({ lessonId: "a0-u1-l1" });
    expect(lessons.some((block) => block.kind === "lesson" && block.lessonId === "fr-u1-l1")).toBe(
      true,
    );
  });
});
