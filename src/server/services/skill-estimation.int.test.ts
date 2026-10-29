import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getContent } from "@/lib/content";
import { levelIndex } from "@/lib/learning/cefr";
import type { SkillEvidence } from "@/lib/learning/skill-estimation/estimate";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { oracleResponse } from "@/test/oracle";
import { completeOnboarding } from "./onboarding";
import { activitySeed, submitActivity } from "./practice";
import { getLearnerLevel } from "./learner";
import { calibrateSkill, lockLearner, recordSkillEvidence } from "./skill-estimation";
import { exportUserData, deletePrivateData } from "./account";
import { learningEventSchema } from "@/lib/learning/telemetry/events";
const START = new Date("2026-10-01T12:00:00Z");
async function learner() {
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: ["move_quebec"],
    destination: "canada_quebec",
    priorExperience: "a_little",
    dailyMinutes: 30,
    targetLevel: "B2",
    start: "quick",
  });
  await db.$transaction(async (tx) => {
    await lockLearner(tx, user.id);
    await calibrateSkill(
      tx,
      user.id,
      "listening",
      { mean: 2.5, sd: 0.4, at: START, method: "objective" },
      true,
    );
  });
  return user;
}
const fixture = (id: number): SkillEvidence => ({
  key: `fixture-${id}`,
  taskId: `task-${id}`,
  skill: "listening",
  difficulty: 3.5,
  score: 1,
  confidence: 1,
  quality: 1,
  guess: 0.25,
  occurredAt: new Date(START.getTime() + (id + 1) * 86_400_000),
  concepts: [],
  source: "lesson",
  assessment: "deterministic",
  substantial: true,
});
describe.skipIf(!hasTestDatabase)("continuous skill persistence", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());
  it("persists learning and telemetry after a negative placement calibration", async () => {
    const user = await learner();
    await db.$transaction((tx) =>
      calibrateSkill(
        tx,
        user.id,
        "listening",
        { mean: -0.4, sd: 0.4, at: START, method: "objective" },
        true,
      ),
    );
    const before = await db.skillEstimate.findUniqueOrThrow({
      where: { userId_skill: { userId: user.id, skill: "listening" } },
    });
    expect(before).toMatchObject({ theta: -0.4, calibrationTheta: -0.4, displayBand: 0 });
    await db.$transaction((tx) =>
      recordSkillEvidence(tx, user.id, [fixture(0)], fixture(0).occurredAt),
    );
    const updated = await db.skillEstimate.findUniqueOrThrow({
      where: { userId_skill: { userId: user.id, skill: "listening" } },
    });
    expect(updated.theta).toBeGreaterThan(before.theta);
    expect(updated.calibrationTheta).toBe(-0.4);
    expect(updated.displayBand).toBe(0);
    expect(await db.skillEvidence.count({ where: { userId: user.id } })).toBe(1);
    const event = await db.studyEvent.findFirstOrThrow({
      where: { userId: user.id, type: "skill_estimate_changed" },
    });
    expect(event.payload).toMatchObject({ thetaBefore: -0.4, thetaAfter: updated.theta });
    await db.$transaction((tx) =>
      recordSkillEvidence(tx, user.id, [fixture(1)], fixture(1).occurredAt),
    );
    expect(await db.skillEvidence.count({ where: { userId: user.id } })).toBe(2);
    expect(
      await db.studyEvent.count({ where: { userId: user.id, type: "skill_estimate_changed" } }),
    ).toBeGreaterThanOrEqual(1);
  });
  it("real authored activities persist skill evidence atomically with memory and deduplicate repeats", async () => {
    const user = await learner();
    const ref = [...getContent().activities.values()].find(
      (r) =>
        r.activity.type === "listening" &&
        getContent().lessons.get(r.lessonId)?.unit.level === "B1",
    )!;
    const now = new Date("2026-10-02T12:00:00Z");
    const params = {
      userId: user.id,
      activity: ref.activity,
      response: oracleResponse(ref.activity, activitySeed(user.id), true),
      context: "lesson" as const,
      lessonId: ref.lessonId,
      now,
    };
    const before = (await getLearnerLevel(user.id)).skills;
    await Promise.all([submitActivity(params), submitActivity(params)]);
    expect(await db.activityAttempt.count({ where: { userId: user.id } })).toBe(2);
    expect(await db.skillEvidence.count({ where: { userId: user.id, source: "lesson" } })).toBe(1);
    const after = (await getLearnerLevel(user.id)).skills;
    expect(after.listening.theta).toBeGreaterThan(before.listening.theta);
    expect(after.listening.level).toBe("A2");
    expect(after.speaking.theta).toBe(before.speaking.theta);
    expect(await db.memoryTrace.count({ where: { userId: user.id } })).toBeGreaterThan(0);
    expect((await exportUserData(user.id)).skillEvidence).toHaveLength(1);
  });
  it("rolls back invalid metadata with the surrounding learning transaction", async () => {
    const user = await learner();
    await expect(
      db.$transaction(async (tx) => {
        await tx.studyEvent.create({ data: { userId: user.id, type: "must_rollback" } });
        await recordSkillEvidence(
          tx,
          user.id,
          [{ ...fixture(0), confidence: 2 }],
          fixture(0).occurredAt,
        );
      }),
    ).rejects.toThrow();
    expect(await db.studyEvent.count({ where: { userId: user.id, type: "must_rollback" } })).toBe(
      0,
    );
    expect(await db.skillEvidence.count({ where: { userId: user.id } })).toBe(0);
  });
  it("keeps an old calibration uncertain after a hinted comprehension success", async () => {
    const user = await learner();
    const now = new Date();
    const past = new Date(now.getTime() - 180 * 86_400_000);
    await db.skillEstimate.update({
      where: { userId_skill: { userId: user.id, skill: "listening" } },
      data: { calibratedAt: past, lastEvidenceAt: null },
    });
    expect((await getLearnerLevel(user.id)).skills.listening.confidence).toBe("low");
    const ref = [...getContent().activities.values()].find(
      (r) =>
        r.activity.type === "listening" &&
        getContent().lessons.get(r.lessonId)?.unit.level === "B1",
    )!;
    await submitActivity({
      userId: user.id,
      activity: ref.activity,
      lessonId: ref.lessonId,
      response: oracleResponse(ref.activity, activitySeed(user.id), true),
      context: "lesson",
      hinted: true,
      now,
    });
    const estimate = (await getLearnerLevel(user.id)).skills.listening;
    expect(estimate).toMatchObject({ level: "A2", confidence: "low", evidenceCount: 0 });
    expect(estimate.explanation).toContain("confirmação recente");
    expect(
      (
        await db.skillEstimate.findUniqueOrThrow({
          where: { userId_skill: { userId: user.id, skill: "listening" } },
        })
      ).lastEvidenceAt,
    ).toBeNull();
  });
  it("keeps evidence history and refreshes calibration on a retake", async () => {
    const user = await learner();
    for (let i = 0; i < 24; i++)
      await db.$transaction((tx) =>
        recordSkillEvidence(tx, user.id, [fixture(i)], fixture(i).occurredAt),
      );
    expect((await getLearnerLevel(user.id)).skills.listening.level).toBe("B1");
    await db.$transaction(async (tx) => {
      await lockLearner(tx, user.id);
      await calibrateSkill(
        tx,
        user.id,
        "listening",
        { mean: 2.7, sd: 0.3, at: new Date("2026-11-01T12:00:00Z"), method: "objective" },
        true,
      );
    });
    const estimate = await db.skillEstimate.findUniqueOrThrow({
      where: { userId_skill: { userId: user.id, skill: "listening" } },
    });
    expect(estimate).toMatchObject({
      theta: 2.7,
      displayBand: levelIndex("A2"),
      reason: "calibration",
      evidenceCount: 0,
    });
    expect(await db.skillEvidence.count({ where: { userId: user.id } })).toBe(24);
    const events = await db.studyEvent.findMany({
      where: { userId: user.id, type: "skill_estimate_changed" },
    });
    const changes = events
      .map((e) => learningEventSchema.parse({ type: e.type, payload: e.payload }))
      .filter((e) => e.type === "skill_estimate_changed");
    expect(changes.length).toBeGreaterThan(1);
    expect(changes.filter((e) => e.payload.before !== e.payload.after)).toHaveLength(1);
    expect(changes.every((e) => e.payload.thetaAfter > e.payload.thetaBefore)).toBe(true);
  });
  it("deleting speech assessments also removes derived speech evidence, and account deletion cascades", async () => {
    const user = await learner();
    const e = {
      ...fixture(0),
      skill: "pronunciation" as const,
      source: "speech" as const,
      assessment: "provider" as const,
    };
    await db.$transaction((tx) => recordSkillEvidence(tx, user.id, [e], e.occurredAt));
    expect(await db.skillEvidence.count({ where: { userId: user.id } })).toBe(1);
    await deletePrivateData(user.id, { speech: true, conversations: false, corrections: false });
    expect(await db.skillEvidence.count({ where: { userId: user.id } })).toBe(0);
    await db.$transaction((tx) =>
      recordSkillEvidence(tx, user.id, [fixture(1)], fixture(1).occurredAt),
    );
    await db.user.delete({ where: { id: user.id } });
    expect(await db.skillEvidence.count({ where: { userId: user.id } })).toBe(0);
  });
});
