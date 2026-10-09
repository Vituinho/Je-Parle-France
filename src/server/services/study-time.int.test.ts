import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import type { Prisma } from "@/generated/prisma/client";
import { recordActiveSlice, recordSessionTransition } from "./study-time";
import { completeBlock } from "./session";

describe.skipIf(!hasTestDatabase)("active session telemetry", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());
  async function fixture() {
    const user = await createTestUser();
    const session = await db.dailySession.create({
      data: {
        userId: user.id,
        localDate: "2026-10-09",
        plannedMinutes: 90,
        plan: {
          version: 1,
          date: "2026-10-09",
          minutes: 90,
          seconds: 360,
          blocks: [
            { kind: "lesson", lessonId: "a0-u1-l1", track: "core", seconds: 360, reason: "core" },
          ],
        } as Prisma.InputJsonValue,
      },
    });
    return {
      user,
      session,
      slice: {
        sessionId: session.id,
        activityId: "a0-u1-l1-a1",
        streamId: crypto.randomUUID(),
        sequence: 0,
        activeMs: 0,
      },
    };
  }
  const now = new Date("2026-10-09T12:00:00Z");
  const at = (seconds: number) => new Date(now.getTime() + seconds * 1000);
  it("measures active work separately from a ninety-minute goal, deduplicates, pauses and resumes", async () => {
    const { user, session, slice } = await fixture();
    await recordActiveSlice(user.id, slice, now);
    const pulse = { ...slice, sequence: 1, activeMs: 30000 };
    expect((await recordActiveSlice(user.id, pulse, at(10))).creditedSeconds).toBe(10);
    await recordActiveSlice(user.id, pulse, at(11));
    await recordSessionTransition(user.id, session.id, "pause", at(12));
    await expect(recordActiveSlice(user.id, { ...pulse, sequence: 2 }, at(30))).rejects.toThrow(
      "pausada",
    );
    await recordSessionTransition(user.id, session.id, "start", at(60));
    const resumed = { ...slice, streamId: crypto.randomUUID() };
    await recordActiveSlice(user.id, resumed, at(60));
    await recordActiveSlice(user.id, { ...resumed, sequence: 1, activeMs: 10000 }, at(70));
    expect(await db.dailySession.findUniqueOrThrow({ where: { id: session.id } })).toMatchObject({
      plannedMinutes: 90,
      activeSeconds: 20,
    });
    expect(await db.dailyActivity.findFirstOrThrow({ where: { userId: user.id } })).toMatchObject({
      activeSeconds: 20,
      studySeconds: 0,
    });
    expect(await db.studyEvent.count({ where: { type: "session_started" } })).toBe(1);
    expect(await db.studyEvent.count({ where: { type: "session_resumed" } })).toBe(1);
    expect(await db.studyEvent.count({ where: { type: "block_started" } })).toBe(1);
    await completeBlock(user.id, session.id, 0);
    expect(await db.studyEvent.count({ where: { type: "block_completed" } })).toBe(1);
    expect(await db.studyEvent.count({ where: { type: "session_completed" } })).toBe(1);
  });
  it("bounds competing streams by shared server wall time and authorizes ownership and task membership", async () => {
    const { user, session, slice } = await fixture();
    const other = await createTestUser();
    await expect(recordActiveSlice(other.id, slice, now)).rejects.toThrow();
    await expect(
      recordActiveSlice(user.id, { ...slice, activityId: "a0-u2-l1-a1" }, now),
    ).rejects.toThrow();
    const second = { ...slice, streamId: crypto.randomUUID() };
    await recordActiveSlice(user.id, slice, now);
    await recordActiveSlice(user.id, second, now);
    await Promise.all(
      [slice, second].map((s) =>
        recordActiveSlice(user.id, { ...s, sequence: 1, activeMs: 30000 }, at(20)),
      ),
    );
    expect(
      (await db.dailySession.findUniqueOrThrow({ where: { id: session.id } })).activeSeconds,
    ).toBe(20);
    await expect(
      recordActiveSlice(
        user.id,
        { ...slice, streamId: crypto.randomUUID(), sequence: 1, activeMs: 30000 },
        at(25),
      ),
    ).rejects.toThrow("Janela");
  });
});
