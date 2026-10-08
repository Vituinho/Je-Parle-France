import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getCapabilities } from "@/lib/ai/capabilities";
import { conceptDimensions, getContent, type ContentIndex } from "@/lib/content";
import type { PlacementItem } from "@/lib/content/schema";
import {
  toAuthoredResponse,
  toClientActivity,
  type ClientActivity,
} from "@/lib/learning/activities/client";
import { gradeActivity, GradingError, type ActivityResponse } from "@/lib/learning/grading/grade";
import { applyReview } from "@/lib/learning/memory/memory";
import { experiencePrior } from "@/lib/learning/onboarding";
import { buildBank } from "@/lib/learning/placement/bank";
import {
  blocksOf,
  computeEstimates,
  createPlan,
  nextStep,
  type BankItem,
  type EngineState,
  type Phase,
  type PlacementMode,
  type PlacementPlan,
  type ResponseRecord,
} from "@/lib/learning/placement/engine";
import {
  buildPlacementReport,
  type PlacementReport,
  type ReportItem,
} from "@/lib/learning/placement/report";
import type { Skill } from "@/lib/learning/skills";
import { db } from "@/server/db";
import { loadTraces, saveReviewLogs, saveTraces } from "@/server/repositories/memory";
import { resolveSpeechResponse, SpeechEvidenceError } from "./speech-evidence";

export class PlacementError extends Error {}

let bankCache:
  | { index: ContentIndex; bank: Map<string, BankItem>; reportItems: Map<string, ReportItem> }
  | undefined;

function placementContent() {
  const index = getContent();
  if (bankCache?.index === index) return bankCache;
  const bank = buildBank(index.placementItems.values());
  const reportItems = new Map<string, ReportItem>();
  for (const item of index.placementItems.values()) {
    reportItems.set(item.id, {
      bank: bank.get(item.id) as BankItem,
      level: item.level,
      topic: item.topic,
      concepts: item.concepts,
    });
  }
  bankCache = { index, bank, reportItems };
  return bankCache;
}

function engineState(
  attempt: { id: string; plan: Prisma.JsonValue },
  responses: ResponseRecord[],
): EngineState {
  return { plan: attempt.plan as unknown as PlacementPlan, responses, seed: attempt.id };
}

async function loadAttempt(userId: string, attemptId: string) {
  const attempt = await db.placementAttempt.findFirst({
    where: { id: attemptId, userId },
    include: { responses: { orderBy: { createdAt: "asc" } } },
  });
  if (!attempt) throw new PlacementError("Diagnóstico não encontrado.");
  const responses: ResponseRecord[] = attempt.responses.map((response) => ({
    itemId: response.itemId,
    score: response.score,
    scored: response.scored,
  }));
  return { attempt, responses };
}

/** Starts (or resumes) a placement attempt and returns its id. */
export async function startPlacement(
  userId: string,
  mode: PlacementMode,
  onlySkills: Skill[] = [],
): Promise<string> {
  const existing = await db.placementAttempt.findFirst({
    where: { userId, mode: mode === "skill" ? "complete" : mode, status: "in_progress" },
    orderBy: { startedAt: "desc" },
  });
  if (existing && mode !== "skill") return existing.id;

  const profile = await db.learnerProfile.findUnique({ where: { userId } });
  if (!profile) throw new PlacementError("Complete o cadastro antes do diagnóstico.");

  let prior = experiencePrior(profile.priorExperience);
  if (mode === "skill") {
    const skill = onlySkills[0];
    if (!skill) throw new PlacementError("Escolha uma habilidade para refazer.");
    const estimate = await db.skillEstimate.findUnique({
      where: { userId_skill: { userId, skill } },
    });
    if (estimate) prior = { mean: estimate.theta, sd: Math.max(estimate.sd, 1) };
  }
  const capabilities = getCapabilities();
  const plan = createPlan({
    mode,
    prior,
    capabilities: { speech: capabilities.speechRecognition, ai: capabilities.llm },
    onlySkills,
  });

  // Abandon older unfinished attempts so only one is active.
  await db.placementAttempt.updateMany({
    where: { userId, status: "in_progress" },
    data: { status: "abandoned" },
  });
  const attempt = await db.placementAttempt.create({
    data: {
      userId,
      // A single-skill retake is stored as a (partial) complete diagnostic.
      mode: mode === "quick" ? "quick" : "complete",
      skills: [...plan.skills, ...plan.selfAssessSkills],
      plan: plan as unknown as Prisma.InputJsonValue,
    },
  });
  if (mode !== "skill") {
    await db.learnerProfile.update({ where: { userId }, data: { placementStatus: "in_progress" } });
  }
  await db.studyEvent.create({
    data: { userId, type: "placement_started", payload: { mode, skills: onlySkills } },
  });
  return attempt.id;
}

