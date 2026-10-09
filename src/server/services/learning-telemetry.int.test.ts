import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { getLearningTelemetry } from "./learning-telemetry";
import { recordLearningEvent } from "./learning-events";

describe.skipIf(!hasTestDatabase)("normalized educational diagnostics", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());
  it("aggregates owned metadata and local-week active time without exporting raw responses into analytics", async () => {
    const user = await createTestUser();
    const other = await createTestUser({ email: "other@example.test" });
    const now = new Date("2026-10-09T12:00:00Z");
    await db.dailyActivity.createMany({
      data: [
        { userId: user.id, localDate: "2026-10-09", activeSeconds: 80 },
        { userId: other.id, localDate: "2026-10-09", activeSeconds: 9999 },
      ],
    });
    await db.activityAttempt.create({
      data: {
        userId: user.id,
        activityId: "test-a",
        context: "lab",
        type: "dictation",
        score: 1,
        correct: true,
        level: "A2",
        hinted: false,
        selfRated: false,
        response: { text: "PRIVATE RESPONSE" },
        createdAt: now,
      },
    });
    await db.$transaction((tx) =>
      recordLearningEvent(
        tx,
        user.id,
        {
          type: "activity_completed",
          payload: {
            attemptId: "test-a",
            masteryChanges: [
              { conceptId: "lex:word", dimension: "recall", before: "learning", after: "strong" },
            ],
          },
        },
        { now },
      ),
    );
    const result = await getLearningTelemetry(user.id, now);
    expect(result.weekly).toMatchObject({ activeSeconds: 80, strengthened: 1 });
    expect(result.activity[0]).toMatchObject({
      type: "dictation",
      level: "A2",
      completed: 1,
      correct: 1,
    });
    expect(JSON.stringify(result)).not.toContain("PRIVATE RESPONSE");
    await db.user.delete({ where: { id: user.id } });
    expect(await db.dailyActivity.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.studyEvent.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.activityAttempt.count({ where: { userId: user.id } })).toBe(0);
  });
});
