import type { CefrLevel } from "../cefr";
import { retrievability, type MemoryTraceState } from "../memory/memory";
import type { ConceptKind, Dimension, Skill } from "../skills";
import { studyPace, type StudyPace } from "../study-pace";

/**
 * Daily Session Engine. Answers "what is the most useful thing to study today,
 * in the time I have?" — deterministically, from the learner's state.
 *
 * It is not a template per duration: budgets are computed from the time
 * available and the review backlog, new material is capped by cognitive load,
 * and skill blocks compete on weakness, goals and variety.
 */

export interface ReviewItem {
  conceptId: string;
  dimension: Dimension;
  /** Distinct exercise for the same item (drills repeat a concept with variety). */
  variant?: number;
}

export type FocusSkill = "pronunciation" | "speaking" | "listening" | "writing" | "reading";

export type SessionBlock =
  | { kind: "review"; seconds: number; items: ReviewItem[]; reason: string }
  | {
      kind: "lesson";
      seconds: number;
      lessonId: string;
      track: "core" | "canada" | "france";
      /** Stop after this many steps (micro-lesson); undefined = whole lesson. */
      maxSteps?: number;
      startStep?: number;
      reason: string;
    }
  | {
      kind: "focus";
      seconds: number;
      skill: FocusSkill;
      items: ReviewItem[];
      activityIds?: string[];
      reason: string;
    }
  | { kind: "conversation"; seconds: number; scenarioId: string; reason: string };

export type BlockKind = SessionBlock["kind"] | `focus:${FocusSkill}`;

export interface SessionPlan {
  version: 1;
  date: string;
  minutes: number;
  blocks: SessionBlock[];
  /** Planned seconds (≤ minutes × 60, small overshoot allowed for a whole lesson). */
  seconds: number;
  /** Additive metadata: old version-1 plans remain readable and frozen. */
  pace?: StudyPace;
  newConceptLimit?: number;
  newConceptIds?: string[];
  segments?: LearningSegment[];
}

export interface LearningSegment {
  start: number;
  end: number;
  seconds: number;
}
export interface PracticeOpportunity {
  activityId: string;
  skill: FocusSkill;
  seconds: number;
  concepts: string[];
  level: number;
}

export interface ConceptInfo {
  kind: ConceptKind;
  level: CefrLevel;
}

export interface UpcomingLesson {
  lessonId: string;
  track: "core" | "canada" | "france";
  minutes: number;
  steps: number;
  /** Steps already done in an unfinished run. */
  stepIndex: number;
  newConcepts: number;
  /** Unique taught concepts for each step; lets a micro-lesson respect the actual daily cap. */
  introducedByStep?: string[][];
  prerequisites?: string[];
  activityIdsByStep?: (string | null)[];
}

export interface PlannerInput {
  now: Date;
  date: string;
  dailyMinutes: number;
  studyPace?: StudyPace | null;
  /** Used or reserved by other plans on this local day, not a per-session allowance. */
  newConceptsToday?: number;
  practice?: readonly PracticeOpportunity[];
  traces: readonly MemoryTraceState[];
  concept: (conceptId: string) => ConceptInfo | undefined;
  /** Next lessons in path order: core first, then destination tracks. */
  upcoming: readonly UpcomingLesson[];
  skills: Record<Skill, { theta: number; confidence?: "high" | "medium" | "low" }>;
  /** Learner wants to live/work in a francophone place (speaking & listening matter more). */
  relocation: boolean;
  /** Block kinds done in the last two sessions, most recent first. */
  recentBlocks: readonly BlockKind[];
  capabilities: { conversation: boolean };
  /** Scenario available for the learner's level and destination, if any. */
  scenarioId?: string;
}

// ─── Costs ─────────────────────────────────────────────────────────────────

export const ITEM_SECONDS: Record<Dimension, number> = {
  recognition: 12,
  recall: 22,
  listening: 18,
  writing: 30,
  speaking: 30,
  pronunciation: 25,
};

const FOCUS_SECONDS = 150;
const CONVERSATION_SECONDS = 480;

