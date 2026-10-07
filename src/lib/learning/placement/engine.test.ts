import { describe, expect, it } from "vitest";
import type { Skill } from "../skills";
import { seededRandom } from "../random";
import {
  computeEstimates,
  createPlan,
  nextStep,
  type BankItem,
  type EngineState,
  type PlacementMode,
  type ResponseRecord,
} from "./engine";
import { probability } from "./model";

const OBJECTIVE: Skill[] = [
  "vocabulary",
  "grammar",
  "reading",
  "listening",
  "writing",
  "pronunciation",
  "speaking",
];

function syntheticBank(): Map<string, BankItem> {
  const bank = new Map<string, BankItem>();
  for (const skill of OBJECTIVE) {
    for (let i = 0; i < 24; i += 1) {
      const difficulty = 0.3 + i * 0.24;
      const id = `${skill}-${i}`;
      bank.set(id, {
        id,
        skill,
        params: { difficulty, discrimination: 1.7, guess: i % 2 === 0 ? 0.25 : 0, weight: 1 },
        calibration: ["vocabulary", "grammar", "reading"].includes(skill) && i % 3 === 0,
        selfAssessment: false,
        requires: skill === "speaking" ? ["speech"] : [],
      });
    }
  }
  for (const skill of ["speaking", "writing"] as Skill[]) {
    for (let level = 0; level < 6; level += 1) {
      const id = `${skill}-can-do-${level}`;
      bank.set(id, {
        id,
        skill,
        params: { difficulty: level + 0.5, discrimination: 0.9, guess: 0, weight: 0.5 },
        calibration: false,
        selfAssessment: true,
        requires: [],
      });
    }
  }
  return bank;
}

const bank = syntheticBank();

/** Runs a full adaptive test for a simulated learner with per-skill true abilities. */
function simulate(params: {
  mode: PlacementMode;
  truth: Partial<Record<Skill, number>> & { default: number };
  seed: string;
  speech?: boolean;
  onlySkills?: Skill[];
}) {
  const plan = createPlan({
    mode: params.mode,
    prior: { mean: 2, sd: 1.5 },
    capabilities: { speech: params.speech ?? false, ai: false },
    onlySkills: params.onlySkills,
  });
  const responses: ResponseRecord[] = [];
  const random = seededRandom(`answers:${params.seed}`);
  const phases: string[] = [];
  for (let guard = 0; guard < 200; guard += 1) {
    const state: EngineState = { plan, responses, seed: params.seed };
    const step = nextStep(state, bank);
    if (!step) break;
    phases.push(
      step.phase.kind === "calibration" ? "calibration" : `${step.phase.kind}:${step.phase.skill}`,
    );
    const theta = params.truth[step.item.skill] ?? params.truth.default;
    const score = step.item.selfAssessment
      ? theta > step.item.params.difficulty + 0.3
        ? 1
        : theta > step.item.params.difficulty - 0.3
          ? 0.5
          : 0
      : random() < probability(theta, step.item.params)
        ? 1
        : 0;
    responses.push({ itemId: step.item.id, score, scored: true });
  }
  const state: EngineState = { plan, responses, seed: params.seed };
  return { plan, responses, phases, estimates: computeEstimates(state, bank) };
}

