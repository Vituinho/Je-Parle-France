import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
const flags = vi.hoisted(() => ({ enabled: true }));
vi.mock("@/lib/env", async () => {
  const actual = await vi.importActual<typeof import("@/lib/env")>("@/lib/env");
  return { ...actual, serverEnv: () => ({ ...actual.serverEnv(), PILOT_ENABLED: flags.enabled }) };
});
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { completeOnboarding } from "./onboarding";
import {
  invitePilotParticipant,
  acceptPilotConsent,
  withdrawPilotConsent,
} from "./pilot-participation";
import { PILOT_CONSENT_VERSION } from "@/lib/pilot/schema";
import { getContent } from "@/lib/content";
import { WRITING_CRITERIA } from "@/lib/learning/writing/assessment";
import {
  listPilotAssessments,
  previewPilotAssessment,
  addPilotCalibrationSample,
  savePilotHumanReview,
  getPilotCalibrationReport,
  getPilotCalibrationDetail,
} from "./pilot-assessments";
import type { Prisma } from "@/generated/prisma/client";
const now = new Date("2026-10-10T12:00:00Z"),
  accepted = new Date("2026-10-10T09:00:00Z");
async function setup() {
  const admin = await createTestUser();
  await db.user.update({ where: { id: admin.id }, data: { role: "admin" } });
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: ["personal"],
    destination: "france",
    priorExperience: "never",
    dailyMinutes: 30,
    targetLevel: null,
    start: "from_zero",
  });
  await invitePilotParticipant(admin.id, user.id, accepted);
  await acceptPilotConsent(user.id, { version: PILOT_CONSENT_VERSION, accepted: true }, accepted);
  return { admin, user };
}
async function speech(userId: string, locale: string | null = "fr-CA") {
  return db.speechAttempt.create({
    data: {
      userId,
      provider: "azure",
      locale,
      activityId: "authored-cafe",
      targetText: "Bonjour.",
      transcript: "PRIVATE TRANSCRIPT",
      scores: {
        status: "ok",
        scores: { overall: 82, accuracy: 85, fluency: 75, completeness: 90, prosody: null },
      },
      createdAt: now,
    },
  });
}
async function writing(userId: string) {
  const activity = getContent().placementItems.get("pw-a2-ow")?.activity;
  if (activity?.type !== "open_writing" || !activity.rubric)
    throw new Error("No authored writing fixture");
  const criteria = Object.fromEntries(
    WRITING_CRITERIA.map((c) => [c, { band: 3, evidence: ["PRIVATE EXCERPT"] }]),
  );
  const attempt = await db.placementAttempt.create({
    data: { userId, mode: "complete", skills: ["writing"], plan: {}, status: "completed" },
  });
  return db.placementResponse.create({
    data: {
      attemptId: attempt.id,
      itemId: "pw-a2-ow",
      skill: "writing",
      score: 0.75,
      answer: {
        writingAssessment: {
          version: 1,
          method: "ai_assessment",
          original: "PRIVATE ORIGINAL WRITING",
          expectedLevel: activity.rubric.expectedLevel,
          criteria,
          confidence: 0.8,
          score: 0.75,
          model: "fixture-model",
        },
      } as Prisma.InputJsonValue,
      createdAt: now,
    },
  });
}
describe.skipIf(!hasTestDatabase)("authorized human calibration from real product records", () => {
  beforeEach(async () => {
    await resetDatabase();
    flags.enabled = true;
  });
  afterAll(() => db.$disconnect());
  it("keeps an uncertain writing score null while allowing human review of validated bands", async () => {
    const { admin, user } = await setup(),
      source = await writing(user.id);
    const answer = source.answer as unknown as { writingAssessment: Record<string, unknown> };
    await db.placementResponse.update({
      where: { id: source.id },
      data: {
        answer: {
          writingAssessment: { ...answer.writingAssessment, score: null, confidence: 0.4 },
        } as Prisma.InputJsonValue,
        scored: false,
      },
    });
    const preview = await previewPilotAssessment(
      admin.id,
      user.id,
      { kind: "writing_placement", id: source.id },
      now,
    );
    expect(preview.record).toMatchObject({
      kind: "writing",
      systemScore: null,
      systemConfidence: 0.4,
    });
  });
  it("requires admin, consent, ownership, post-consent timing and known speech locale", async () => {
    const { admin, user } = await setup(),
      other = await createTestUser();
    const own = await speech(user.id),
      foreign = await speech(other.id),
      legacy = await speech(user.id, null);
    await expect(listPilotAssessments(user.id, user.id, now)).rejects.toThrow(
      "Admin authorization",
    );
    await expect(
      previewPilotAssessment(admin.id, user.id, { kind: "speech", id: foreign.id }, now),
    ).rejects.toThrow("não encontrada");
    await expect(
      previewPilotAssessment(admin.id, user.id, { kind: "speech", id: legacy.id }, now),
    ).rejects.toThrow("não encontrada");
    const inventory = await listPilotAssessments(admin.id, user.id, now);
    expect(inventory.sources.map((r) => r.id)).toEqual([own.id]);
    expect(JSON.stringify(inventory)).not.toContain("PRIVATE");
    await db.speechAttempt.update({
      where: { id: own.id },
      data: { createdAt: new Date(accepted.getTime() - 1) },
    });
    await expect(
      previewPilotAssessment(admin.id, user.id, { kind: "speech", id: own.id }, now),
    ).rejects.toThrow("não encontrada");
    await withdrawPilotConsent(user.id, now);
    await expect(listPilotAssessments(admin.id, user.id, now)).rejects.toThrow("aceite");
  });
  it("uses writing rubric bands, returns comparison counts, and stores no duplicated response/excerpts", async () => {
    const { admin, user } = await setup(),
      source = await writing(user.id);
    const estimates = await db.skillEstimate.findMany({ where: { userId: user.id } });
    const sample = await addPilotCalibrationSample(
      admin.id,
      user.id,
      { kind: "writing_placement", id: source.id },
      now,
    );
    expect(
      await addPilotCalibrationSample(
        admin.id,
        user.id,
        { kind: "writing_placement", id: source.id },
        now,
      ),
    ).toEqual(sample);
    expect(await getPilotCalibrationReport(admin.id, user.id, now)).toMatchObject({
      report: { samples: 1, compared: 0 },
    });
    const preview = await previewPilotAssessment(
      admin.id,
      user.id,
      { kind: "writing_placement", id: source.id },
      now,
    );
    expect(preview.sourceText).toBe("PRIVATE ORIGINAL WRITING");
    const scores = Object.fromEntries(WRITING_CRITERIA.map((c) => [c, c === "grammar" ? 1 : 3]));
    const report = await savePilotHumanReview(
      admin.id,
      user.id,
      sample.id,
      { kind: "writing", scores, notes: "PRIVATE REVIEW NOTE" },
      now,
    );
    expect(report).toMatchObject({ compared: 1, thresholdsChanged: false });
    expect(report.writing.find((r) => r.criterion === "grammar")).toMatchObject({
      samples: 1,
      meanDifference: 2,
      largeDisagreements: 1,
    });
    const stored = await db.pilotCalibration.findUniqueOrThrow({ where: { id: sample.id } });
    expect(JSON.stringify(stored.record)).not.toContain("PRIVATE ORIGINAL");
    expect(JSON.stringify(stored.record)).not.toContain("PRIVATE EXCERPT");
    expect(JSON.stringify(await getPilotCalibrationReport(admin.id, user.id, now))).not.toContain(
      "PRIVATE",
    );
    expect(await getPilotCalibrationDetail(admin.id, user.id, sample.id, now)).toMatchObject({
      sourceText: "PRIVATE ORIGINAL WRITING",
      record: { notes: "PRIVATE REVIEW NOTE" },
    });
    expect(await db.skillEstimate.findMany({ where: { userId: user.id } })).toEqual(estimates);
    await db.user.update({ where: { id: admin.id }, data: { role: "learner" } });
    await expect(
      savePilotHumanReview(
        admin.id,
        user.id,
        sample.id,
        { kind: "writing", scores, notes: "" },
        now,
      ),
    ).rejects.toThrow("Admin authorization");
  });
  it("separates speech locales/ordinal ratings and refuses cross-participant samples or unobserved audio", async () => {
    const { admin, user } = await setup(),
      { user: other } = await setup(),
      source = await speech(user.id);
    const sample = await addPilotCalibrationSample(
      admin.id,
      user.id,
      { kind: "speech", id: source.id },
      now,
    );
    const human = {
      kind: "speech",
      pronunciationBand: 3,
      intelligibilityBand: 4,
      agreesWithSystem: true,
      heardConsentedSample: true,
      notes: "",
    };
    await expect(
      savePilotHumanReview(
        admin.id,
        user.id,
        sample.id,
        { ...human, heardConsentedSample: false },
        now,
      ),
    ).rejects.toThrow();
    const report = await savePilotHumanReview(admin.id, user.id, sample.id, human, now);
    expect(report.speech).toContainEqual({ locale: "fr-CA", samples: 1, agreements: 1 });
    expect(report.speech).toContainEqual({ locale: "fr-FR", samples: 0, agreements: 0 });
    expect(report.comparisons[0]).not.toHaveProperty("modelMinusHuman");
    await expect(savePilotHumanReview(admin.id, other.id, sample.id, human, now)).rejects.toThrow(
      "Amostra deste participante",
    );
    await expect(getPilotCalibrationDetail(admin.id, other.id, sample.id, now)).rejects.toThrow(
      "Amostra deste participante",
    );
    flags.enabled = false;
    await expect(savePilotHumanReview(admin.id, user.id, sample.id, human, now)).rejects.toThrow(
      "pausado",
    );
    await withdrawPilotConsent(user.id, now);
    expect(await db.pilotCalibration.count({ where: { userId: user.id } })).toBe(0);
  });
});
