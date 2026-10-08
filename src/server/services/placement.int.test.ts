import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as capabilities from "@/lib/ai/capabilities";
import * as llm from "@/lib/ai/llm";
import * as writingService from "./writing";
import {
  assessWriting,
  WRITING_CRITERIA,
  type WritingJudgment,
} from "@/lib/learning/writing/assessment";
import { getContent } from "@/lib/content";
import { levelIndex } from "@/lib/learning/cefr";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { oracleResponse } from "@/test/oracle";
import { completeOnboarding } from "./onboarding";
import {
  answerPlacement,
  getPlacementReport,
  loadPlacement,
  PlacementError,
  startPlacement,
} from "./placement";

async function onboardedUser() {
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: ["move_quebec"],
    destination: "canada_quebec",
    priorExperience: "a_little",
    dailyMinutes: 30,
    targetLevel: "B2",
    start: "quick",
  });
  return user;
}

/** Answers like a learner whose true level is `theta`: right below it, wrong above. */
async function takeTest(userId: string, attemptId: string, theta: number) {
  const content = getContent();
  for (let guard = 0; guard < 80; guard += 1) {
    const view = await loadPlacement(userId, attemptId);
    if (view.status === "completed") return guard;
    const item = content.placementItems.get(view.itemId)!;
    const knows = levelIndex(item.level) + 0.5 + item.offset < theta;
    await answerPlacement(
      userId,
      attemptId,
      view.itemId,
      oracleResponse(item.activity, attemptId, knows),
    );
  }
  throw new Error("placement did not finish");
}

