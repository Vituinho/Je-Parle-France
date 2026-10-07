import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
  type Grade,
} from "ts-fsrs";
import type { Dimension } from "../skills";

/**
 * Memory model (ADR-002): one FSRS card per learner × concept × dimension,
 * plus evidence counters. Mastery states are *derived* from the card — never
 * stored separately — so "what the learner knows" and "what to review" cannot
 * drift apart.
 */

export const REQUEST_RETENTION = 0.9;

const scheduler = fsrs(
  generatorParameters({
    request_retention: REQUEST_RETENTION,
    maximum_interval: 365,
    enable_fuzz: true,
    enable_short_term: true,
    learning_steps: ["1m", "10m"],
    relearning_steps: ["10m"],
  }),
);

export type TraceSource = "lesson" | "review" | "placement_gap" | "tutor" | "practice" | "manual";

export interface MemoryTraceState {
  conceptId: string;
  dimension: Dimension;
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  /** FSRS state: 0 New, 1 Learning, 2 Review, 3 Relearning. */
  state: number;
  lastReview: Date | null;
  attempts: number;
  successes: number;
  lastScore: number | null;
  source: TraceSource;
  introducedAt: Date;
}

export interface ReviewLogRecord {
  conceptId: string;
  dimension: Dimension;
  rating: number;
  state: number;
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reviewedAt: Date;
}

function toCard(trace: MemoryTraceState): Card {
  return {
    due: trace.due,
    stability: trace.stability,
    difficulty: trace.difficulty,
    elapsed_days: trace.elapsedDays,
    scheduled_days: trace.scheduledDays,
    learning_steps: trace.learningSteps,
    reps: trace.reps,
    lapses: trace.lapses,
    state: trace.state as State,
    last_review: trace.lastReview ?? undefined,
  };
}

function fromCard(
  card: Card,
  base: Pick<MemoryTraceState, "conceptId" | "dimension" | "source" | "introducedAt">,
  evidence: Pick<MemoryTraceState, "attempts" | "successes" | "lastScore">,
): MemoryTraceState {
  return {
    ...base,
    ...evidence,
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review ?? null,
  };
}

/** A trace for a concept that has just been presented (teaching card) but not yet practised. */
export function introduceTrace(
  conceptId: string,
  dimension: Dimension,
  now: Date,
  source: TraceSource = "lesson",
): MemoryTraceState {
  return fromCard(
    createEmptyCard(now),
    { conceptId, dimension, source, introducedAt: now },
    { attempts: 0, successes: 0, lastScore: null },
  );
}

export interface Outcome {
  score: number;
  correct: boolean;
  verdict: "correct" | "almost" | "wrong" | "recorded";
  selfRated?: boolean;
  /** The learner asked for a hint or revealed the answer before answering. */
  hinted?: boolean;
}

/**
 * Maps a graded outcome to an FSRS rating. Deterministic and conservative:
 * Easy is never inferred automatically — a correct answer is "Good".
 */
export function ratingFor(outcome: Outcome): Grade {
  if (outcome.score < 0.5 || (!outcome.correct && outcome.verdict === "wrong")) return Rating.Again;
  if (outcome.hinted || outcome.verdict === "almost" || outcome.score < 0.9) return Rating.Hard;
  return Rating.Good;
}

/** Evidence below this weight only updates counters; it does not move the FSRS schedule. */
export const MIN_SCHEDULING_WEIGHT = 0.5;

export function applyReview(params: {
  trace: MemoryTraceState | null;
  conceptId: string;
  dimension: Dimension;
  outcome: Outcome;
  weight?: number;
  now: Date;
  source: TraceSource;
}): { trace: MemoryTraceState; log: ReviewLogRecord | null } {
  const { conceptId, dimension, outcome, now, source } = params;
  const weight = params.weight ?? 1;
  const current = params.trace ?? introduceTrace(conceptId, dimension, now, source);
  const evidence = {
    attempts: current.attempts + 1,
    // Self-ratings move the schedule but never count toward mastery on their own.
    successes: current.successes + (outcome.correct && !outcome.selfRated ? 1 : 0),
    lastScore: outcome.score,
  };
  const base = {
    conceptId,
    dimension,
    source: current.source,
    introducedAt: current.introducedAt,
  };
  if (weight < MIN_SCHEDULING_WEIGHT) {
    return { trace: { ...current, ...evidence }, log: null };
  }
  const rating = ratingFor(outcome);
  const { card, log } = scheduler.next(toCard(current), now, rating);
  return {
    trace: fromCard(card, base, evidence),
    log: {
      conceptId,
      dimension,
      rating: log.rating,
      state: log.state,
      due: log.due,
      stability: log.stability,
      difficulty: log.difficulty,
      elapsedDays: log.elapsed_days,
      scheduledDays: log.scheduled_days,
      learningSteps: log.learning_steps,
      reviewedAt: now,
    },
  };
}