describe("adaptive placement engine", () => {
  it("is deterministic for the same seed and responses", () => {
    const plan = createPlan({
      mode: "quick",
      prior: { mean: 2, sd: 1 },
      capabilities: { speech: false, ai: false },
    });
    const state: EngineState = {
      plan,
      responses: [{ itemId: "vocabulary-9", score: 1, scored: true }],
      seed: "attempt-1",
    };
    expect(nextStep(state, bank)?.item.id).toBe(nextStep(state, bank)?.item.id);
  });

  it("starts with a calibration block that alternates skills", () => {
    const { phases, responses } = simulate({ mode: "quick", truth: { default: 2.5 }, seed: "cal" });
    expect(phases.slice(0, 4)).toEqual(Array(4).fill("calibration"));
    const skills = responses.slice(0, 4).map((r) => bank.get(r.itemId)?.skill);
    for (let i = 1; i < skills.length; i += 1) expect(skills[i]).not.toBe(skills[i - 1]);
  });

  it("keeps the quick test short and ends with self-assessment of speaking and writing", () => {
    const { responses, phases } = simulate({
      mode: "quick",
      truth: { default: 2.5 },
      seed: "quick",
    });
    expect(responses.length).toBeGreaterThanOrEqual(4 + 4 * 2 + 4);
    expect(responses.length).toBeLessThanOrEqual(4 + 4 * 4 + 4);
    expect(phases.at(-1)).toBe("self_assessment:writing");
    expect(phases).toContain("self_assessment:speaking");
  });

  it("estimates overall ability within a useful margin across many simulated learners", () => {
    for (const mode of ["quick", "complete"] as const) {
      const errors: number[] = [];
      for (let learner = 0; learner < 40; learner += 1) {
        const truth = 0.6 + (learner / 39) * 4.8;
        const { estimates } = simulate({
          mode,
          truth: { default: truth },
          seed: `${mode}-${learner}`,
        });
        errors.push(Math.abs(estimates.global.mean - truth));
      }
      const meanError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
      expect(meanError, `${mode} mean absolute error`).toBeLessThan(mode === "quick" ? 0.6 : 0.45);
    }
  });

  it("separates skills when a learner reads much better than they listen", () => {
    const readingMinusListening: number[] = [];
    for (let i = 0; i < 10; i += 1) {
      const { estimates } = simulate({
        mode: "complete",
        truth: { default: 3, reading: 4.2, listening: 1.8 },
        seed: `profile-${i}`,
      });
      readingMinusListening.push(estimates.skills.reading.mean - estimates.skills.listening.mean);
    }
    const average = readingMinusListening.reduce((s, d) => s + d, 0) / readingMinusListening.length;
    expect(average).toBeGreaterThan(1.2);
  });

  it("never serves items that need an unavailable capability and falls back to self-assessment", () => {
    const { responses, plan, estimates } = simulate({
      mode: "complete",
      truth: { default: 2.5 },
      seed: "nospeech",
      speech: false,
    });
    expect(plan.selfAssessSkills).toEqual(["speaking"]);
    expect(responses.some((r) => bank.get(r.itemId)?.requires.includes("speech"))).toBe(false);
    expect(estimates.skills.speaking.selfAssessedOnly).toBe(true);
  });

  it("measures speaking objectively when speech is available", () => {
    const { plan, estimates } = simulate({
      mode: "complete",
      truth: { default: 2.5 },
      seed: "speech",
      speech: true,
    });
    expect(plan.skills).toContain("speaking");
    expect(estimates.skills.speaking.selfAssessedOnly).toBe(false);
    expect(estimates.skills.speaking.n).toBeGreaterThanOrEqual(3);
  });

  it("ignores unscored responses", () => {
    const plan = createPlan({
      mode: "quick",
      prior: { mean: 2, sd: 1 },
      capabilities: { speech: false, ai: false },
    });
    const base = computeEstimates({ plan, responses: [], seed: "x" }, bank);
    const withUnscored = computeEstimates(
      { plan, responses: [{ itemId: "grammar-20", score: 1, scored: false }], seed: "x" },
      bank,
    );
    expect(withUnscored.global.mean).toBeCloseTo(base.global.mean, 6);
  });

  it("retakes a single skill without calibration", () => {
    const { responses, phases } = simulate({
      mode: "skill",
      onlySkills: ["listening"],
      truth: { default: 3 },
      seed: "retake",
    });
    expect(phases.every((phase) => phase === "skill:listening")).toBe(true);
    expect(responses.length).toBeGreaterThanOrEqual(4);
    expect(responses.length).toBeLessThanOrEqual(8);
  });
});
