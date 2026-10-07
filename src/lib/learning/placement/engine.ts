import type { Skill } from "../skills";
import { seededRandom } from "../random";
import {
  information,
  logLikelihoodVector,
  posteriorFromLogLikelihood,
  sumVectors,
  type ItemParams,
  type NormalBelief,
  type Observation,
} from "./model";

/**
 * Adaptive placement engine. Pure and deterministic: the next item and all
 * estimates are a function of (plan, responses, item bank, seed). Persisted
 * responses are therefore the single source of truth for an attempt.
 *
 * Flow: calibration block (mixed vocabulary/grammar/reading) → one adaptive
 * block per skill → can-do self-assessment for skills that cannot be measured
 * objectively in this mode or on this device.
 */
export type PlacementMode = "quick" | "complete" | "skill";
export type Capability = "speech" | "ai";

export interface BankItem {
  id: string;
  skill: Skill;
  params: ItemParams;
  calibration: boolean;
  selfAssessment: boolean;
  /** External capabilities needed to score the item. */
  requires: readonly Capability[];
}

export interface PlacementPlan {
  mode: PlacementMode;
  /** Objective adaptive blocks, in order. */
  skills: Skill[];
  /** Skills estimated through can-do self-assessment. */
  selfAssessSkills: Skill[];
  calibrationItems: number;
  minPerSkill: number;
  maxPerSkill: number;
  /** Stop a skill block once the posterior SD is at or below this. */
  targetSd: number;
  selfAssessPerSkill: number;
  prior: NormalBelief;
  capabilities: Record<Capability, boolean>;
}

export interface ResponseRecord {
  itemId: string;
  score: number;
  /** False when the response could not be scored (e.g. speech service failed). */
  scored: boolean;
}

export interface EngineState {
  plan: PlacementPlan;
  responses: readonly ResponseRecord[];
  seed: string;
}

/** SD of how far a single skill may sit from the learner's overall ability. */
export const SKILL_LINK_SD = 0.8;

export function createPlan(params: {
  mode: PlacementMode;
  prior: NormalBelief;
  capabilities: Record<Capability, boolean>;
  /** For `skill` mode: the skill(s) to retake. */
  onlySkills?: Skill[];
}): PlacementPlan {
  const { mode, prior, capabilities } = params;
  if (mode === "quick") {
    return {
      mode,
      skills: ["vocabulary", "grammar", "reading", "listening"],
      selfAssessSkills: ["speaking", "writing"],
      calibrationItems: 4,
      minPerSkill: 2,
      maxPerSkill: 4,
      targetSd: 0.5,
      selfAssessPerSkill: 2,
      prior,
      capabilities,
    };
  }
  if (mode === "complete") {
    const skills: Skill[] = [
      "vocabulary",
      "grammar",
      "reading",
      "listening",
      "writing",
      "pronunciation",
    ];
    if (capabilities.speech) skills.push("speaking");
    return {
      mode,
      skills,
      selfAssessSkills: capabilities.speech ? [] : ["speaking"],
      calibrationItems: 5,
      minPerSkill: 3,
      maxPerSkill: 7,
      targetSd: 0.35,
      selfAssessPerSkill: 3,
      prior,
      capabilities,
    };
  }
  const onlySkills = params.onlySkills ?? [];
  const needsSpeech = onlySkills.includes("speaking") && !capabilities.speech;
  return {
    mode,
    skills: onlySkills.filter((skill) => !(skill === "speaking" && needsSpeech)),
    selfAssessSkills: needsSpeech ? ["speaking"] : [],
    calibrationItems: 0,
    minPerSkill: 4,
    maxPerSkill: 8,
    targetSd: 0.35,
    selfAssessPerSkill: 3,
    prior,
    capabilities,
  };
}

// ─── Estimates ─────────────────────────────────────────────────────────────

export interface SkillEstimate extends NormalBelief {
  /** Scored responses used for this skill. */
  n: number;
  /** True when the only evidence is self-assessment. */
  selfAssessedOnly: boolean;
}

export interface Estimates {
  global: NormalBelief & { n: number };
  skills: Record<Skill, SkillEstimate>;
}

interface ScoredObservation extends Observation {
  skill: Skill;
  selfAssessment: boolean;
}

function observationsOf(
  state: EngineState,
  bank: ReadonlyMap<string, BankItem>,
): ScoredObservation[] {
  const observations: ScoredObservation[] = [];
  for (const response of state.responses) {
    const item = bank.get(response.itemId);
    if (!item || !response.scored) continue;
    observations.push({
      item: item.params,
      score: response.score,
      skill: item.skill,
      selfAssessment: item.selfAssessment,
    });
  }
  return observations;
}

const ALL_SKILLS: Skill[] = [
  "reading",
  "listening",
  "speaking",
  "writing",
  "vocabulary",
  "grammar",
  "pronunciation",
];

/**
 * Overall ability from every response; each skill from its own responses with
 * a prior centred on the ability implied by the *other* skills (so evidence is
 * not counted twice). With little skill-specific evidence the estimate stays
 * close to the overall level; with more it follows the skill's own data.
 */