export type PlacementView =
  | {
      status: "in_progress";
      attemptId: string;
      mode: PlacementMode;
      itemId: string;
      skill: Skill;
      activity: ClientActivity;
      phase: Phase;
      blocks: Phase[];
      block: { index: number; total: number };
      answered: number;
    }
  | { status: "completed"; attemptId: string };

export async function loadPlacement(userId: string, attemptId: string): Promise<PlacementView> {
  const { attempt, responses } = await loadAttempt(userId, attemptId);
  if (attempt.status === "completed") return { status: "completed", attemptId };
  if (attempt.status === "abandoned")
    throw new PlacementError("Este diagnóstico foi substituído por um mais recente.");

  const { bank, index } = placementContent();
  const state = engineState(attempt, responses);
  const step = nextStep(state, bank);
  if (!step) {
    await completePlacement(userId, attemptId);
    return { status: "completed", attemptId };
  }
  if (attempt.currentItemId !== step.item.id) {
    await db.placementAttempt.update({
      where: { id: attemptId },
      data: { currentItemId: step.item.id },
    });
  }
  const item = index.placementItems.get(step.item.id) as PlacementItem;
  return {
    status: "in_progress",
    attemptId,
    mode: state.plan.mode,
    itemId: item.id,
    skill: item.skill,
    activity: toClientActivity(item.activity, attemptId),
    phase: step.phase,
    blocks: blocksOf(state.plan),
    block: step.block,
    answered: responses.length,
  };
}

export type PlacementAnswer = ActivityResponse | { kind: "dont_know" };

export async function answerPlacement(
  userId: string,
  attemptId: string,
  itemId: string,
  answer: PlacementAnswer,
  durationMs?: number,
): Promise<{ done: boolean }> {
  const { attempt, responses } = await loadAttempt(userId, attemptId);
  if (attempt.status !== "in_progress")
    throw new PlacementError("Este diagnóstico já foi encerrado.");
  const { bank, index } = placementContent();
  const step = nextStep(engineState(attempt, responses), bank);
  // Only the item the engine is currently asking can be answered.
  if (!step || step.item.id !== itemId) throw new PlacementError("Esta pergunta não é a atual.");

  const item = index.placementItems.get(itemId) as PlacementItem;
  let score = 0;
  let scored = true;
  if (answer.kind !== "dont_know") {
    if (item.activity.type === "speak" && (answer.kind !== "speech" || !answer.speechAttemptId)) {
      throw new PlacementError("Grave e avalie sua voz para responder, ou escolha Não sei.");
    }
    // Spoken answers are scored from the stored assessment, never from client-sent text.
    let response: ActivityResponse;
    try {
      response = await resolveSpeechResponse(userId, answer, item.activity);
    } catch (error) {
      if (error instanceof SpeechEvidenceError) throw new PlacementError(error.message);
      throw error;
    }
    try {
      score = gradeActivity(
        item.activity,
        toAuthoredResponse(item.activity, response, attemptId),
      ).score;
    } catch (error) {
      if (!(error instanceof GradingError)) throw error;
      scored = false;
    }
  }
  await db.placementResponse.create({
    data: {
      attemptId,
      itemId,
      skill: item.skill,
      score,
      scored,
      answer: answer as unknown as Prisma.InputJsonValue,
      durationMs: durationMs && durationMs > 0 ? Math.min(durationMs, 30 * 60 * 1000) : null,
    },
  });

  const after = nextStep(engineState(attempt, [...responses, { itemId, score, scored }]), bank);
  if (!after) {
    await completePlacement(userId, attemptId);
    return { done: true };
  }
  return { done: false };
}

