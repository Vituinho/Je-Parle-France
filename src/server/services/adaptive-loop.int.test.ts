import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getContent } from "@/lib/content";
import { levelIndex } from "@/lib/learning/cefr";
import { buildReviewActivity } from "@/lib/learning/review/generate";
import * as planner from "@/lib/learning/planner/planner";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { oracleResponse } from "@/test/oracle";
import { completeOnboarding } from "./onboarding";
import { answerPlacement, getPlacementReport, loadPlacement, startPlacement } from "./placement";
import { activitySeed, lessonActivity, submitActivity } from "./practice";
import { dueReviewItems, reviewSeed, submitReview } from "./review";
import { getLearnerLevel } from "./learner";
import { buildPlan, getTodaySession, sessionPlan, startExtraSession } from "./session";
import { exportUserData } from "./account";

const START = new Date("2026-08-01T12:00:00Z");
const DAY = 86_400_000;

describe.skipIf(!hasTestDatabase)("adaptive learning loop", () => {
  beforeEach(resetDatabase);
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  afterAll(() => db.$disconnect());

  it("calibrates with placement, persists learning/review, evolves a skill and plans from the new profile", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(START);
    const user = await createTestUser();
    await completeOnboarding(user.id, {
      goals: ["move_quebec"],
      destination: "canada_quebec",
      priorExperience: "a_little",
      dailyMinutes: 30,
      targetLevel: "B2",
      start: "quick",
    });
    const content = getContent();
    const attemptId = await startPlacement(user.id, "quick");
    for (let guard = 0; guard < 40; guard++) {
      const view = await loadPlacement(user.id, attemptId);
      if (view.status === "completed") break;
      const item = content.placementItems.get(view.itemId)!;
      await answerPlacement(
        user.id,
        attemptId,
        item.id,
        oracleResponse(item.activity, attemptId, levelIndex(item.level) + 0.5 + item.offset < 2.6),
      );
    }
    const report = await getPlacementReport(user.id, attemptId);
    expect(report).not.toBeNull();
    const initial = await getLearnerLevel(user.id);
    expect(initial.skills.listening.level).toBe("A2");
    const calibrated = await db.skillEstimate.findUniqueOrThrow({
      where: { userId_skill: { userId: user.id, skill: "listening" } },
    });
    expect(calibrated.calibrationTheta).toBe(initial.skills.listening.theta);
    expect(
      await db.skillEvidence.count({ where: { userId: user.id, source: "placement" } }),
    ).toBeGreaterThan(0);
    const profile = await db.learnerProfile.findUniqueOrThrow({ where: { userId: user.id } });

    // A real lesson mistake becomes an FSRS review, without creating production skill evidence.
    const greeting = lessonActivity("a0-u1-l1", "a0-u1-l1-a1");
    await submitActivity({
      userId: user.id,
      activity: greeting,
      response: oracleResponse(greeting, activitySeed(user.id), false),
      context: "lesson",
      now: START,
    });
    vi.setSystemTime(new Date(START.getTime() + 120_000));
    const due = await dueReviewItems(user.id);
    const reviewItem = due.find(
      (i) => i.conceptId === "lex:bonjour" && i.dimension === "recognition",
    )!;
    expect(reviewItem).toBeDefined();
    const date = "2026-08-01";
    const review = buildReviewActivity({
      index: content,
      ...reviewItem,
      seed: reviewSeed(user.id, date),
    })!;
    await submitReview({
      userId: user.id,
      item: reviewItem,
      date,
      response: oracleResponse(review, activitySeed(user.id), true),
      context: "review",
    });
    expect(await db.reviewLog.count({ where: { userId: user.id, conceptId: "lex:bonjour" } })).toBe(
      2,
    );
    const savedSession = await getTodaySession(user.id, profile);
    const savedPlan = sessionPlan(savedSession);

    const courseTasks = [...content.activities.values()].filter(
      (r) =>
        r.activity.type === "listening" && content.lessons.get(r.lessonId)?.unit.level === "B1",
    );
    // The course has four B1 listening tasks. Two existing bank tasks are practice fixtures
    // only here, to prove the six-task gate without adding content or weakening it.
    const bankTasks = [...content.placementItems.values()]
      .filter((i) => i.skill === "listening" && i.level === "B1")
      .slice(0, 2);
    const tasks = [
      ...courseTasks.map((r) => ({ activity: r.activity, lessonId: r.lessonId })),
      ...bankTasks.map((i) => ({ activity: i.activity, lessonId: courseTasks[0]!.lessonId })),
    ];
    expect(tasks).toHaveLength(6);
    for (let day = 0; day < 60; day++) {
      const now = new Date(START.getTime() + (day + 1) * DAY);
      vi.setSystemTime(now);
      const task = tasks[day % tasks.length]!;
      await submitActivity({
        userId: user.id,
        ...task,
        context: "lesson",
        now,
        response: oracleResponse(task.activity, activitySeed(user.id), true),
      });
      if (day === 0) expect((await getLearnerLevel(user.id)).skills.listening.level).toBe("A2");
    }
    const evolved = await getLearnerLevel(user.id);
    expect(evolved.skills.listening).toMatchObject({ level: "B1", method: "objective" });
    expect(evolved.skills.listening.explanation).toMatch(/avançou|fortalecendo|observações/);
    expect(evolved.skills.listening.theta).toBeGreaterThan(initial.skills.listening.theta);
    expect(evolved.skills.speaking.theta).toBe(initial.skills.speaking.theta);
    expect(evolved.skills.reading.theta).toBe(initial.skills.reading.theta);
    expect(
      await db.studyEvent.count({ where: { userId: user.id, type: "skill_estimate_changed" } }),
    ).toBe(1);
    expect(
      await db.memoryTrace.count({
        where: { userId: user.id, dimension: "listening", reps: { gt: 2 } },
      }),
    ).toBeGreaterThan(0);

    const plannerCall = vi.spyOn(planner, "planSession");
    const plan = await buildPlan(user.id, profile);
    expect(plannerCall).toHaveBeenLastCalledWith(
      expect.objectContaining({
        skills: expect.objectContaining({
          listening: expect.objectContaining({
            theta: evolved.skills.listening.theta,
            confidence: evolved.skills.listening.confidence,
          }),
        }),
      }),
    );
    const extra = await startExtraSession(user.id, profile);
    expect(sessionPlan(extra)).toEqual(plan);
    expect(plan.seconds).toBeLessThanOrEqual(profile.dailyMinutes * 60 * 1.2);
    expect(
      (await db.dailySession.findUniqueOrThrow({ where: { id: savedSession.id } })).plan,
    ).toEqual(savedPlan);
    const exported = await exportUserData(user.id);
    expect(
      exported.skillEvidence.filter((e) => e.skill === "listening" && e.source === "lesson"),
    ).toHaveLength(60);
    expect(exported.skillEstimates.find((e) => e.skill === "listening")?.displayBand).toBe(
      levelIndex("B1"),
    );
    expect((await getLearnerLevel(user.id)).skills).toEqual(evolved.skills);
  }, 60_000);
});
