import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { oracleResponse } from "@/test/oracle";
import { completeOnboarding } from "./onboarding";
import { activitySeed, completeLesson, lessonActivity, submitActivity } from "./practice";
import { dueReviewItems, prepareReviewItems, submitReview } from "./review";
import { completeBlock, getTodaySession, sessionPlan } from "./session";

async function beginner(dailyMinutes: 5 | 15 | 30 | 60 = 15) {
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: ["move_quebec"],
    destination: "canada_quebec",
    priorExperience: "never",
    dailyMinutes,
    targetLevel: "B1",
    start: "from_zero",
  });
  const profile = await db.learnerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  return { user, profile };
}

describe.skipIf(!hasTestDatabase)("daily session", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());

  it("starts a brand-new learner with the first lesson and reuses the plan all day", async () => {
    const { user, profile } = await beginner();
    const session = await getTodaySession(user.id, profile);
    const plan = sessionPlan(session);
    expect(plan.blocks[0]).toMatchObject({ kind: "lesson", lessonId: "a0-u1-l1" });
    expect((await getTodaySession(user.id, profile)).id).toBe(session.id);
  });

  it("gives a 5-minute learner a micro-lesson", async () => {
    const { user, profile } = await beginner(5);
    const plan = sessionPlan(await getTodaySession(user.id, profile));
    const lesson = plan.blocks.find((block) => block.kind === "lesson");
    expect(lesson && lesson.kind === "lesson" ? lesson.maxSteps : undefined).toBeGreaterThan(0);
  });

  it("schedules review for what was practised and accepts review answers", async () => {
    const { user, profile } = await beginner();
    const activity = lessonActivity("a0-u1-l1", "a0-u1-l1-a1");
    const past = new Date(Date.now() - 3 * 86_400_000);
    await submitActivity({
      userId: user.id,
      activity,
      response: oracleResponse(activity, activitySeed(user.id), true),
      context: "lesson",
      now: past,
    });
    await completeLesson(user.id, "a0-u1-l1", 1);

    const due = await dueReviewItems(user.id);
    expect(due).toContainEqual({ conceptId: "lex:bonjour", dimension: "recognition" });

    const plan = sessionPlan(await getTodaySession(user.id, profile));
    expect(plan.blocks[0]?.kind).toBe("review");
    expect(plan.blocks.find((b) => b.kind === "lesson")).toMatchObject({ lessonId: "a0-u1-l2" });

    const date = plan.date;
    const [prepared] = await prepareReviewItems(
      user.id,
      [{ conceptId: "lex:bonjour", dimension: "recognition" }],
      date,
    );
    expect(prepared?.activity.type).toBe("choice");
    if (prepared?.activity.type !== "choice") return;
    const right = prepared.activity.options.indexOf("bom dia, boa tarde, olá");
    const result = await submitReview({
      userId: user.id,
      item: { conceptId: "lex:bonjour", dimension: "recognition" },
      date,
      response: { kind: "choice", choice: right },
      context: "review",
    });
    expect(result).toMatchObject({ feedback: { correct: true } });
    const trace = await db.memoryTrace.findUniqueOrThrow({
      where: {
        userId_conceptId_dimension: {
          userId: user.id,
          conceptId: "lex:bonjour",
          dimension: "recognition",
        },
      },
    });
    expect(trace.reps).toBe(2);
  });

  it("walks through blocks in order and completes the session", async () => {
    const { user, profile } = await beginner();
    const session = await getTodaySession(user.id, profile);
    const blocks = sessionPlan(session).blocks.length;
    await expect(completeBlock(user.id, session.id, 1)).rejects.toThrow();
    for (let i = 0; i < blocks; i += 1) await completeBlock(user.id, session.id, i);
    const done = await db.dailySession.findUniqueOrThrow({ where: { id: session.id } });
    expect(done.status).toBe("completed");
    const day = await db.dailyActivity.findFirstOrThrow({ where: { userId: user.id } });
    expect(day.sessionCompleted).toBe(true);
    // Idempotent on double submit
    await completeBlock(user.id, session.id, blocks - 1);
  });
});
