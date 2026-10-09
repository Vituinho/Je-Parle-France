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
import { submitReview } from "./review";

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
    const [a, b] = await Promise.all([
      getTodaySession(user.id, profile, now),
      getTodaySession(user.id, profile, now),
    ]);
    expect(a.id).toBe(b.id);
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
