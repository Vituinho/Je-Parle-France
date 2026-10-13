import { afterAll, beforeEach, describe, it, expect } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { getContent } from "@/lib/content";
import { introduceTrace } from "@/lib/learning/memory/memory";
import { buildReviewActivity } from "@/lib/learning/review/generate";
import type { ReviewItem, SessionPlan } from "@/lib/learning/planner/planner";
import { saveTraces } from "@/server/repositories/memory";
import { oracleResponse } from "@/test/oracle";
import { activitySeed } from "./practice";
import {
  prepareReviewItems,
  submitReview,
  reviewSeed,
  reviewIsStale,
  reconcileSessionReviews,
  reviewScheduleVersion,
} from "./review";
import { completeBlock } from "./session";
const now = new Date("2026-10-13T12:00:00Z"),
  past = new Date("2026-10-10T12:00:00Z"),
  date = "2026-10-13";
const item: ReviewItem = { conceptId: "lex:bonjour", dimension: "recognition" };
const second: ReviewItem = { conceptId: "lex:merci", dimension: "recognition" };
async function setup(items: ReviewItem[] = [item], extraBlocks: SessionPlan["blocks"] = []) {
  const user = await createTestUser();
  await saveTraces(
    db,
    user.id,
    [item, second].map((i) => ({
      ...introduceTrace(i.conceptId, i.dimension, past),
      reps: 1,
      state: 2 as const,
      stability: 3,
      difficulty: 5,
      due: past,
      lastReview: past,
      attempts: 1,
    })),
  );
  const plan: SessionPlan = {
    version: 1,
    date,
    minutes: 5,
    seconds: 12,
    blocks: [{ kind: "review", seconds: 12, items, reason: "due" }, ...extraBlocks],
  };
  const session = await db.dailySession.create({
    data: {
      userId: user.id,
      localDate: date,
      plannedMinutes: 5,
      plan: plan as unknown as Prisma.InputJsonValue,
      createdAt: new Date(now.getTime() - 10000),
    },
  });
  return { user, session, plan };
}
function response(userId: string, i = item, correct = true) {
  const activity = buildReviewActivity({
    index: getContent(),
    conceptId: i.conceptId,
    dimension: i.dimension,
    seed: reviewSeed(userId, date),
  })!;
  return oracleResponse(activity, activitySeed(userId), correct);
}
async function counters(userId: string) {
  return {
    logs: await db.reviewLog.count({ where: { userId } }),
    attempts: await db.activityAttempt.count({ where: { userId } }),
    events: await db.studyEvent.count({ where: { userId, type: "activity_completed" } }),
    days: await db.dailyActivity.findMany({ where: { userId } }),
    traces: await db.memoryTrace.findMany({ where: { userId }, orderBy: { conceptId: "asc" } }),
    evidence: await db.skillEvidence.findMany({ where: { userId } }),
  };
}
describe.skipIf(!hasTestDatabase)("stale frozen review recovery", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());
  it("serializes identical submissions and schedules/counts exactly once", async () => {
    const { user, session } = await setup();
    const params = {
      userId: user.id,
      item,
      date,
      context: "session" as const,
      sessionId: session.id,
      response: response(user.id),
      now,
      durationMs: 10000,
    };
    const [a, b] = await Promise.all([submitReview(params), submitReview(params)]);
    expect([a, b].filter((r) => "skipped" in r)).toHaveLength(1);
    const snapshot = await counters(user.id);
    expect(snapshot).toMatchObject({ logs: 1, attempts: 1, events: 1 });
    expect(snapshot.traces.find((t) => t.conceptId === item.conceptId)?.reps).toBe(2);
    expect(snapshot.days[0]).toMatchObject({
      reviewsDone: 1,
      activitiesCompleted: 1,
      studySeconds: 10,
    });
    expect(await submitReview(params)).toEqual({ skipped: true });
    expect(await counters(user.id)).toEqual(snapshot);
  });
  it("refresh/resume finishes a reviewed final block without rewriting its frozen plan", async () => {
    const { user, session, plan } = await setup();
    await submitReview({
      userId: user.id,
      item,
      date,
      context: "session",
      sessionId: session.id,
      response: response(user.id),
      now,
    });
    expect(
      await prepareReviewItems(user.id, [item], date, true, false, db, session.id, now),
    ).toEqual([]);
    const [a, b] = await Promise.all([
      reconcileSessionReviews(user.id, session.id, undefined, now),
      reconcileSessionReviews(user.id, session.id, undefined, now),
    ]);
    expect(a).toMatchObject({ cursor: 1, status: "completed", plan });
    expect(b.cursor).toBe(1);
    expect(
      await db.studyEvent.count({ where: { userId: user.id, type: "session_completed" } }),
    ).toBe(1);
    expect(await db.studyEvent.count({ where: { userId: user.id, type: "block_completed" } })).toBe(
      1,
    );
    const snapshot = await counters(user.id);
    expect(
      await submitReview({
        userId: user.id,
        item,
        date,
        context: "session",
        sessionId: session.id,
        response: response(user.id),
        now,
      }),
    ).toEqual({ skipped: true });
    expect(await counters(user.id)).toEqual(snapshot);
  });
  it("skips several obsolete/deleted blocks and stops at the next valid activity", async () => {
    const missing = { conceptId: "personal:deleted", dimension: "recall" as const };
    const { user, session, plan } = await setup(
      [item, second, missing],
      [
        { kind: "review", seconds: 12, items: [item], reason: "legacy duplicate" },
        { kind: "focus", seconds: 30, skill: "writing", items: [second], reason: "practice" },
      ],
    );
    await db.memoryTrace.updateMany({
      where: { userId: user.id },
      data: { due: new Date(now.getTime() + 86400000) },
    });
    expect(
      await reviewIsStale({
        userId: user.id,
        item: missing,
        date,
        context: "session",
        sessionId: session.id,
        now,
      }),
    ).toBe(true);
    const snapshot = await counters(user.id);
    const recovered = await reconcileSessionReviews(user.id, session.id, undefined, now);
    expect(recovered).toMatchObject({ cursor: 2, status: "in_progress", plan });
    expect(await db.reviewLog.count({ where: { userId: user.id } })).toBe(0);
    const after = await counters(user.id);
    expect(after.traces).toEqual(snapshot.traces);
    expect(after.attempts).toBe(0);
    expect(after.events).toBe(0);
  });
  it("deduplicates legacy identical references and never schedules them again even when due returns", async () => {
    const { user, session } = await setup([item, item]);
    expect(
      await prepareReviewItems(user.id, [item, item], date, true, false, db, session.id, now),
    ).toHaveLength(1);
    await submitReview({
      userId: user.id,
      item,
      date,
      context: "session",
      sessionId: session.id,
      response: response(user.id),
      now,
    });
    await db.memoryTrace.update({
      where: {
        userId_conceptId_dimension: {
          userId: user.id,
          conceptId: item.conceptId,
          dimension: item.dimension,
        },
      },
      data: { due: past },
    });
    const snapshot = await counters(user.id);
    expect(
      await submitReview({
        userId: user.id,
        item,
        date,
        context: "session",
        sessionId: session.id,
        response: response(user.id),
        now,
      }),
    ).toEqual({ skipped: true });
    expect((await reconcileSessionReviews(user.id, session.id, undefined, now)).status).toBe(
      "completed",
    );
    expect((await counters(user.id)).traces).toEqual(snapshot.traces);
    expect(await db.reviewLog.count({ where: { userId: user.id } })).toBe(1);
  });
  it("uses the frozen schedule snapshot to reject a changed schedule even if it is due", async () => {
    const { user, session } = await setup();
    const trace = await db.memoryTrace.findUniqueOrThrow({
      where: {
        userId_conceptId_dimension: {
          userId: user.id,
          conceptId: item.conceptId,
          dimension: item.dimension,
        },
      },
    });
    const frozen = { ...item, scheduleVersion: reviewScheduleVersion(trace) };
    const plan: SessionPlan = {
      version: 1,
      date,
      minutes: 5,
      seconds: 12,
      blocks: [{ kind: "review", seconds: 12, items: [frozen], reason: "due" }],
    };
    await db.dailySession.update({
      where: { id: session.id },
      data: { plan: plan as unknown as Prisma.InputJsonValue },
    });
    await db.memoryTrace.update({
      where: {
        userId_conceptId_dimension: {
          userId: user.id,
          conceptId: item.conceptId,
          dimension: item.dimension,
        },
      },
      data: { reps: 2, lastReview: new Date(now.getTime() - 5000), due: past },
    });
    const snapshot = await counters(user.id);
    expect(
      await prepareReviewItems(user.id, [frozen], date, true, false, db, session.id, now),
    ).toEqual([]);
    expect(
      await submitReview({
        userId: user.id,
        item,
        date,
        context: "session",
        sessionId: session.id,
        response: response(user.id),
        now,
      }),
    ).toEqual({ skipped: true });
    expect((await reconcileSessionReviews(user.id, session.id, undefined, now)).status).toBe(
      "completed",
    );
    expect((await counters(user.id)).traces).toEqual(snapshot.traces);
  });
  it("keeps one explicit corrective retry as practice while duplicate failed submissions have no credit", async () => {
    const { user, session } = await setup([item, second]);
    const params = {
      userId: user.id,
      item,
      date,
      context: "session" as const,
      sessionId: session.id,
      response: response(user.id, item, false),
      now,
    };
    expect(await submitReview(params)).toMatchObject({ feedback: { correct: false } });
    const first = await counters(user.id);
    expect(await submitReview(params)).toEqual({ skipped: true });
    expect(await counters(user.id)).toEqual(first);
    const retry = {
      ...params,
      correctiveRetry: true,
      response: response(user.id),
      now: new Date(now.getTime() + 1000),
    };
    const results = await Promise.all([submitReview(retry), submitReview(retry)]);
    expect(results.filter((r) => "skipped" in r)).toHaveLength(1);
    const after = await counters(user.id);
    expect(after.traces).toEqual(first.traces);
    expect(after.logs).toBe(1);
    expect(after.attempts).toBe(2);
    expect(after.days[0]?.reviewsDone).toBe(1);
  });
  it("keeps snapshot protection for standalone review without changing lab practice", async () => {
    const { user } = await setup();
    const prepared = (
      await prepareReviewItems(user.id, [item], date, true, false, db, undefined, now)
    )[0]!;
    const params = {
      userId: user.id,
      item,
      date,
      context: "review" as const,
      response: response(user.id),
      scheduleVersion: prepared.scheduleVersion,
      now,
    };
    const results = await Promise.all([submitReview(params), submitReview(params)]);
    expect(results.filter((r) => "skipped" in r)).toHaveLength(1);
    expect(await db.reviewLog.count({ where: { userId: user.id } })).toBe(1);
  });
  it("does not expose or complete a foreign session", async () => {
    const { user, session } = await setup(),
      other = await createTestUser();
    await expect(reconcileSessionReviews(other.id, session.id, undefined, now)).rejects.toThrow(
      "não encontrada",
    );
    await expect(
      submitReview({
        userId: other.id,
        item,
        date,
        context: "session",
        sessionId: session.id,
        response: response(user.id),
        now,
      }),
    ).rejects.toThrow("não encontrada");
    await completeBlock(user.id, session.id, 0);
    expect(await db.reviewLog.count({ where: { userId: user.id } })).toBe(0);
  });
  it("never credits a replay from an earlier review block as later focus practice", async () => {
    const { user, session } = await setup(
      [item],
      [{ kind: "focus", seconds: 30, skill: "reading", items: [item], reason: "drill" }],
    );
    await submitReview({
      userId: user.id,
      item,
      date,
      context: "session",
      sessionId: session.id,
      blockIndex: 0,
      response: response(user.id),
      now,
    });
    await completeBlock(user.id, session.id, 0);
    const snapshot = await counters(user.id);
    expect(
      await submitReview({
        userId: user.id,
        item,
        date,
        context: "session",
        sessionId: session.id,
        blockIndex: 0,
        response: response(user.id),
        now,
      }),
    ).toEqual({ skipped: true });
    expect(await counters(user.id)).toEqual(snapshot);
    await expect(
      submitReview({
        userId: user.id,
        item,
        date,
        context: "session",
        sessionId: session.id,
        blockIndex: 3,
        response: response(user.id),
        now,
      }),
    ).rejects.toThrow("não está disponível");
  });
});
