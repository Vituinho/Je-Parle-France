import { describe, expect, it } from "vitest";
import {
  evidenceSchema,
  evidenceWeight,
  estimateSkill,
  initialEstimate,
  type SkillCalibration,
  type SkillEvidence,
} from "./estimate";
const DAY = 86_400_000;
const START = new Date("2026-08-01T12:00:00Z");
const calibration: SkillCalibration = { mean: 2.5, sd: 0.4, at: START, method: "objective" };
const fixture = (i: number, overrides: Partial<SkillEvidence> = {}): SkillEvidence => ({
  key: `answer-${i}`,
  taskId: `task-${i}`,
  skill: "listening",
  difficulty: 3.5,
  score: 1,
  confidence: 1,
  quality: 1,
  guess: 0.25,
  occurredAt: new Date(START.getTime() + (i + 1) * DAY),
  concepts: ["lex:test"],
  source: "lesson",
  assessment: "deterministic",
  substantial: true,
  ...overrides,
});
function learn(evidence: SkillEvidence[], baseline = calibration) {
  let state = initialEstimate(baseline);
  for (let i = 0; i < evidence.length; i++)
    state = estimateSkill({
      skill: "listening",
      calibration: baseline,
      evidence: evidence.slice(0, i + 1),
      now: evidence[i]!.occurredAt,
      previous: state,
    });
  return state;
}
describe("conservative continuous skill estimation", () => {
  it("one B1 success cannot promote an A2 learner", () => {
    const result = learn([fixture(0)]);
    expect(result.band).toBe("A2");
    expect(result.mean).toBeLessThanOrEqual(2.62);
  });
  it("repeated strong, distinct B1 evidence over time can promote", () => {
    expect(learn(Array.from({ length: 24 }, (_, i) => fixture(i))).band).toBe("B1");
  });
  it("one failure does not demote", () => {
    const baseline = { ...calibration, mean: 3.5 };
    expect(learn([fixture(0, { score: 0, difficulty: 3 })], baseline).band).toBe("B1");
  });
  it("persistent broad failures can demote, without oscillating on one recovery", () => {
    const baseline = { ...calibration, mean: 3.3, sd: 0.6 };
    const evidence = Array.from({ length: 36 }, (_, i) => fixture(i, { score: 0, difficulty: 3 }));
    const state = learn(evidence, baseline);
    expect(state.band).toBe("A2");
    expect(
      estimateSkill({
        skill: "listening",
        calibration: baseline,
        evidence: [...evidence, fixture(37)],
        now: fixture(37).occurredAt,
        previous: state,
      }).band,
    ).toBe("A2");
  });
  it("old evidence loses influence but age alone never demotes", () => {
    const e = fixture(0);
    const later = new Date(e.occurredAt.getTime() + 90 * DAY);
    expect(evidenceWeight(e, later)).toBeCloseTo(evidenceWeight(e, e.occurredAt) / 2);
    const state = learn(Array.from({ length: 24 }, (_, i) => fixture(i)));
    expect(
      estimateSkill({ skill: "listening", calibration, evidence: [], now: later, previous: state })
        .band,
    ).toBe(state.band);
  });
  it("low-confidence evidence has less influence", () => {
    const high = Array.from({ length: 8 }, (_, i) => fixture(i));
    const low = high.map((e) => ({ ...e, confidence: 0.2 }));
    expect(learn(low).mean).toBeLessThan(learn(high).mean);
    expect(learn(low).evidenceCount).toBe(0);
  });
  it("keeps skills independent: reading never raises speaking", () => {
    const evidence = Array.from({ length: 24 }, (_, i) => fixture(i, { skill: "reading" }));
    expect(
      estimateSkill({ skill: "speaking", calibration, evidence, now: fixture(24).occurredAt }),
    ).toEqual(initialEstimate(calibration));
  });
  it("valid provider speech improves speaking; simulated and self-report cannot raise pronunciation", () => {
    const now = fixture(23).occurredAt;
    const evidence = Array.from({ length: 24 }, (_, i) =>
      fixture(i, { skill: "speaking", source: "speech", assessment: "provider" }),
    );
    expect(estimateSkill({ skill: "speaking", calibration, evidence, now }).mean).toBeGreaterThan(
      calibration.mean,
    );
    for (const assessment of ["simulated", "self_report", "ai"] as const)
      expect(
        estimateSkill({
          skill: "pronunciation",
          calibration,
          evidence: evidence.map((e) => ({ ...e, skill: "pronunciation", assessment })),
          now,
        }),
      ).toEqual(initialEstimate(calibration));
  });
  it("starts from placement and retakes recalibrate without reusing the same observations", () => {
    expect(initialEstimate(calibration)).toMatchObject({ mean: 2.5, sd: 0.4, band: "A2" });
    const evidence = Array.from({ length: 24 }, (_, i) => fixture(i));
    const retake = { ...calibration, mean: 3.4, at: fixture(25).occurredAt };
    expect(
      estimateSkill({ skill: "listening", calibration: retake, evidence, now: retake.at }),
    ).toEqual(initialEstimate(retake));
  });
  it("cannot promote by repeatedly solving the same item, cramming in one day, or memorised fragments", () => {
    for (const evidence of [
      Array.from({ length: 30 }, (_, i) => fixture(i, { taskId: "same" })),
      Array.from({ length: 30 }, (_, i) => fixture(i, { occurredAt: fixture(0).occurredAt })),
      Array.from({ length: 30 }, (_, i) => fixture(i, { substantial: false })),
    ])
      expect(learn(evidence).band).toBe("A2");
  });
  it("validates confidence, quality and result metadata", () => {
    expect(evidenceSchema.safeParse(fixture(0, { confidence: 1.5 })).success).toBe(false);
    expect(evidenceSchema.safeParse(fixture(0, { score: -1 })).success).toBe(false);
  });
});
