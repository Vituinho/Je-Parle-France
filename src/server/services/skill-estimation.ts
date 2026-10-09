import "server-only";
import type { Prisma, EstimateMethod } from "@/generated/prisma/client";
import { CEFR_LEVELS, levelIndex, readTheta } from "@/lib/learning/cefr";
import {
  evidenceSchema,
  evidenceWeight,
  estimateSkill,
  initialEstimate,
  type ContinuousEstimate,
  type SkillCalibration,
  type SkillEvidence,
} from "@/lib/learning/skill-estimation/estimate";
import type { Skill } from "@/lib/learning/skills";

/** Serialize learner-state updates, including practice and placement recalibration. */
export async function lockLearner(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
}

/** Inserts are idempotent and estimate updates happen in the caller's learning transaction. */
export async function recordSkillEvidence(
  tx: Prisma.TransactionClient,
  userId: string,
  inputs: readonly SkillEvidence[],
  now: Date,
) {
  if (!inputs.length) return;
  await lockLearner(tx, userId);
  const affected = new Set<Skill>();
  for (const input of inputs) {
    const e = evidenceSchema.parse(input);
    const result = await tx.skillEvidence.createMany({
      data: [{ userId, ...e }],
      skipDuplicates: true,
    });
    if (result.count && evidenceWeight(e, now) > 0) affected.add(e.skill);
  }
  for (const skill of affected) {
    const row = await tx.skillEstimate.findUnique({ where: { userId_skill: { userId, skill } } });
    if (!row) continue; // Onboarding owns initialization, never infer other skills.
    let calibration: SkillCalibration = {
      mean: row.calibrationTheta ?? row.theta,
      sd: row.calibrationSd ?? row.sd,
      at: row.calibratedAt ?? row.updatedAt,
      method: row.calibrationMethod ?? row.method,
    };
    let previous: ContinuousEstimate = {
      mean: row.theta,
      sd: row.sd,
      band: CEFR_LEVELS[row.displayBand ?? levelIndex(readTheta(row.theta).level)] ?? "A0",
      reason: "collecting",
      evidenceCount: row.evidenceCount,
      evidenceDays: row.evidenceDays,
      distinctTasks: row.distinctTasks,
      effectiveWeight: row.effectiveWeight,
    };
    // Sound perception does not initialize production ability. Preserve the old diagnostic report.
    if (skill === "pronunciation" && calibration.method === "perception") {
      calibration = { mean: 0.5, sd: 1.5, at: calibration.at, method: "not_assessed" };
      previous = initialEstimate(calibration);
    }
    const rows = await tx.skillEvidence.findMany({
      where: { userId, skill, occurredAt: { gte: calibration.at, lte: now } },
      orderBy: { occurredAt: "desc" },
      take: 500,
    });
    const evidence = rows.map((e) => evidenceSchema.parse(e));
    const estimate = estimateSkill({ skill, calibration, previous, evidence, now });
    const measured = evidence.filter(
      (e) =>
        (e.assessment === "deterministic" || e.assessment === "provider") &&
        e.substantial &&
        e.confidence >= 0.5 &&
        e.quality >= 0.5 &&
        now.getTime() - e.occurredAt.getTime() <= 90 * 86_400_000,
    );
    const measuredPractice =
      estimate.evidenceCount >= 6 &&
      estimate.distinctTasks >= 3 &&
      measured.length >= 6 &&
      new Set(measured.map((e) => e.taskId)).size >= 3;
    const method: EstimateMethod = measuredPractice
      ? "objective"
      : skill === "pronunciation" && row.method === "perception"
        ? "not_assessed"
        : skill === "writing" &&
            evidence.some((e) => e.assessment === "ai") &&
            ["self_report", "self_assessment", "not_assessed"].includes(row.method)
          ? "ai_assessment"
          : row.method;
    await tx.skillEstimate.update({
      where: { userId_skill: { userId, skill } },
      data: {
        theta: estimate.mean,
        sd: estimate.sd,
        displayBand: levelIndex(estimate.band),
        reason: estimate.reason,
        evidenceCount: estimate.evidenceCount,
        evidenceDays: estimate.evidenceDays,
        distinctTasks: estimate.distinctTasks,
        effectiveWeight: estimate.effectiveWeight,
        calibrationTheta: calibration.mean,
        calibrationSd: calibration.sd,
        calibratedAt: calibration.at,
        calibrationMethod: calibration.method,
        method,
        assessed:
          measuredPractice ||
          method === "ai_assessment" ||
          (row.assessed && method !== "not_assessed"),
        source: "practice",
        // Weak/hinted fragments cannot refresh the age of measured ability.
        lastEvidenceAt: measured[0]?.occurredAt ?? row.lastEvidenceAt,
      },
    });
    if (estimate.band !== previous.band)
      await tx.studyEvent.create({
        data: {
          userId,
          type: "skill_estimate_changed",
          payload: {
            skill,
            before: previous.band,
            after: estimate.band,
            reason: estimate.reason,
            evidenceCount: estimate.evidenceCount,
            evidenceDays: estimate.evidenceDays,
          },
        },
      });
  }
}

/** A placement retake is a new strong baseline; the evidence table is never deleted. */
export async function calibrateSkill(
  tx: Prisma.TransactionClient,
  userId: string,
  skill: Skill,
  calibration: SkillCalibration,
  assessed: boolean,
) {
  const data = {
    theta: calibration.mean,
    sd: calibration.sd,
    source: "placement" as const,
    assessed,
    method: calibration.method,
    calibrationTheta: calibration.mean,
    calibrationSd: calibration.sd,
    calibratedAt: calibration.at,
    calibrationMethod: calibration.method,
    displayBand: levelIndex(readTheta(calibration.mean).level),
    evidenceCount: 0,
    evidenceDays: 0,
    distinctTasks: 0,
    effectiveWeight: 0,
    reason: "calibration",
    lastEvidenceAt: null,
  };
  await tx.skillEstimate.upsert({
    where: { userId_skill: { userId, skill } },
    create: { userId, skill, ...data },
    update: data,
  });
}