/** Share of the session that review should ideally take, by length. */
function reviewShare(minutes: number): number {
  if (minutes <= 5) return 0.4;
  if (minutes <= 15) return 0.3;
  if (minutes <= 30) return 0.25;
  return 0.2;
}

/** Maximum new concepts per day, by length (cognitive load). */
export function newConceptCap(minutes: number): number {
  if (minutes <= 5) return 3;
  if (minutes <= 15) return 6;
  if (minutes <= 30) return 10;
  return 16;
}

// ─── Review selection ──────────────────────────────────────────────────────

interface Candidate extends ReviewItem {
  priority: number;
  seconds: number;
}

/**
 * Due items first (lowest recall probability first, failed placement gaps and
 * lapsed items boosted); then "production gaps": dimensions never practised
 * for concepts the learner already knows in another dimension.
 */
export function reviewCandidates(
  input: Pick<PlannerInput, "traces" | "now" | "concept">,
): Candidate[] {
  const { traces, now } = input;
  const due: Candidate[] = [];
  const gaps: Candidate[] = [];
  const knownConcepts = new Set(
    traces
      .filter((trace) => trace.reps > 0 && trace.stability >= 1)
      .map((trace) => trace.conceptId),
  );
  for (const trace of traces) {
    if (!input.concept(trace.conceptId) && !trace.conceptId.startsWith("personal:")) continue;
    const seconds = ITEM_SECONDS[trace.dimension];
    if (trace.reps === 0) {
      if (knownConcepts.has(trace.conceptId)) {
        gaps.push({
          conceptId: trace.conceptId,
          dimension: trace.dimension,
          priority: 0.2,
          seconds,
        });
      }
      continue;
    }
    if (trace.due.getTime() > now.getTime()) continue;
    const recall = retrievability(trace, now);
    let priority = 1 + (1 - recall);
    if (trace.source === "placement_gap" || trace.source === "tutor") priority += 0.3;
    if (trace.state === 1 || trace.state === 3) priority += 0.4; // learning / relearning
    due.push({ conceptId: trace.conceptId, dimension: trace.dimension, priority, seconds });
  }
  const byPriority = (a: Candidate, b: Candidate) =>
    b.priority - a.priority ||
    a.conceptId.localeCompare(b.conceptId) ||
    a.dimension.localeCompare(b.dimension);
  return [...due.sort(byPriority), ...gaps.sort(byPriority)];
}

/** Picks items within a time budget, avoiding the same concept twice in a row when possible. */
function takeWithin(candidates: Candidate[], budget: number): Candidate[] {
  const picked: Candidate[] = [];
  let used = 0;
  for (const candidate of candidates) {
    if (used + candidate.seconds > budget) continue;
    picked.push(candidate);
    used += candidate.seconds;
  }
  // Interleave so two dimensions of the same concept are not adjacent.
  const result: Candidate[] = [];
  const queue = [...picked];
  while (queue.length > 0) {
    const last = result.at(-1);
    const index = queue.findIndex((item) => item.conceptId !== last?.conceptId);
    result.push(...queue.splice(index === -1 ? 0 : index, 1));
  }
  return result;
}

const secondsOf = (items: Candidate[]) => items.reduce((sum, item) => sum + item.seconds, 0);

// ─── Planning ──────────────────────────────────────────────────────────────

const SKILL_FOR_FOCUS: Record<FocusSkill, Skill> = {
  pronunciation: "pronunciation",
  reading: "reading",
  speaking: "speaking",
  listening: "listening",
  writing: "writing",
};

const FOCUS_REASON: Record<FocusSkill, string> = {
  pronunciation: "Treino de sons que costumam confundir brasileiros.",
  speaking: "Falar em voz alta o que você já reconhece na leitura.",
  listening: "Treinar o ouvido com o que você já conhece.",
  writing: "Produzir por escrito o que você já reconhece.",
  reading: "Aplicar o que você conhece em um texto no seu nível.",
};

