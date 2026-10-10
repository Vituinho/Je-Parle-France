import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
const flags = vi.hoisted(() => ({ enabled: true }));
vi.mock("@/lib/env", async () => {
  const actual = await vi.importActual<typeof import("@/lib/env")>("@/lib/env");
  return { ...actual, serverEnv: () => ({ ...actual.serverEnv(), PILOT_ENABLED: flags.enabled }) };
});
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { completeOnboarding } from "./onboarding";
import { exportUserData } from "./account";
import {
  acceptPilotConsent,
  invitePilotParticipant,
  recordPilotFeedback,
  withdrawPilotConsent,
  finishPilotParticipant,
} from "./pilot-participation";
import { PILOT_CONSENT_VERSION } from "@/lib/pilot/schema";
const now = new Date("2026-10-10T12:00:00Z");
const consent = { version: PILOT_CONSENT_VERSION, accepted: true };
async function learner() {
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: ["personal"],
    destination: "france",
    priorExperience: "never",
    dailyMinutes: 30,
    targetLevel: null,
    start: "from_zero",
  });
  return user;
}
async function operator() {
  const user = await learner();
  await db.user.update({ where: { id: user.id }, data: { role: "admin" } });
  return user;
}
async function activeSession(userId: string) {
  return db.dailySession.create({
    data: {
      userId,
      localDate: "2026-10-10",
      plannedMinutes: 30,
      plan: {},
      status: "in_progress",
      startedAt: now,
    },
  });
}
describe.skipIf(!hasTestDatabase)("consented controlled pilot", () => {
  beforeEach(async () => {
    await resetDatabase();
    flags.enabled = true;
  });
  afterAll(() => db.$disconnect());
  it("requires durable admin enrollment and the learner's current, repeat-safe consent", async () => {
    const admin = await operator(),
      user = await learner();
    await expect(invitePilotParticipant(user.id, admin.id, now)).rejects.toThrow(
      "Admin authorization",
    );
    await expect(acceptPilotConsent(user.id, consent, now)).rejects.toThrow("convite");
    expect(await invitePilotParticipant(admin.id, user.id, now)).toMatchObject({
      status: "invited",
      consentedAt: null,
    });
    await expect(
      acceptPilotConsent(user.id, { ...consent, accepted: false }, now),
    ).rejects.toThrow();
    expect(await acceptPilotConsent(user.id, consent, now)).toMatchObject({
      status: "active",
      consentVersion: PILOT_CONSENT_VERSION,
      consentedAt: now,
    });
    expect(
      (await acceptPilotConsent(user.id, consent, new Date("2026-10-11T12:00:00Z"))).consentedAt,
    ).toEqual(now);
    await db.user.update({ where: { id: admin.id }, data: { role: "learner" } });
    await expect(invitePilotParticipant(admin.id, user.id, now)).rejects.toThrow(
      "Admin authorization",
    );
  });
  it("stores perception separately, rejects foreign/pre-consent sources and avoids repeated prompts", async () => {
    const admin = await operator(),
      user = await learner(),
      other = await learner();
    const source = await activeSession(user.id),
      foreign = await activeSession(other.id);
    const input = {
      context: "session",
      sourceId: source.id,
      difficulty: "hard",
      text: "Som baixo",
    };
    await expect(recordPilotFeedback(user.id, input, now)).rejects.toThrow("aceite");
    await invitePilotParticipant(admin.id, user.id, now);
    await acceptPilotConsent(user.id, consent, now);
    await expect(
      recordPilotFeedback(user.id, { ...input, sourceId: foreign.id }, now),
    ).rejects.toThrow("atividade sua");
    await db.dailySession.update({
      where: { id: source.id },
      data: { startedAt: new Date(now.getTime() - 1) },
    });
    await expect(recordPilotFeedback(user.id, input, now)).rejects.toThrow("atividade sua");
    await db.dailySession.update({ where: { id: source.id }, data: { startedAt: now } });
    const estimates = await db.skillEstimate.findMany({ where: { userId: user.id } });
    const traces = await db.memoryTrace.findMany({ where: { userId: user.id } });
    expect(await recordPilotFeedback(user.id, input, now)).toMatchObject({ difficulty: "hard" });
    await expect(recordPilotFeedback(user.id, input, now)).rejects.toThrow("já foi registrado");
    const second = await activeSession(user.id);
    await expect(
      recordPilotFeedback(user.id, { ...input, sourceId: second.id }, now),
    ).rejects.toThrow("hoje");
    expect(await db.skillEstimate.findMany({ where: { userId: user.id } })).toEqual(estimates);
    expect(await db.memoryTrace.findMany({ where: { userId: user.id } })).toEqual(traces);
    expect((await exportUserData(user.id)).pilotFeedback[0]).toMatchObject({
      text: "Som baixo",
      difficulty: "hard",
    });
    expect((await exportUserData(other.id)).pilotFeedback).toEqual([]);
  });
  it("withdraws even when disabled, purges calibration/feedback and keeps product progress", async () => {
    const admin = await operator(),
      user = await learner();
    await invitePilotParticipant(admin.id, user.id, now);
    await acceptPilotConsent(user.id, consent, now);
    const session = await activeSession(user.id);
    await recordPilotFeedback(
      user.id,
      { context: "session", sourceId: session.id, difficulty: "balanced" },
      now,
    );
    await db.pilotCalibration.create({
      data: { userId: user.id, sourceKind: "speech", sourceId: "fixture", record: {} },
    });
    flags.enabled = false;
    await expect(
      recordPilotFeedback(
        user.id,
        { context: "weekly", sourceId: "2026-10-05", difficulty: "easy" },
        now,
      ),
    ).rejects.toThrow("pausado");
    await withdrawPilotConsent(user.id, now);
    expect(await db.pilotParticipant.findUnique({ where: { userId: user.id } })).toMatchObject({
      status: "withdrawn",
      consentVersion: PILOT_CONSENT_VERSION,
      withdrawnAt: now,
    });
    expect(await db.pilotFeedback.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.pilotCalibration.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.dailySession.count({ where: { userId: user.id } })).toBe(1);
    expect(await db.learnerProfile.count({ where: { userId: user.id } })).toBe(1);
  });
  it("finishes without tuning and cascades pilot rows on account deletion", async () => {
    const admin = await operator(),
      user = await learner();
    await invitePilotParticipant(admin.id, user.id, now);
    await acceptPilotConsent(user.id, consent, now);
    const session = await activeSession(user.id);
    await recordPilotFeedback(
      user.id,
      { context: "session", sourceId: session.id, difficulty: "easy" },
      now,
    );
    await db.pilotCalibration.create({
      data: {
        userId: user.id,
        reviewerId: admin.id,
        sourceKind: "speech",
        sourceId: "fixture",
        record: {},
      },
    });
    expect(await finishPilotParticipant(admin.id, user.id, now)).toMatchObject({
      status: "finished",
      finishedAt: now,
    });
    await expect(
      recordPilotFeedback(
        user.id,
        { context: "weekly", sourceId: "2026-10-05", difficulty: "easy" },
        now,
      ),
    ).rejects.toThrow("aceite");
    await db.user.delete({ where: { id: user.id } });
    expect(await db.pilotParticipant.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.pilotFeedback.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.pilotCalibration.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.user.count({ where: { id: admin.id } })).toBe(1);
  });
});
