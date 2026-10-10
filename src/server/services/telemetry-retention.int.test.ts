import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { pruneTelemetry } from "./telemetry-retention";
describe.skipIf(!hasTestDatabase)("telemetry detail retention", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());
  it("defaults to dry run and removes only validated operational detail older than ninety days", async () => {
    const user = await createTestUser(),
      now = new Date("2026-10-09T12:00:00Z"),
      old = new Date("2026-06-01T12:00:00Z");
    await db.dailyActivity.create({
      data: { userId: user.id, localDate: "2026-06-01", activeSeconds: 120 },
    });
    await db.studyEvent.createMany({
      data: [
        { userId: user.id, type: "session_paused", payload: { blockIndex: 0 }, createdAt: old },
        { userId: user.id, type: "session_paused", payload: { blockIndex: 1 }, createdAt: now },
        { userId: user.id, type: "lesson_completed", payload: { lessonId: "old" }, createdAt: old },
        {
          userId: user.id,
          type: "activity_completed",
          payload: { text: "PRIVATE LEGACY PAYLOAD" },
          createdAt: old,
        },
        {
          userId: user.id,
          type: "skill_estimate_changed",
          payload: { before: "A1", after: "A2" },
          createdAt: old,
        },
      ],
    });
    expect(await pruneTelemetry({ now })).toMatchObject({
      dryRun: true,
      eligibleInBatch: 1,
      removed: 0,
    });
    expect(await db.studyEvent.count()).toBe(5);
    expect(await pruneTelemetry({ now, apply: true })).toMatchObject({ dryRun: false, removed: 1 });
    expect(await db.studyEvent.count()).toBe(4);
    expect(
      await db.dailyActivity.findUniqueOrThrow({
        where: { userId_localDate: { userId: user.id, localDate: "2026-06-01" } },
      }),
    ).toMatchObject({ activeSeconds: 120 });
    expect((await pruneTelemetry({ now, apply: true })).removed).toBe(0);
  });
});