// Uncertain starting points still invite practice, but cannot dominate measured weaknesses.
const reliability = (confidence: PlannerInput["skills"][Skill]["confidence"]) =>
  confidence === "low" ? 0.35 : confidence === "medium" ? 0.75 : 1;

export function planSession(input: PlannerInput): SessionPlan {
  const minutes = Math.max(5, Math.min(240, input.dailyMinutes));
  const pace = studyPace(input.studyPace, minutes);
  const total = minutes * 60;
  const blocks: SessionBlock[] = [];
  const candidates = reviewCandidates(input);
  const dueLoad = secondsOf(candidates.filter((c) => c.priority >= 1));

  // 1. Review: protect what is about to be forgotten.
  const share = reviewShare(minutes);
  const backlog = dueLoad > total * share * 2;
  const reviewBudget = Math.min(dueLoad, Math.max(60, Math.round(total * (backlog ? 0.6 : share))));
  const reviewItems = takeWithin(
    candidates.filter((c) => c.priority >= 1),
    reviewBudget,
  );
  if (reviewItems.length > 0) {
    blocks.push({
      kind: "review",
      seconds: secondsOf(reviewItems),
      items: reviewItems.map(({ conceptId, dimension }) => ({ conceptId, dimension })),
      reason: backlog
        ? "Você tem bastante coisa para revisar: hoje a revisão vem antes do conteúdo novo."
        : "Itens que estão perto de ser esquecidos.",
    });
  }
  let remaining = total - secondsOf(reviewItems);

  // 2. New material, capped by cognitive load (halved under a review backlog).
  const cap = Math.max(0, dailyNewConceptLimit(input, backlog) - (input.newConceptsToday ?? 0));
  let newConcepts = 0;
  const introduced = new Set<string>();
  const lessonActivities = new Set<string>();
  const available = new Set(input.traces.map((t) => t.conceptId));
  // Short sessions still get something new (a micro-lesson); longer ones leave room for skills.
  const newBudget = Math.round(
    Math.min(
      remaining * (minutes <= 5 ? 0.85 : backlog ? 0.45 : minutes >= 60 ? 0.35 : 0.7),
      minutes >= 60 ? 25 * 60 : total,
    ),
  );
  let usedNew = 0;
  // People heading abroad get their destination track right after the first core lesson.
  const core = input.upcoming.filter((lesson) => lesson.track === "core");
  const tracks = input.upcoming.filter((lesson) => lesson.track !== "core");
  const ordered =
    input.relocation && tracks.length > 0
      ? [...core.slice(0, 1), ...tracks.slice(0, 1), ...core.slice(1), ...tracks.slice(1)]
      : [...core, ...tracks];
  for (const lesson of ordered) {
    const left = lesson.steps - lesson.stepIndex;
    if (left <= 0) continue;
    const perStep = (lesson.minutes * 60) / lesson.steps;
    const fullSeconds = Math.round(left * perStep);
    const budgetLeft = Math.min(newBudget - usedNew, remaining - usedNew);
    if (lesson.prerequisites?.some((id) => !available.has(id))) {
      if (lesson.track === "core") break;
      continue;
    }
    if (budgetLeft + 1 < perStep) break;
    // Only one track lesson per session, and only once the core lesson is placed.
    if (lesson.track !== "core" && blocks.some((b) => b.kind === "lesson" && b.track !== "core"))
      continue;
    let allowedSteps = Math.min(left, Math.floor((budgetLeft + 1) / perStep));
    const added = new Set<string>();
    if (lesson.introducedByStep) {
      let safe = 0;
      for (let offset = 0; offset < allowedSteps; offset += 1) {
        const ids = lesson.introducedByStep[lesson.stepIndex + offset] ?? [];
        const next = new Set([...added, ...ids.filter((id) => !available.has(id))]);
        if (newConcepts + next.size > cap) break;
        next.forEach((id) => added.add(id));
        safe += 1;
      }
      allowedSteps = safe;
    } else if (newConcepts + lesson.newConcepts > cap) {
      // Without step metadata, never assume a partial lesson introduces fewer concepts.
      allowedSteps = 0;
    }
    if (allowedSteps === 0) {
      if (lesson.track === "core") break;
      continue;
    }
    if (allowedSteps === left) {
      blocks.push({
        kind: "lesson",
        seconds: fullSeconds,
        lessonId: lesson.lessonId,
        startStep: lesson.stepIndex,
        track: lesson.track,
        reason:
          lesson.track === "core"
            ? lesson.stepIndex > 0
              ? "Continuar de onde você parou."
              : "Próximo passo do seu percurso."
            : "Situações reais do país para onde você vai.",
      });
      usedNew += fullSeconds;
    } else {
      const steps = allowedSteps;
      blocks.push({
        kind: "lesson",
        seconds: Math.round(steps * perStep),
        lessonId: lesson.lessonId,
        startStep: lesson.stepIndex,
        track: lesson.track,
        maxSteps: steps,
        reason: "Um pedaço da próxima lição — o resto fica para amanhã.",
      });
      usedNew += Math.round(steps * perStep);
    }
    newConcepts += lesson.introducedByStep ? added.size : lesson.newConcepts;
    lesson.activityIdsByStep
      ?.slice(lesson.stepIndex, lesson.stepIndex + allowedSteps)
      .forEach((id) => {
        if (id) lessonActivities.add(id);
      });
    added.forEach((id) => {
      available.add(id);
      introduced.add(id);
    });
    if (allowedSteps < left) break; // Never skip the rest of a prerequisite lesson.
  }
  remaining -= usedNew;

  // 3. Skill blocks compete on weakness, goals and variety.
  const skillStates = Object.values(input.skills);
  const meanTheta =
    skillStates.reduce((sum, skill) => sum + skill.theta * reliability(skill.confidence), 0) /
    skillStates.reduce((sum, skill) => sum + reliability(skill.confidence), 0);
  const focusOptions: { skill: FocusSkill; score: number; items: Candidate[]; reason: string }[] =
    [];
  const practisedDims = new Map<FocusSkill, Dimension[]>([
    ["pronunciation", ["pronunciation", "listening"]],
    ["speaking", ["speaking"]],
    ["listening", ["listening"]],
    ["writing", ["recall", "writing"]],
  ]);
  const usedKeys = new Set(reviewItems.map((item) => `${item.conceptId}#${item.dimension}`));
  for (const [skill, dims] of practisedDims) {
    const pool = input.traces
      .filter((trace) => dims.includes(trace.dimension))
      .filter((trace) => !usedKeys.has(`${trace.conceptId}#${trace.dimension}`))
      .filter((trace) => {
        const info = input.concept(trace.conceptId);
        return skill === "pronunciation" ? info?.kind === "pronunciation" : info !== undefined;
      })
      .map((trace) => ({
        conceptId: trace.conceptId,
        dimension: trace.dimension,
        // Least stable first: that is where practice pays off most.
        priority: 1 / (1 + trace.stability),
        seconds: ITEM_SECONDS[trace.dimension],
      }))
      .sort((a, b) => b.priority - a.priority || a.conceptId.localeCompare(b.conceptId));
    if (pool.length === 0) continue;
    const estimate = input.skills[SKILL_FOR_FOCUS[skill]];
    const weakness = (meanTheta - estimate.theta) * reliability(estimate.confidence);
    const goal = input.relocation && (skill === "speaking" || skill === "listening") ? 0.3 : 0;
    const brazilianBoost = skill === "pronunciation" ? 0.2 : 0;
    const recentPenalty = input.recentBlocks.slice(0, 3).includes(`focus:${skill}`) ? 0.5 : 0;
    focusOptions.push({
      skill,
      score: weakness + goal + brazilianBoost - recentPenalty,
      items: pool,
      reason:
        estimate.confidence === "low"
          ? `Praticar e confirmar uma habilidade cuja estimativa ainda tem pouca confiança. ${FOCUS_REASON[skill]}`
          : weakness > 0.3 && estimate.confidence !== undefined
            ? `As evidências recentes indicam mais espaço para fortalecer esta habilidade. ${FOCUS_REASON[skill]}`
            : FOCUS_REASON[skill],
    });
  }
  focusOptions.sort((a, b) => b.score - a.score || a.skill.localeCompare(b.skill));

  const conversationFits =
    input.capabilities.conversation &&
    input.scenarioId !== undefined &&
    minutes >= 30 &&
    remaining >= CONVERSATION_SECONDS * 0.8;
  const conversationBudget = conversationFits ? Math.min(CONVERSATION_SECONDS, remaining * 0.6) : 0;

  const maxFocusBlocks = minutes <= 5 ? 1 : minutes <= 15 ? 1 : minutes <= 30 ? 2 : 3;
  for (const option of focusOptions.slice(0, maxFocusBlocks)) {
    const budget = Math.min(
      FOCUS_SECONDS * (minutes >= 60 ? 1.6 : 1),
      remaining - conversationBudget,
    );
    if (budget < 45) break;
    const items = takeWithin(option.items, budget);
    // A block of one or two items is not worth the context switch.
    if (items.length < 2 || secondsOf(items) < 45) continue;
    blocks.push({
      kind: "focus",
      skill: option.skill,
      seconds: secondsOf(items),
      items: items.map(({ conceptId, dimension }) => ({ conceptId, dimension })),
      reason: option.reason,
    });
    remaining -= secondsOf(items);
  }

  // 4. Conversation closes longer sessions.
  if (conversationFits && input.scenarioId) {
    blocks.push({
      kind: "conversation",
      seconds: Math.round(conversationBudget),
      scenarioId: input.scenarioId,
      reason: "Usar o que você aprendeu numa conversa de verdade.",
    });
    remaining -= conversationBudget;
  }

  // 5. Longer plans apply already met material in authored tasks, without touching FSRS.
  if (minutes >= 45 && input.practice?.length) {
    const selected = new Set<string>();
    const counts = new Map<FocusSkill, number>();
    let lastSkill: FocusSkill | undefined;
    const opportunities = input.practice
      .filter((p) => !lessonActivities.has(p.activityId))
      .filter((p) => p.concepts.every((id) => available.has(id)))
      .filter(
        (p) =>
          p.level <=
          input.skills[p.skill].theta + (input.skills[p.skill].confidence === "low" ? 0.5 : 0.8),
      );
    while (remaining >= 45) {
      const options = opportunities
        .filter((p) => !selected.has(p.activityId) && p.seconds <= remaining)
        .filter(
          (p) =>
            (counts.get(p.skill) ?? 0) <
            (p.skill === "reading" && input.skills.reading.theta >= meanTheta ? 2 : 6),
        );
      if (!options.length) break;
      options.sort((a, b) => {
        const priority = (p: PracticeOpportunity) => {
          const estimate = input.skills[p.skill];
          return (
            (meanTheta - estimate.theta) * reliability(estimate.confidence) +
            (p.skill === "speaking" || p.skill === "writing"
              ? pace === "accelerated" || pace === "immersion"
                ? 0.8
                : 0.4
              : 0) +
            (input.relocation && p.skill === "listening" ? 0.4 : 0) -
            (counts.get(p.skill) ?? 0) * 0.8 -
            (lastSkill === p.skill ? 2 : 0)
          );
        };
        return priority(b) - priority(a) || a.activityId.localeCompare(b.activityId);
      });
      const choice = options[0]!;
      selected.add(choice.activityId);
      counts.set(choice.skill, (counts.get(choice.skill) ?? 0) + 1);
      lastSkill = choice.skill;
      blocks.push({
        kind: "focus",
        skill: choice.skill,
        seconds: choice.seconds,
        items: [],
        activityIds: [choice.activityId],
        reason: `${FOCUS_REASON[choice.skill]} Prática adicional; a revisão espaçada mantém seu calendário.`,
      });
      remaining -= choice.seconds;
    }
  }

  // 6. Remaining due items may be reviewed; unused time never creates early reviews.
  if (remaining > 40) {
    const used = new Set(
      blocks.flatMap((block) =>
        "items" in block ? block.items.map((item) => `${item.conceptId}#${item.dimension}`) : [],
      ),
    );
    const extra = takeWithin(
      candidates.filter((c) => c.priority >= 1 && !used.has(`${c.conceptId}#${c.dimension}`)),
      remaining,
    );
    if (extra.length > 0) {
      const review = blocks.find((block) => block.kind === "review");
      if (review && review.kind === "review") {
        review.items.push(...extra.map(({ conceptId, dimension }) => ({ conceptId, dimension })));
        review.seconds += secondsOf(extra);
      } else {
        blocks.unshift({
          kind: "review",
          seconds: secondsOf(extra),
          items: extra.map(({ conceptId, dimension }) => ({ conceptId, dimension })),
          reason: "Revisões que já venceram, sem antecipar o calendário.",
        });
      }
    }
  }

  const boundedBlocks = splitReviewBlocks(blocks);
  return {
    version: 1,
    date: input.date,
    minutes,
    blocks: boundedBlocks,
    seconds: boundedBlocks.reduce((sum, block) => sum + block.seconds, 0),
    pace,
    newConceptLimit: dailyNewConceptLimit(input, backlog),
    newConceptIds: [...introduced],
    segments: learningSegments(boundedBlocks, minutes),
  };
}

