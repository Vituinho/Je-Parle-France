import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getContent } from "@/lib/content";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { oracleResponse } from "@/test/oracle";
import { completeOnboarding } from "./onboarding";
import {
  activitySeed,
  completeLesson,
  lessonActivity,
  markTeachSeen,
  startLesson,
  submitActivity,
} from "./practice";

async function learner() {
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: ["move_france"],
    destination: "france",
    priorExperience: "never",
    dailyMinutes: 15,
    targetLevel: "A2",
    start: "from_zero",
  });
  return user;
}

describe.skipIf(!hasTestDatabase)("practice service", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());

  it("introduces concepts from teaching cards on every tracked dimension", async () => {
    const user = await learner();
    const teach = lessonActivity("a0-u1-l1", "a0-u1-l1-t1");
    const { introduced } = await markTeachSeen({ userId: user.id, activity: teach });
    expect(introduced).toBe(2); // lex:bonjour + cult:bonjour-social
    const traces = await db.memoryTrace.findMany({
      where: { userId: user.id, conceptId: "lex:bonjour" },
    });
    expect(traces.map((t) => t.dimension).sort()).toEqual([
      "listening",
      "recall",
      "recognition",
      "speaking",
    ]);
    expect(traces.every((t) => t.reps === 0)).toBe(true);
    // Idempotent
    expect((await markTeachSeen({ userId: user.id, activity: teach })).introduced).toBe(0);
  });

  it("grades on the server and updates only the targeted concept × dimension", async () => {
    const user = await learner();
    const activity = lessonActivity("a0-u1-l1", "a0-u1-l1-a1");
    const result = await submitActivity({
      userId: user.id,
      activity,
      response: oracleResponse(activity, activitySeed(user.id), true),
      context: "lesson",
      lessonId: "a0-u1-l1",
      durationMs: 8000,
    });
    expect(result.feedback.correct).toBe(true);
    expect(result.changes).toContainEqual({
      conceptId: "lex:bonjour",
      dimension: "recognition",
      before: "unseen",
      after: "learning",
    });
    const trace = await db.memoryTrace.findUniqueOrThrow({
      where: {
        userId_conceptId_dimension: {
          userId: user.id,
          conceptId: "lex:bonjour",
          dimension: "recognition",
        },
      },
    });
    expect(trace).toMatchObject({ reps: 1, attempts: 1, successes: 1 });
    expect(await db.memoryTrace.count({ where: { userId: user.id, dimension: "speaking" } })).toBe(
      0,
    );
    expect(await db.reviewLog.count({ where: { userId: user.id } })).toBe(1);
    const day = await db.dailyActivity.findFirstOrThrow({ where: { userId: user.id } });
    expect(day).toMatchObject({ activitiesCompleted: 1, studySeconds: 8 });
  });

  it("returns display-space feedback for a wrong answer", async () => {
    const user = await learner();
    const activity = lessonActivity("a0-u1-l1", "a0-u1-l1-a2");
    const result = await submitActivity({
      userId: user.id,
      activity,
      response: oracleResponse(activity, activitySeed(user.id), false),
      context: "lesson",
    });
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.correctOption).toBeTypeOf("number");
    const attempt = await db.activityAttempt.findFirstOrThrow({ where: { userId: user.id } });
    expect(attempt).toMatchObject({ correct: false, score: 0, context: "lesson" });
  });

  it("tracks lesson progress and keeps the best score on replays", async () => {
    const user = await learner();
    await startLesson(user.id, "a0-u1-l1");
    await completeLesson(user.id, "a0-u1-l1", 0.9);
    await startLesson(user.id, "a0-u1-l1");
    await completeLesson(user.id, "a0-u1-l1", 0.6);
    const progress = await db.lessonProgress.findUniqueOrThrow({
      where: { userId_lessonId: { userId: user.id, lessonId: "a0-u1-l1" } },
    });
    expect(progress).toMatchObject({ status: "completed", score: 0.9, runs: 2 });
  });

  it("grades speaking from a stored assessment and ignores client transcripts", async () => {
    const user = await learner();
    const speak = lessonActivity("a0-u1-l1", "a0-u1-l1-a6");
    const attempt = await db.speechAttempt.create({
      data: {
        userId: user.id,
        targetText: "Bonjour, madame. Au revoir, monsieur !",
        provider: "azure",
        transcript: "Bonjour madame. Au revoir monsieur.",
        scores: { status: "ok", scores: { overall: 90 }, words: [] },
      },
    });
    const graded = await submitActivity({
      userId: user.id,
      activity: speak,
      response: { kind: "speech", speechAttemptId: attempt.id },
      context: "lesson",
    });
    expect(graded.feedback.correct).toBe(true);
    expect(graded.feedback.score).toBeCloseTo(0.95, 2);

    await expect(
      submitActivity({
        userId: user.id,
        activity: speak,
        response: { kind: "speech", transcript: "Bonjour, madame. Au revoir, monsieur !" },
        context: "lesson",
      }),
    ).rejects.toThrow("Resposta inválida");

    const other = await learner();
    await expect(
      submitActivity({
        userId: other.id,
        activity: speak,
        response: { kind: "speech", speechAttemptId: attempt.id },
        context: "lesson",
      }),
    ).rejects.toThrow("não encontrada");
  });

  it("refuses activities that do not belong to the lesson", () => {
    expect(() => lessonActivity("a0-u1-l1", "a0-u4-l1-a1")).toThrow();
    expect(getContent().activities.get("a0-u4-l1-a1")).toBeDefined();
  });
});