describe.skipIf(!hasTestDatabase)("placement service", () => {
  beforeEach(resetDatabase);
  afterEach(() => vi.restoreAllMocks());
  afterAll(() => db.$disconnect());

  it("runs a quick placement end to end and stores a detailed report", async () => {
    const user = await onboardedUser();
    const attemptId = await startPlacement(user.id, "quick");
    expect(await startPlacement(user.id, "quick")).toBe(attemptId); // resumes

    const answered = await takeTest(user.id, attemptId, 2.6);
    expect(answered).toBeGreaterThanOrEqual(12);
    expect(answered).toBeLessThanOrEqual(24);

    const result = await getPlacementReport(user.id, attemptId);
    expect(result).not.toBeNull();
    const { report } = result!;
    expect(report.overall.theta).toBeGreaterThan(1.8);
    expect(report.overall.theta).toBeLessThan(3.4);
    expect(report.skills.find((s) => s.skill === "speaking")?.method).toBe("self_assessment");
    expect(report.skills.find((s) => s.skill === "pronunciation")?.method).toBe("not_assessed");

    const profile = await db.learnerProfile.findUniqueOrThrow({ where: { userId: user.id } });
    expect(profile.placementStatus).toBe("completed");
    const estimates = await db.skillEstimate.findMany({ where: { userId: user.id } });
    expect(estimates.find((e) => e.skill === "reading")).toMatchObject({
      source: "placement",
      assessed: true,
      method: "objective",
    });
    // How each skill was estimated is kept, so self-assessment is never shown as measured.
    for (const skill of report.skills) {
      expect(estimates.find((e) => e.skill === skill.skill)?.method, skill.skill).toBe(
        skill.method,
      );
    }
    expect(
      await db.studyEvent.count({ where: { userId: user.id, type: "placement_completed" } }),
    ).toBe(1);
  });

  it("refuses answers to anything but the current item and other learners' attempts", async () => {
    const user = await onboardedUser();
    const other = await onboardedUser();
    const attemptId = await startPlacement(user.id, "quick");
    const view = await loadPlacement(user.id, attemptId);
    if (view.status !== "in_progress") throw new Error("expected an item");
    await expect(
      answerPlacement(user.id, attemptId, "pv-c1-03", { kind: "choice", choice: 0 }),
    ).rejects.toBeInstanceOf(PlacementError);
    await expect(loadPlacement(other.id, attemptId)).rejects.toBeInstanceOf(PlacementError);
  });

  it("lets the learner say they do not know", async () => {
    const user = await onboardedUser();
    const attemptId = await startPlacement(user.id, "quick");
    const view = await loadPlacement(user.id, attemptId);
    if (view.status !== "in_progress") throw new Error("expected an item");
    await answerPlacement(user.id, attemptId, view.itemId, { kind: "dont_know" });
    const stored = await db.placementResponse.findFirstOrThrow({ where: { attemptId } });
    expect(stored).toMatchObject({ score: 0, scored: true });
  });

  it("does not select open writing merely because the tutor LLM is configured", async () => {
    vi.spyOn(capabilities, "getCapabilities").mockReturnValue({
      speechRecognition: false,
      pronunciationAssessment: false,
      serverTts: false,
      llm: true,
    });
    const user = await onboardedUser();
    const attemptId = await startPlacement(user.id, "complete");
    const stored = await db.placementAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    expect(stored.plan).toMatchObject({
      capabilities: { ai: false },
      selfAssessSkills: ["speaking"],
    });
    expect((stored.plan as { skills: string[] }).skills).not.toContain("pronunciation");
    await takeTest(user.id, attemptId, 5.6);
    const responses = await db.placementResponse.findMany({ where: { attemptId } });
    expect(
      responses.every(
        (r) => getContent().placementItems.get(r.itemId)!.activity.type !== "open_writing",
      ),
    ).toBe(true);
    expect(
      (await getPlacementReport(user.id, attemptId))!.report.skills.find(
        (s) => s.skill === "pronunciation",
      )?.method,
    ).toBe("not_assessed");
    // Advanced results persist the highest authored level, not the first A0 lesson.
    expect(
      (await db.learnerProfile.findUniqueOrThrow({ where: { userId: user.id } })).startLessonId,
    ).toMatch(/^b1-/);
  });

  it("serves a perception item with opaque audio and labels the result as perception", async () => {
    vi.spyOn(capabilities, "getCapabilities").mockReturnValue({
      speechRecognition: true,
      pronunciationAssessment: true,
      serverTts: true,
      llm: false,
    });
    const user = await onboardedUser();
    const attemptId = await startPlacement(user.id, "skill", ["pronunciation"]);
    const view = await loadPlacement(user.id, attemptId);
    if (view.status !== "in_progress") throw new Error("expected an item");
    expect(view.activity).toMatchObject({ type: "minimal_pair" });
    expect(view.activity).not.toHaveProperty("playText");
    expect(view.activity).not.toHaveProperty("answer");
    expect(view.activity).toHaveProperty(
      "audioUrl",
      `/api/placement/audio?attemptId=${attemptId}&itemId=${view.itemId}`,
    );
    await takeTest(user.id, attemptId, 2.5);
    expect(
      (await getPlacementReport(user.id, attemptId))!.report.skills.find(
        (s) => s.skill === "pronunciation",
      )?.method,
    ).toBe("perception");
  });

  it("persists reviewed writing judgment, maps only reliable errors to review, and honestly labels AI evidence", async () => {
    vi.spyOn(capabilities, "getCapabilities").mockReturnValue({
      speechRecognition: false,
      pronunciationAssessment: false,
      serverTts: false,
      llm: true,
    });
    vi.spyOn(llm, "getLLM").mockReturnValue({
      id: "anthropic",
      simulated: false,
      generateObject: vi.fn(),
    });
    vi.spyOn(writingService, "evaluateWriting").mockImplementation(
      async (_user, activity, original) =>
        assessWriting({
          original,
          activity,
          model: "fixture",
          concepts: getContent().concepts,
          judgment: {
            criteria: Object.fromEntries(
              WRITING_CRITERIA.map((c) => [c, { band: 3, evidence: ["Bonjour"] }]),
            ) as WritingJudgment["criteria"],
            confidence: 0.9,
            feedbackPt: "Relato claro. Revise avoir.",
            limitations: [],
            issues: [],
          },
        }),
    );
    const user = await onboardedUser();
    await db.skillEstimate.update({
      where: { userId_skill: { userId: user.id, skill: "writing" } },
      data: { theta: 2.5, sd: 0.5 },
    });
    const attemptId = await startPlacement(user.id, "skill", ["writing"]);
    let written = false;
    for (let guard = 0; guard < 12; guard++) {
      const view = await loadPlacement(user.id, attemptId);
      if (view.status === "completed") break;
      const item = getContent().placementItems.get(view.itemId)!;
      if (item.activity.type === "open_writing") {
        await answerPlacement(user.id, attemptId, view.itemId, {
          kind: "text",
          text: "Bonjour, je suis 25 ans. Samedi, je suis allé au parc avec mes amis. Nous avons parlé de notre travail et nous avons mangé ensemble. Dimanche, j'ai appelé ma famille et j'ai lu un livre.",
        });
        written = true;
      } else
        await answerPlacement(
          user.id,
          attemptId,
          view.itemId,
          oracleResponse(item.activity, attemptId, true),
        );
    }
    expect(written).toBe(true);
    const report = (await getPlacementReport(user.id, attemptId))!.report;
    expect(report.skills.find((s) => s.skill === "writing")?.method).toBe("ai_assessment");
    expect(report.writing?.[0]).toMatchObject({
      confidence: 0.65,
      original: expect.stringContaining("je suis 25 ans"),
    });
    expect(
      await db.memoryTrace.findUnique({
        where: {
          userId_conceptId_dimension: {
            userId: user.id,
            conceptId: "gram:age-avoir",
            dimension: "writing",
          },
        },
      }),
    ).toMatchObject({ lastScore: 0 });
    expect(
      (
        await db.skillEstimate.findUniqueOrThrow({
          where: { userId_skill: { userId: user.id, skill: "writing" } },
        })
      ).method,
    ).toBe("ai_assessment");
  });

  it("scores speaking only from a matching real assessment, never self-rating or forged fields", async () => {
    vi.spyOn(capabilities, "getCapabilities").mockReturnValue({
      speechRecognition: true,
      pronunciationAssessment: true,
      serverTts: true,
      llm: false,
    });
    const user = await onboardedUser();
    const attemptId = await startPlacement(user.id, "skill", ["speaking"]);
    const view = await loadPlacement(user.id, attemptId);
    if (view.status !== "in_progress") throw new Error("expected an item");
    const activity = getContent().placementItems.get(view.itemId)!.activity;
    if (activity.type !== "speak") throw new Error("expected a spoken item");

    for (const answer of [
      { kind: "speech" as const, selfRating: 1 as const },
      { kind: "speech" as const, transcript: activity.text, pronunciation: 100 },
    ]) {
      await expect(answerPlacement(user.id, attemptId, view.itemId, answer)).rejects.toThrow(
        "Grave e avalie",
      );
    }
    const assessment = await db.speechAttempt.create({
      data: {
        userId: user.id,
        provider: "azure",
        targetText: "Bonjour",
        transcript: activity.text,
        scores: { status: "ok", scores: { overall: 40 } },
      },
    });
    await expect(
      answerPlacement(user.id, attemptId, view.itemId, {
        kind: "speech",
        speechAttemptId: assessment.id,
      }),
    ).rejects.toThrow("outro texto");
    expect(await db.placementResponse.count({ where: { attemptId } })).toBe(0);

    await db.speechAttempt.update({
      where: { id: assessment.id },
      data: { targetText: activity.text },
    });
    await answerPlacement(user.id, attemptId, view.itemId, {
      kind: "speech",
      speechAttemptId: assessment.id,
      transcript: "forged",
      pronunciation: 100,
    });
    // Real overall 40 and perfect transcript recall: 0.5 * 1 + 0.5 * 0.4 = 0.7.
    expect(await db.placementResponse.findFirstOrThrow({ where: { attemptId } })).toMatchObject({
      score: 0.7,
      scored: true,
    });
  });
});