/** Initial safeguards, not empirically calibrated individual retention capacity. */
export function dailyNewConceptLimit(input: PlannerInput, backlog = false): number {
  const level = Math.min(input.skills.reading.theta, input.skills.listening.theta);
  const levelCap = level < 1 ? 12 : level < 2 ? 16 : 20;
  const pace = studyPace(input.studyPace, input.dailyMinutes);
  const bonus =
    input.dailyMinutes >= 60 && (pace === "accelerated" || pace === "immersion") ? 2 : 0;
  const recent = input.traces.filter(
    (t) =>
      t.lastReview &&
      input.now.getTime() - t.lastReview.getTime() <= 14 * 86_400_000 &&
      t.lastScore !== null,
  );
  const struggling =
    recent.length >= 8 &&
    recent.reduce((sum, t) => sum + (t.lastScore ?? 0), 0) / recent.length < 0.75;
  return Math.ceil(
    Math.min(newConceptCap(input.dailyMinutes) + bonus, levelCap) / (backlog || struggling ? 2 : 1),
  );
}

function splitReviewBlocks(blocks: SessionBlock[]): SessionBlock[] {
  return blocks.flatMap((block): SessionBlock[] => {
    if (block.kind !== "review" || block.seconds <= 600) return [block];
    const result: SessionBlock[] = [];
    let items: ReviewItem[] = [];
    let seconds = 0;
    for (const item of block.items) {
      const cost = ITEM_SECONDS[item.dimension];
      if (seconds + cost > 600) {
        result.push({ ...block, items, seconds });
        items = [];
        seconds = 0;
      }
      items.push(item);
      seconds += cost;
    }
    if (items.length) result.push({ ...block, items, seconds });
    return result;
  });
}

export function learningSegments(
  blocks: readonly SessionBlock[],
  minutes: number,
): LearningSegment[] {
  if (!blocks.length) return [];
  const limit = minutes > 60 ? 25 * 60 : Infinity;
  const segments: LearningSegment[] = [];
  let start = 0;
  let seconds = 0;
  for (let i = 0; i < blocks.length; i += 1) {
    const cost = blocks[i]!.seconds;
    if (seconds > 0 && seconds + cost > limit) {
      segments.push({ start, end: i, seconds });
      start = i;
      seconds = 0;
    }
    seconds += cost;
  }
  segments.push({ start, end: blocks.length, seconds });
  return segments;
}

export function blockKinds(plan: SessionPlan): BlockKind[] {
  return plan.blocks.map((block) =>
    block.kind === "focus" ? (`focus:${block.skill}` as const) : block.kind,
  );
}