export function computeEstimates(
  state: EngineState,
  bank: ReadonlyMap<string, BankItem>,
): Estimates {
  const observations = observationsOf(state, bank);
  const vectors = observations.map(logLikelihoodVector);
  const total = sumVectors(vectors);
  const global = posteriorFromLogLikelihood(state.plan.prior, total);
  const skills = {} as Record<Skill, SkillEstimate>;
  for (const skill of ALL_SKILLS) {
    const own = observations.filter((o) => o.skill === skill);
    const ownVector = sumVectors(vectors.filter((_, i) => observations[i]?.skill === skill));
    const othersVector = total.map((value, i) => value - (ownVector[i] as number));
    const others = posteriorFromLogLikelihood(state.plan.prior, othersVector);
    const prior = { mean: others.mean, sd: Math.hypot(others.sd, SKILL_LINK_SD) };
    const belief = own.length > 0 ? posteriorFromLogLikelihood(prior, ownVector) : prior;
    skills[skill] = {
      ...belief,
      n: own.length,
      selfAssessedOnly: own.length > 0 && own.every((o) => o.selfAssessment),
    };
  }
  return { global: { ...global, n: observations.length }, skills };
}

// ─── Item selection ────────────────────────────────────────────────────────

export type Phase =
  | { kind: "calibration" }
  | { kind: "skill"; skill: Skill }
  | { kind: "self_assessment"; skill: Skill };

export interface NextStep {
  item: BankItem;
  phase: Phase;
  /** Block-based progress: blocks finished / total blocks. */
  block: { index: number; total: number };
}

function usable(item: BankItem, plan: PlacementPlan): boolean {
  return item.requires.every((capability) => plan.capabilities[capability]);
}

/** Picks one of the most informative items at θ, with seeded exposure control. */
function pickInformative(
  candidates: BankItem[],
  theta: number,
  random: () => number,
  topK = 3,
): BankItem | undefined {
  const ranked = [...candidates].sort(
    (a, b) =>
      information(theta, b.params) - information(theta, a.params) || a.id.localeCompare(b.id),
  );
  const pool = ranked.slice(0, Math.min(topK, ranked.length));
  return pool[Math.floor(random() * pool.length)];
}

export function blocksOf(plan: PlacementPlan): Phase[] {
  return [
    ...(plan.calibrationItems > 0 ? [{ kind: "calibration" } as const] : []),
    ...plan.skills.map((skill) => ({ kind: "skill", skill }) as const),
    ...plan.selfAssessSkills.map((skill) => ({ kind: "self_assessment", skill }) as const),
  ];
}

export function nextStep(state: EngineState, bank: ReadonlyMap<string, BankItem>): NextStep | null {
  const { plan, responses } = state;
  const answered = new Set(responses.map((response) => response.itemId));
  const random = seededRandom(`${state.seed}:${responses.length}`);
  const available = [...bank.values()].filter(
    (item) => !answered.has(item.id) && usable(item, plan),
  );
  const estimates = computeEstimates(state, bank);
  const blocks = blocksOf(plan);
  let blockIndex = 0;

  // 1. Calibration
  if (plan.calibrationItems > 0) {
    if (responses.length < plan.calibrationItems) {
      const lastSkill = bank.get(responses.at(-1)?.itemId ?? "")?.skill;
      const calibration = available.filter((item) => item.calibration && !item.selfAssessment);
      const preferred = calibration.filter((item) => item.skill !== lastSkill);
      const item = pickInformative(
        preferred.length > 0 ? preferred : calibration,
        estimates.global.mean,
        random,
      );
      if (item)
        return { item, phase: { kind: "calibration" }, block: { index: 0, total: blocks.length } };
    }
    blockIndex += 1;
  }

  // 2. Objective skill blocks
  for (const skill of plan.skills) {
    const skillResponses = responses.filter(
      (r) => bank.get(r.itemId)?.skill === skill && !bank.get(r.itemId)?.selfAssessment,
    );
    const estimate = estimates.skills[skill];
    const enough =
      skillResponses.length >= plan.maxPerSkill ||
      (estimate.n >= plan.minPerSkill && estimate.sd <= plan.targetSd);
    if (!enough) {
      const candidates = available.filter((item) => item.skill === skill && !item.selfAssessment);
      const item = pickInformative(candidates, estimate.mean, random);
      if (item) {
        return {
          item,
          phase: { kind: "skill", skill },
          block: { index: blockIndex, total: blocks.length },
        };
      }
    }
    blockIndex += 1;
  }

  // 3. Self-assessment blocks
  for (const skill of plan.selfAssessSkills) {
    const done = responses.filter((r) => {
      const item = bank.get(r.itemId);
      return item?.skill === skill && item.selfAssessment;
    }).length;
    if (done < plan.selfAssessPerSkill) {
      const candidates = available.filter((item) => item.skill === skill && item.selfAssessment);
      // Self-assessment statements are chosen around the overall estimate.
      const item = pickInformative(candidates, estimates.global.mean, random, 2);
      if (item) {
        return {
          item,
          phase: { kind: "self_assessment", skill },
          block: { index: blockIndex, total: blocks.length },
        };
      }
    }
    blockIndex += 1;
  }

  return null;
}
