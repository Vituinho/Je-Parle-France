import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { pruneTelemetry } from "./telemetry-retention";
describe.skipIf(!hasTestDatabase)("telemetry detail retention", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());
  it("walks beyond an invalid prefix, expires pilot details by creation, and preserves consent/mastery/progress", async () => {
    const user = await createTestUser(),
      now = new Date("2026-10-10T12:00Z"),
      old = new Date("2026-06-01T12:00Z");
    const boundary = new Date(now.getTime() - 90 * 86400000);
    await db.pilotParticipant.create({
      data: {
        userId: user.id,
        status: "active",
        consentedAt: old,
        consentVersion: "pilot-2026-10-10-v1",
      },
    });
    await db.pilotFeedback.createMany({
      data: [
        {
          id: "old-feedback",
          userId: user.id,
          context: "weekly",
          sourceId: "2026-06-01",
          difficulty: "hard",
          text: "PRIVATE",
          createdAt: old,
          updatedAt: now,
        },
        {
          id: "boundary-feedback",
          userId: user.id,
          context: "weekly",
          sourceId: "2026-07-12",
          difficulty: "balanced",
          createdAt: boundary,
        },
      ],
    });
    await db.pilotCalibration.createMany({
      data: [
        {
          id: "old-calibration",
          userId: user.id,
          sourceKind: "speech",
          sourceId: "old",
          record: { notes: "PRIVATE" },
          createdAt: old,
          updatedAt: now,
        },
        {
          id: "new-calibration",
          userId: user.id,
          sourceKind: "speech",
          sourceId: "new",
          record: {},
          createdAt: now,
        },
      ],
    });
    await db.lessonProgress.create({
      data: { userId: user.id, lessonId: "a0-u1-l1", status: "completed" },
    });
    await db.memoryTrace.create({
      data: {
        userId: user.id,
        conceptId: "lex:bonjour",
        dimension: "recall",
        due: now,
        stability: 10,
        difficulty: 5,
        elapsedDays: 4,
        scheduledDays: 10,
        learningSteps: 0,
        reps: 2,
        lapses: 0,
        state: 2,
        source: "lesson",
      },
    });
    await db.studyEvent.createMany({
      data: [
        {
          id: "legacy-a",
          userId: user.id,
          type: "activity_completed",
          payload: { text: "PRIVATE" },
          createdAt: old,
        },
        {
          id: "legacy-b",
          userId: user.id,
          type: "activity_completed",
          payload: { text: "PRIVATE" },
          createdAt: old,
        },
        {
          id: "valid-c",
          userId: user.id,
          type: "session_paused",
          payload: { blockIndex: 0 },
          createdAt: old,
        },
        {
          id: "valid-d",
          userId: user.id,
          type: "session_paused",
          payload: { blockIndex: 0 },
          createdAt: old,
        },
      ],
    });
    const snapshot = await db.memoryTrace.findMany({ where: { userId: user.id } });
    const dry = await pruneTelemetry({ now, batchSize: 2, maxBatches: 3 });
    expect(dry).toMatchObject({
      scanned: 4,
      eligibleInBatch: 2,
      feedbackEligible: 1,
      calibrationEligible: 1,
      removed: 0,
      feedbackRemoved: 0,
      calibrationRemoved: 0,
      more: false,
    });
    expect(JSON.stringify(dry)).not.toContain("PRIVATE");
    expect(await db.pilotCalibration.count()).toBe(2);
    expect(await pruneTelemetry({ now, batchSize: 2, maxBatches: 1 })).toMatchObject({
      eligibleInBatch: 0,
      more: true,
    });
    const applied = await pruneTelemetry({ now, apply: true, batchSize: 2, maxBatches: 3 });
    expect(applied).toMatchObject({
      removed: 2,
      feedbackRemoved: 1,
      calibrationRemoved: 1,
      more: false,
    });
    expect(await db.memoryTrace.findMany({ where: { userId: user.id } })).toEqual(snapshot);
    expect(await db.lessonProgress.count({ where: { userId: user.id } })).toBe(1);
    expect(await db.pilotParticipant.count({ where: { userId: user.id } })).toBe(1);
    expect(
      await db.pilotFeedback.findUnique({ where: { id: "boundary-feedback" } }),
    ).not.toBeNull();
    expect(await pruneTelemetry({ now, apply: true, batchSize: 2, maxBatches: 3 })).toMatchObject({
      removed: 0,
      feedbackRemoved: 0,
      calibrationRemoved: 0,
    });
    await expect(pruneTelemetry({ now, maxBatches: 0 })).rejects.toThrow();
    await expect(pruneTelemetry({ now, batchSize: 5001 })).rejects.toThrow();
  });
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
