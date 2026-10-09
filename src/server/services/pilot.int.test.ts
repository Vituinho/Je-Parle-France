import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { getPilotReport, comparePilotCalibration } from "./pilot";
import { calibrationTemplate } from "../../../scripts/calibration-kit";
describe.skipIf(!hasTestDatabase)("pilot authorization and scope", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());
  it("checks the durable admin role before reports, filters, timeline or calibration; returns no private legacy payload", async () => {
    const admin = await createTestUser({ name: "PRIVATE NAME" });
    const user = await createTestUser();
    const now = new Date("2026-10-09T12:00:00Z");
    const filters = { from: "2026-10-01", through: "2026-10-09", learner: user.id };
    await expect(getPilotReport(user.id, filters, now)).rejects.toThrow("Admin authorization");
    await expect(comparePilotCalibration(user.id, calibrationTemplate())).rejects.toThrow(
      "Admin authorization",
    );
    await db.user.update({ where: { id: admin.id }, data: { role: "admin" } });
    const session = await db.dailySession.create({
      data: {
        userId: user.id,
        localDate: "2026-10-09",
        plannedMinutes: 90,
        activeSeconds: 10,
        plan: {
          version: 1,
          date: "2026-10-09",
          minutes: 90,
          pace: "accelerated",
          seconds: 60,
          blocks: [],
        },
      },
    });
    await db.studyEvent.create({
      data: {
        userId: user.id,
        type: "legacy",
        payload: { text: "PRIVATE CONVERSATION" },
        createdAt: now,
      },
    });
    const result = await getPilotReport(admin.id, { ...filters, pace: "accelerated" }, now);
    expect(result.learners[0]?.sessions[0]?.activeSeconds).toBe(10);
    await db.activityAttempt.create({
      data: {
        userId: user.id,
        sessionId: session.id,
        activityId: "test-listening",
        type: "listening",
        context: "session",
        score: 1,
        correct: true,
        level: "A2",
        hinted: false,
        selfRated: false,
        createdAt: now,
      },
    });
    await db.skillEvidence.create({
      data: {
        userId: user.id,
        key: "test-listening",
        taskId: "test-listening",
        skill: "listening",
        difficulty: 2,
        score: 1,
        confidence: 1,
        quality: 1,
        guess: 0,
        occurredAt: now,
        concepts: [],
        source: "lesson",
        assessment: "deterministic",
        substantial: true,
      },
    });
    expect(
      (await getPilotReport(admin.id, { ...filters, level: "A2", skill: "listening" }, now))
        .learners[0]?.sessions,
    ).toHaveLength(1);
    expect(
      (await getPilotReport(admin.id, { ...filters, level: "A1" }, now)).learners[0]?.sessions,
    ).toHaveLength(0);
    expect(result.timeline[0]?.metadata).toBeNull();
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
    expect(
      (await getPilotReport(admin.id, { ...filters, pace: "light" }, now)).learners[0]?.sessions,
    ).toEqual([]);
    await expect(
      getPilotReport(admin.id, { ...filters, from: "2020-01-01" }, now),
    ).rejects.toThrow();
    expect(await comparePilotCalibration(admin.id, calibrationTemplate())).toMatchObject({
      samples: 3,
      compared: 0,
      thresholdsChanged: false,
    });
    await db.user.update({ where: { id: admin.id }, data: { role: "learner" } });
    await expect(getPilotReport(admin.id, filters, now)).rejects.toThrow("Admin authorization");
  });
});