/** Finalises an attempt: report, skill estimates, gaps into review, start point. */
export async function completePlacement(
  userId: string,
  attemptId: string,
): Promise<PlacementReport> {
  const { attempt, responses } = await loadAttempt(userId, attemptId);
  if (attempt.status === "completed" && attempt.report) {
    return attempt.report as unknown as PlacementReport;
  }
  const { bank, reportItems, index } = placementContent();
  const state = engineState(attempt, responses);
  const estimates = computeEstimates(state, bank);
  const report = buildPlacementReport({
    plan: state.plan,
    estimates,
    responses,
    items: reportItems,
    content: index,
  });
  const now = new Date();
  const partial = state.plan.mode === "skill";
  const retaken = new Set<Skill>([...state.plan.skills, ...state.plan.selfAssessSkills]);

  // Gaps become failed reviews so they enter the queue immediately.
  const gapConcepts = report.gaps.map((gap) => gap.conceptId);
  const existing = await loadTraces(db, userId, gapConcepts);
  const existingKeys = new Set(existing.map((trace) => `${trace.conceptId}#${trace.dimension}`));
  const gapTraces = report.gaps.flatMap((gap) => {
    const concept = index.concepts.get(gap.conceptId);
    if (!concept) return [];
    const dimension = conceptDimensions(concept)[0];
    if (!dimension || existingKeys.has(`${gap.conceptId}#${dimension}`)) return [];
    return [
      applyReview({
        trace: null,
        conceptId: gap.conceptId,
        dimension,
        outcome: { score: 0, correct: false, verdict: "wrong" },
        now,
        source: "placement_gap",
      }),
    ];
  });

  await db.$transaction(async (tx) => {
    await tx.placementAttempt.update({
      where: { id: attemptId },
      data: {
        status: "completed",
        completedAt: now,
        currentItemId: null,
        report: report as unknown as Prisma.InputJsonValue,
      },
    });
    for (const result of report.skills) {
      if (partial && !retaken.has(result.skill)) continue;
      const assessed = result.method !== "not_assessed";
      await tx.skillEstimate.upsert({
        where: { userId_skill: { userId, skill: result.skill } },
        create: {
          userId,
          skill: result.skill,
          theta: result.theta,
          sd: result.sd,
          source: "placement",
          assessed,
          method: result.method,
        },
        update: {
          theta: result.theta,
          sd: result.sd,
          source: "placement",
          assessed,
          method: result.method,
        },
      });
    }
    if (!partial) {
      await tx.learnerProfile.update({
        where: { userId },
        data: {
          placementStatus: "completed",
          startLessonId: report.recommendation.lessonId ?? index.paths.core[0]?.lesson.id ?? null,
        },
      });
    }
    await saveTraces(
      tx,
      userId,
      gapTraces.map((entry) => entry.trace),
    );
    await saveReviewLogs(
      tx,
      userId,
      gapTraces.flatMap((entry) => (entry.log ? [entry.log] : [])),
    );
    await tx.studyEvent.create({
      data: {
        userId,
        type: "placement_completed",
        payload: {
          mode: state.plan.mode,
          overall: report.overall.short,
          items: responses.length,
          gaps: gapConcepts.length,
        },
      },
    });
  });
  return report;
}

export async function getPlacementReport(userId: string, attemptId: string) {
  const attempt = await db.placementAttempt.findFirst({ where: { id: attemptId, userId } });
  if (!attempt || attempt.status !== "completed" || !attempt.report) return null;
  return {
    attempt,
    report: attempt.report as unknown as PlacementReport,
  };
}

export async function latestPlacement(userId: string) {
  return db.placementAttempt.findFirst({
    where: { userId, status: { in: ["completed", "in_progress"] } },
    orderBy: { startedAt: "desc" },
  });
}

/** Learner chose where to start (accept recommendation / from the beginning / manual). */
export async function chooseStartLesson(userId: string, lessonId: string) {
  const ref = getContent().lessons.get(lessonId);
  if (!ref || ref.track !== "core") throw new PlacementError("Ponto de partida inválido.");
  await db.learnerProfile.update({ where: { userId }, data: { startLessonId: lessonId } });
  await db.studyEvent.create({
    data: { userId, type: "start_point_chosen", payload: { lessonId } },
  });
}

export async function skipPlacement(userId: string) {
  const first = getContent().paths.core[0]?.lesson.id ?? null;
  await db.learnerProfile.update({
    where: { userId },
    data: { placementStatus: "skipped", startLessonId: first },
  });
}