/** Probability of recall right now (0…1). New cards have no memory yet (0). */
export function retrievability(trace: MemoryTraceState, now: Date): number {
  if (trace.reps === 0 || trace.state === State.New) return 0;
  return scheduler.get_retrievability(toCard(trace), now, false);
}

export function isDue(trace: MemoryTraceState, now: Date): boolean {
  return trace.due.getTime() <= now.getTime();
}

// ─── Mastery ───────────────────────────────────────────────────────────────

export const MASTERY_STATES = [
  "unseen",
  "introduced",
  "learning",
  "familiar",
  "strong",
  "mastered",
  "decaying",
] as const;
export type MasteryState = (typeof MASTERY_STATES)[number];

/** Thresholds on FSRS stability (days until recall probability falls to 90 %). */
export const STABILITY = { familiar: 3, strong: 21, mastered: 90 } as const;
export const DECAY_RETRIEVABILITY = 0.8;
export const MASTERED_MIN_SUCCESSES = 4;

export function masteryOf(trace: MemoryTraceState | null | undefined, now: Date): MasteryState {
  if (!trace) return "unseen";
  if (trace.reps === 0) return "introduced";
  if (trace.stability >= STABILITY.familiar && retrievability(trace, now) < DECAY_RETRIEVABILITY) {
    return "decaying";
  }
  if (trace.state === State.Learning || trace.state === State.Relearning) return "learning";
  if (trace.stability < STABILITY.familiar) return "learning";
  if (trace.stability < STABILITY.strong) return "familiar";
  if (trace.stability < STABILITY.mastered || trace.successes < MASTERED_MIN_SUCCESSES)
    return "strong";
  return "mastered";
}

/** Numeric value used to aggregate mastery into progress percentages. */
export const MASTERY_VALUE: Record<MasteryState, number> = {
  unseen: 0,
  introduced: 0.1,
  learning: 0.3,
  decaying: 0.45,
  familiar: 0.6,
  strong: 0.85,
  mastered: 1,
};

export const MASTERY_LABELS: Record<MasteryState, string> = {
  unseen: "Ainda não visto",
  introduced: "Apresentado",
  learning: "Aprendendo",
  familiar: "Familiar",
  strong: "Firme",
  mastered: "Dominado",
  decaying: "Precisa revisar",
};

export interface ConceptMastery {
  overall: MasteryState;
  byDimension: Partial<Record<Dimension, MasteryState>>;
  /** Tracked dimensions not practised yet. */
  missing: Dimension[];
}

/**
 * A concept is only as known as its weakest practised dimension; dimensions
 * never practised are reported separately so "reads it but cannot say it"
 * stays visible.
 */
export function conceptMastery(
  traces: readonly MemoryTraceState[],
  dimensions: readonly Dimension[],
  now: Date,
): ConceptMastery {
  const byDimension: Partial<Record<Dimension, MasteryState>> = {};
  const missing: Dimension[] = [];
  for (const dimension of dimensions) {
    const trace = traces.find((t) => t.dimension === dimension);
    const state = masteryOf(trace, now);
    byDimension[dimension] = state;
    if (state === "unseen") missing.push(dimension);
  }
  const practised = Object.values(byDimension).filter((state) => state !== "unseen");
  if (practised.length === 0) return { overall: "unseen", byDimension, missing };
  const overall = practised.reduce((weakest, state) =>
    MASTERY_VALUE[state] < MASTERY_VALUE[weakest] ? state : weakest,
  );
  return { overall, byDimension, missing };
}
