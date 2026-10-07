import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";

describe.skipIf(!hasTestDatabase)("database schema", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());

  it("stores a learner profile and memory traces keyed by concept × dimension", async () => {
    const user = await createTestUser();
    await db.learnerProfile.create({
      data: {
        userId: user.id,
        goals: ["move_quebec", "work"],
        destination: "canada_quebec",
        priorExperience: "a_little",
        dailyMinutes: 30,
      },
    });
    const base = {
      userId: user.id,
      conceptId: "lex:avoir-besoin-de",
      due: new Date(),
      stability: 1,
      difficulty: 5,
      elapsedDays: 0,
      scheduledDays: 0,
      learningSteps: 0,
      reps: 0,
      lapses: 0,
      state: 0,
      source: "lesson" as const,
    };
    await db.memoryTrace.createMany({
      data: [
        { ...base, dimension: "recognition" },
        { ...base, dimension: "speaking" },
      ],
    });

    const profile = await db.learnerProfile.findUniqueOrThrow({ where: { userId: user.id } });
    expect(profile.goals).toEqual(["move_quebec", "work"]);
    expect(profile.correctionMode).toBe("important_only");
    expect(await db.memoryTrace.count({ where: { userId: user.id } })).toBe(2);
  });

  it("deletes every learner record when the account is deleted (LGPD)", async () => {
    const user = await createTestUser();
    await db.studyEvent.create({ data: { userId: user.id, type: "test" } });
    await db.conversation.create({
      data: {
        userId: user.id,
        correctionMode: "report_only",
        level: "A2",
        turns: { create: [{ role: "learner", content: "Bonjour !" }] },
      },
    });

    await db.user.delete({ where: { id: user.id } });

    expect(await db.studyEvent.count()).toBe(0);
    expect(await db.conversation.count()).toBe(0);
    expect(await db.conversationTurn.count()).toBe(0);
  });
});
