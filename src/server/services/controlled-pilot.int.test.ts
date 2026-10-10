import { afterAll, beforeEach, describe, it, expect, vi } from "vitest";
const flags = vi.hoisted(() => ({ enabled: true }));
vi.mock("@/lib/env", async () => {
  const actual = await vi.importActual<typeof import("@/lib/env")>("@/lib/env");
  return { ...actual, serverEnv: () => ({ ...actual.serverEnv(), PILOT_ENABLED: flags.enabled }) };
});
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { getControlledPilotReport } from "./controlled-pilot";
import { PILOT_CONSENT_VERSION } from "@/lib/pilot/schema";
import { withdrawPilotConsent } from "./pilot-participation";
const now = new Date("2026-10-10T12:00Z"),
  consent = new Date("2026-10-01T12:00Z");
describe.skipIf(!hasTestDatabase)("consented two-week report", () => {
  beforeEach(async () => {
    await resetDatabase();
    flags.enabled = true;
  });
  afterAll(() => db.$disconnect());
  it("bounds the cohort and time window, separates real/mock units and honors withdrawal/role changes", async () => {
    const admin = await createTestUser(),
      user = await createTestUser(),
      other = await createTestUser();
    await db.user.update({ where: { id: admin.id }, data: { role: "admin" } });
    await db.pilotParticipant.create({
      data: {
        userId: user.id,
        status: "active",
        consentedAt: consent,
        consentVersion: PILOT_CONSENT_VERSION,
      },
    });
    const usage = {
      provider: "anthropic",
      operation: "tutor_turn",
      simulated: false,
      status: "ok",
      reason: null,
      elapsedMs: 25,
      inputTokens: 120,
      outputTokens: 30,
      audioMs: null,
    };
    await db.studyEvent.createMany({
      data: [
        {
          userId: user.id,
          type: "provider_usage",
          payload: usage,
          createdAt: new Date("2026-10-02T12:00Z"),
        },
        {
          userId: user.id,
          type: "provider_usage",
          payload: {
            ...usage,
            provider: "mock",
            simulated: true,
            inputTokens: null,
            outputTokens: null,
          },
          createdAt: now,
        },
        {
          userId: user.id,
          type: "provider_usage",
          payload: usage,
          createdAt: new Date("2026-10-01T11:00Z"),
        },
        { userId: other.id, type: "provider_usage", payload: usage, createdAt: now },
        { userId: user.id, type: "legacy", payload: { text: "PRIVATE RESPONSE" }, createdAt: now },
      ],
    });
    await db.pilotFeedback.create({
      data: {
        userId: user.id,
        context: "weekly",
        sourceId: "2026-10-05",
        difficulty: "hard",
        text: "PRIVATE NOTE",
        createdAt: now,
      },
    });
    const range = { from: "2026-09-27", through: "2026-10-10" };
    const result = await getControlledPilotReport(admin.id, range, now);
    expect(result.participants).toHaveLength(1);
    const observation = result.participants[0]!.observation!;
    expect(observation.metrics.provider).toHaveLength(2);
    expect(observation.metrics.provider.find((p) => p.provider === "anthropic")).toMatchObject({
      requests: 1,
      inputTokens: 120,
      outputTokens: 30,
    });
    expect(observation.metrics.provider.find((p) => p.simulated)).toMatchObject({
      requests: 1,
      unknownUnits: 1,
    });
    expect(observation.difficulty.find((d) => d.difficulty === "hard")?.samples).toBe(1);
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
    expect(
      (await getControlledPilotReport(admin.id, { ...range, learner: other.id }, now)).participants,
    ).toEqual([]);
    await expect(
      getControlledPilotReport(user.id, { ...range, learner: other.id }, now),
    ).rejects.toThrow("Admin authorization");
    await withdrawPilotConsent(user.id, now);
    expect(
      (await getControlledPilotReport(admin.id, range, now)).participants[0]?.observation,
    ).toBeNull();
    flags.enabled = false;
    expect(await getControlledPilotReport(admin.id, range, now)).toMatchObject({
      enabled: false,
      participants: [],
    });
    await db.user.update({ where: { id: admin.id }, data: { role: "learner" } });
    await expect(getControlledPilotReport(admin.id, range, now)).rejects.toThrow(
      "Admin authorization",
    );
  });
});
