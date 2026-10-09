import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getContent, conceptDimensions } from "@/lib/content";
import { introduceTrace } from "@/lib/learning/memory/memory";
import { db } from "@/server/db";
import { saveTraces } from "@/server/repositories/memory";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { oracleResponse } from "@/test/oracle";
import { completeOnboarding } from "./onboarding";
import { activitySeed, lessonActivity, submitActivity } from "./practice";
import {
  completeBlock,
  getSession,
  getTodaySession,
  sessionPlan,
  startExtraSession,
} from "./session";
import { submitReview, prepareReviewItems } from "./review";
import type { SessionPlan } from "@/lib/learning/planner/planner";
import type { Prisma } from "@/generated/prisma/client";

const now = new Date("2026-10-09T12:00:00Z");
async function learner(minutes = 90) {
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: ["move_quebec"],
    destination: "both",
    priorExperience: "never",
    dailyMinutes: minutes,
    studyPace: "accelerated",
    targetLevel: "B2",
    start: "from_zero",
  });
  const profile = await db.learnerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  return { user, profile };
}

describe.skipIf(!hasTestDatabase)("intensive session persistence", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());

  it("gives a first-day beginner separate teaching and offline production blocks without scheduling practice as review", async () => {
    const { user, profile } = await learner();
    const session = await getTodaySession(user.id, profile, now);
    const plan = sessionPlan(session);
    expect(plan.segments!.length).toBeGreaterThan(1);
    const focuses = plan.blocks.filter((b) => b.kind === "focus");
    expect(new Set(focuses.map((b) => b.skill))).toEqual(
      new Set(["speaking", "listening", "writing"]),
    );
    expect(plan.newConceptIds!.length).toBeLessThanOrEqual(plan.newConceptLimit!);
    const position = plan.blocks.findIndex((b) => b.kind === "focus" && b.skill === "listening");
    const block = plan.blocks[position]!;
    if (block.kind !== "focus") throw new Error("missing focus");
    await db.dailySession.update({ where: { id: session.id }, data: { cursor: position } });
    const prepared = await prepareReviewItems(user.id, block.items, plan.date, false, true);
    expect(prepared.length).toBeGreaterThan(1);
    expect(prepared.every((p) => p.activity.type === "dictation")).toBe(true);
    const { buildReviewActivity } = await import("@/lib/learning/review/generate");
    const { reviewSeed } = await import("./review");
    const item = block.items[0]!;
    const activity = buildReviewActivity({
      index: getContent(),
      conceptId: item.conceptId,
      dimension: item.dimension,
      seed: reviewSeed(user.id, plan.date),
      productionPractice: true,
    })!;
    await submitReview({
      userId: user.id,
      sessionId: session.id,
      item,
      date: plan.date,
      context: "session",
      response: oracleResponse(activity, activitySeed(user.id), true),
    });
    expect(await db.memoryTrace.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.reviewLog.count({ where: { userId: user.id } })).toBe(0);
    expect(
      (await db.dailyActivity.findFirstOrThrow({ where: { userId: user.id } })).reviewsDone,
    ).toBe(0);
  });

  it("counts due session review once and excludes it from a paused review after FSRS rescheduling", async () => {
    const { user } = await learner();
    const activity = lessonActivity("a0-u1-l1", "a0-u1-l1-a1");
    await submitActivity({
      userId: user.id,
      activity,
      response: oracleResponse(activity, activitySeed(user.id), true),
      context: "lesson",
      now: new Date(Date.now() - 3 * 86_400_000),
    });
    const item = { conceptId: "lex:bonjour", dimension: "recognition" as const };
    const plan: SessionPlan = {
      version: 1,
      date: "2026-10-09",
      minutes: 5,
      seconds: 12,
      blocks: [{ kind: "review", seconds: 12, items: [item], reason: "due" }],
    };
    const session = await db.dailySession.create({
      data: {
        userId: user.id,
        localDate: plan.date,
        plannedMinutes: 5,
        plan: plan as unknown as Prisma.InputJsonValue,
      },
    });
    expect(await prepareReviewItems(user.id, [item], plan.date, true)).toHaveLength(1);
    const response = { kind: "choice" as const, choice: 0 };
    // Rebuild the correct authored response for the generated activity (rather than guessing).
    const { buildReviewActivity } = await import("@/lib/learning/review/generate");
    const { reviewSeed } = await import("./review");
    const review = buildReviewActivity({
      index: getContent(),
      conceptId: item.conceptId,
      dimension: item.dimension,
      seed: reviewSeed(user.id, plan.date),
    })!;
    Object.assign(response, oracleResponse(review, activitySeed(user.id), true));
    await submitReview({
      userId: user.id,
      sessionId: session.id,
      item,
      date: plan.date,
      context: "session",
      response,
    });
    const day = await db.dailyActivity.findFirstOrThrow({
      where: { userId: user.id },
      orderBy: { localDate: "desc" },
    });
    expect(day.reviewsDone).toBe(1);
    expect(await prepareReviewItems(user.id, [item], plan.date, true)).toHaveLength(0);
    await expect(
      submitReview({
        userId: user.id,
        sessionId: session.id,
        item,
        date: plan.date,
        context: "session",
        response,
      }),
    ).rejects.toThrow("reagendado");
  });

  it("makes concurrent final-block completion idempotent", async () => {
    const { user, profile } = await learner();
    const session = await getTodaySession(user.id, profile, now);
    const last = sessionPlan(session).blocks.length - 1;
    await db.dailySession.update({ where: { id: session.id }, data: { cursor: last } });
    const [a, b] = await Promise.all([
      completeBlock(user.id, session.id, last),
      completeBlock(user.id, session.id, last),
    ]);
    expect(a.cursor).toBe(b.cursor);
    expect(
      await db.studyEvent.count({ where: { userId: user.id, type: "session_completed" } }),
    ).toBe(1);
  });

  it("does not reschedule future memory or credit review when skill practice is submitted", async () => {
    const { user } = await learner();
    const activity = lessonActivity("a0-u1-l1", "a0-u1-l1-a1");
    const response = oracleResponse(activity, activitySeed(user.id), true);
    await submitActivity({ userId: user.id, activity, response, context: "lesson", now });
    const before = await db.memoryTrace.findMany({ where: { userId: user.id } });
    const logs = await db.reviewLog.count({ where: { userId: user.id } });
    const evidence = await db.skillEvidence.count({ where: { userId: user.id } });
    const result = await submitActivity({
      userId: user.id,
      activity,
      response,
      context: "session",
      scheduleMemory: false,
      durationMs: 10_000,
      now: new Date(now.getTime() + 5 * 60_000),
    });
    expect(result.feedback.correct).toBe(true);
    expect(result.changes).toEqual([]);
    expect(await db.memoryTrace.findMany({ where: { userId: user.id } })).toEqual(before);
    expect(await db.reviewLog.count({ where: { userId: user.id } })).toBe(logs);
    expect(await db.skillEvidence.count({ where: { userId: user.id } })).toBe(evidence); // same-day task deduplicated
    const day = await db.dailyActivity.findFirstOrThrow({ where: { userId: user.id } });
    expect(day.reviewsDone).toBe(0);
    expect(day.studySeconds).toBe(10);
  });

  it("serializes concurrent plan requests and preserves the cursor and frozen plan", async () => {
    const { user, profile } = await learner();
    const sessions = await Promise.all(
      Array.from({ length: 12 }, () => getTodaySession(user.id, profile, now)),
    );
    const a = sessions[0]!;
    expect(new Set(sessions.map((s) => s.id)).size).toBe(1);
    await completeBlock(user.id, a.id, 0);
    const restored = await getSession(user.id, a.id);
    expect(restored.cursor).toBe(1);
    expect(restored.plan).toEqual(a.plan);
    expect((await getTodaySession(user.id, profile, now)).cursor).toBe(1);
    await expect(getSession("someone-else", a.id)).rejects.toThrow();
  });

  it("keeps the aggregate new-material reservation across extra sessions", async () => {
    const { user, profile } = await learner(120);
    const first = await getTodaySession(user.id, profile, now);
    const plan = sessionPlan(first);
    expect(plan.newConceptIds!.length).toBeGreaterThan(0);
    expect(plan.newConceptIds!.length).toBeLessThanOrEqual(plan.newConceptLimit!);
    await db.dailySession.update({
      where: { id: first.id },
      data: { status: "completed", cursor: plan.blocks.length },
    });
    const extra = await startExtraSession(user.id, profile, now);
    const next = sessionPlan(extra);
    expect(plan.newConceptIds!.length + next.newConceptIds!.length).toBeLessThanOrEqual(
      plan.newConceptLimit!,
    );
    expect((await startExtraSession(user.id, profile, now)).id).toBe(extra.id);
  });

  it("uses published offline-capable production and level-appropriate listening in a long plan", async () => {
    const { user, profile } = await learner(120);
    const index = getContent();
    const traces = [...index.concepts.values()]
      .filter((c) => c.level === "A0" || c.level === "A1")
      .flatMap((c) =>
        conceptDimensions(c).map((dimension) =>
          introduceTrace(c.id, dimension, new Date("2026-09-01T12:00:00Z")),
        ),
      );
    await saveTraces(db, user.id, traces);
    await db.skillEstimate.updateMany({
      where: { userId: user.id },
      data: { theta: 1.8, sd: 0.3, assessed: true, method: "objective" },
    });
    await db.skillEstimate.update({
      where: { userId_skill: { userId: user.id, skill: "reading" } },
      data: { theta: 3.2 },
    });
    const plan = sessionPlan(await getTodaySession(user.id, profile, now));
    const focuses = plan.blocks.filter((b) => b.kind === "focus");
    expect(focuses.some((b) => b.kind === "focus" && b.skill === "speaking")).toBe(true);
    expect(focuses.some((b) => b.kind === "focus" && b.skill === "listening")).toBe(true);
    expect(plan.segments!.length).toBeGreaterThanOrEqual(3);
    expect(plan.blocks.some((b) => b.kind === "conversation")).toBe(false);
    expect(
      focuses.every(
        (b) =>
          b.kind !== "focus" ||
          !b.activityIds?.some((id) => index.activities.get(id)?.activity.type === "open_writing"),
      ),
    ).toBe(true);
  });

  it("rejects session review submissions outside the active persisted step", async () => {
    const { user, profile } = await learner();
    const session = await getTodaySession(user.id, profile, now);
    await expect(
      submitReview({
        userId: user.id,
        sessionId: session.id,
        date: "2026-10-09",
        item: { conceptId: "lex:bonjour", dimension: "recognition" },
        context: "session",
        response: { kind: "choice", choice: 0 },
      }),
    ).rejects.toThrow("etapa atual");
  });
});
