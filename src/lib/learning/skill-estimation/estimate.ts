import { z } from "zod";
import { CEFR_LEVELS, readTheta, type CefrLevel } from "../cefr";
import { posterior, DEFAULT_DISCRIMINATION, type NormalBelief } from "../placement/model";
import { SKILLS, type Skill } from "../skills";

export const EVIDENCE_SOURCES = [
  "placement",
  "lesson",
  "review",
  "speech",
  "writing",
  "tutor",
  "authentic",
] as const;
export const evidenceSchema = z.object({
  key: z.string().min(1).max(250),
  taskId: z.string().min(1).max(180),
  skill: z.enum(SKILLS),
  difficulty: z.number().min(0).max(6),
  score: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  quality: z.number().min(0).max(1),
  guess: z.number().min(0).max(0.75),
  occurredAt: z.date(),
  concepts: z.array(z.string().max(150)).max(30),
  source: z.enum(EVIDENCE_SOURCES),
  assessment: z.enum(["deterministic", "provider", "ai", "self_report", "simulated"]),
  /** A broad comprehension/production task, rather than a memorised fragment. */
  substantial: z.boolean(),
});
export type SkillEvidence = z.infer<typeof evidenceSchema>;
export interface SkillCalibration extends NormalBelief {
  at: Date;
  method:
    | "objective"
    | "ai_assessment"
    | "perception"
    | "self_assessment"
    | "self_report"
    | "not_assessed";
}
export type EstimateReason =
  "calibration" | "collecting" | "strengthening" | "promoted" | "demoted";
export interface ContinuousEstimate extends NormalBelief {
  band: CefrLevel;
  reason: EstimateReason;
  evidenceCount: number;
  evidenceDays: number;
  distinctTasks: number;
  effectiveWeight: number;
}
const DAY = 86_400_000;
export const EVIDENCE_HALF_LIFE_DAYS = 90;
const SOURCE_WEIGHT: Record<SkillEvidence["source"], number> = {
  placement: 2,
  lesson: 1,
  review: 0.35,
  speech: 0.8,
  writing: 0.5,
  tutor: 0.15,
  authentic: 0.8,
};

export function evidenceWeight(e: SkillEvidence, now: Date): number {
  if (e.assessment === "simulated" || e.assessment === "self_report" || e.source === "placement")
    return 0;
  if ((e.skill === "speaking" || e.skill === "pronunciation") && e.assessment !== "provider")
    return 0;
  const age = (now.getTime() - e.occurredAt.getTime()) / DAY;
  if (age < 0 || age > 730) return 0;
  return SOURCE_WEIGHT[e.source] * e.confidence * e.quality * 2 ** (-age / EVIDENCE_HALF_LIFE_DAYS);
}

/** First attempt per task/day; at most three observations per skill/day, with repeat discount. */
function observations(
  skill: Skill,
  calibration: SkillCalibration,
  evidence: readonly SkillEvidence[],
  now: Date,
) {
  const keys = new Set<string>();
  const days = new Map<string, number>();
  const repeats = new Map<string, number>();
  const selected: { evidence: SkillEvidence; weight: number }[] = [];
  for (const e of [...evidence].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime() || a.key.localeCompare(b.key),
  )) {
    if (e.skill !== skill || e.occurredAt < calibration.at) continue;
    const weight = evidenceWeight(e, now);
    if (weight <= 0) continue;
    const date = e.occurredAt.toISOString().slice(0, 10);
    const key = `${e.taskId}:${date}`;
    if (keys.has(key) || (days.get(date) ?? 0) >= 3) continue;
    keys.add(key);
    days.set(date, (days.get(date) ?? 0) + 1);
    const count = repeats.get(e.taskId) ?? 0;
    repeats.set(e.taskId, count + 1);
    selected.push({ evidence: e, weight: weight / (1 + count) });
  }
  return selected;
}

export function initialEstimate(calibration: SkillCalibration): ContinuousEstimate {
  return {
    mean: calibration.mean,
    sd: calibration.sd,
    band: readTheta(calibration.mean).level,
    reason: "calibration",
    evidenceCount: 0,
    evidenceDays: 0,
    distinctTasks: 0,
    effectiveWeight: 0,
  };
}

/** Independent per-skill posterior with an explicit, hysteretic display gate. No completion data. */
export function estimateSkill(params: {
  skill: Skill;
  calibration: SkillCalibration;
  evidence: readonly SkillEvidence[];
  now: Date;
  previous?: ContinuousEstimate;
}): ContinuousEstimate {
  const { skill, calibration, evidence, now } = params;
  const previous = params.previous ?? initialEstimate(calibration);
  const selected = observations(skill, calibration, evidence, now);
  if (selected.length === 0)
    return { ...previous, evidenceCount: 0, evidenceDays: 0, distinctTasks: 0, effectiveWeight: 0 };
  // The placement posterior anchors learning. A modest floor allows new evidence to matter;
  // time broadens uncertainty, never directly lowers the displayed level.
  const ageDays = Math.max(0, (now.getTime() - calibration.at.getTime()) / DAY);
  const prior = {
    mean: calibration.mean,
    sd: Math.min(1.2, Math.hypot(Math.max(0.5, calibration.sd), 0.2 * Math.sqrt(ageDays / 90))),
  };
  const raw = posterior(
    prior,
    selected.map(({ evidence: e, weight }) => ({
      item: {
        difficulty: e.difficulty,
        discrimination: DEFAULT_DISCRIMINATION,
        guess: e.guess,
        weight,
      },
      score: e.score,
    })),
  );
  const mean = Math.max(
    0,
    Math.min(6, previous.mean + Math.max(-0.12, Math.min(0.12, raw.mean - previous.mean))),
  );
  const sd = Math.max(0.35, raw.sd);
  const recent = selected.filter(
    ({ evidence: e }) =>
      (now.getTime() - e.occurredAt.getTime()) / DAY <= 90 &&
      e.substantial &&
      e.confidence >= 0.5 &&
      e.quality >= 0.5,
  );
  const effectiveWeight = selected.reduce((sum, e) => sum + e.weight, 0);
  const evidenceDays = new Set(
    recent.map(({ evidence: e }) => e.occurredAt.toISOString().slice(0, 10)),
  ).size;
  const distinctTasks = new Set(recent.map(({ evidence: e }) => e.taskId)).size;
  let band = previous.band;
  const index = CEFR_LEVELS.indexOf(band);
  const promotion = recent.filter(
    ({ evidence: e }) => e.difficulty >= index + 0.8 && e.difficulty <= index + 2 && e.score >= 0.8,
  );
  const promotionWeight = promotion.reduce((sum, e) => sum + e.weight, 0);
  const promotionDays = new Set(
    promotion.map(({ evidence: e }) => e.occurredAt.toISOString().slice(0, 10)),
  ).size;
  const promotionTasks = new Set(promotion.map(({ evidence: e }) => e.taskId)).size;
  let reason: EstimateReason = "collecting";
  // 80% one-sided confidence: mean must clear the boundary by 0.84 SD, plus breadth.
  if (
    index < CEFR_LEVELS.length - 1 &&
    promotion.length >= 10 &&
    promotionTasks >= 6 &&
    promotionDays >= 4 &&
    promotionWeight >= 6 &&
    mean - 0.84 * sd >= index + 1 + 0.05
  ) {
    band = CEFR_LEVELS[index + 1]!;
    reason = "promoted";
  } else {
    const failures = recent.filter(
      ({ evidence: e }) =>
        e.difficulty <= index + 0.5 && e.difficulty >= index - 0.5 && e.score <= 0.4,
    );
    const failureDays = new Set(
      failures.map(({ evidence: e }) => e.occurredAt.toISOString().slice(0, 10)),
    ).size;
    const failureTasks = new Set(failures.map(({ evidence: e }) => e.taskId)).size;
    // Demotion is deliberately harder and cannot result from ageing alone.
    if (
      index > 0 &&
      failures.length >= 12 &&
      failureDays >= 5 &&
      failureTasks >= 6 &&
      failures.reduce((sum, e) => sum + e.weight, 0) >= 7 &&
      mean + 1.04 * sd < index - 0.15
    ) {
      band = CEFR_LEVELS[index - 1]!;
      reason = "demoted";
    } else if (mean > index + 0.72 && recent.length >= 4 && distinctTasks >= 3)
      reason = "strengthening";
  }
  return {
    mean,
    sd,
    band,
    reason,
    evidenceCount: recent.length,
    evidenceDays,
    distinctTasks,
    effectiveWeight,
  };
}

export function estimateLabel(estimate: Pick<ContinuousEstimate, "band" | "reason">): string {
  return estimate.reason === "strengthening" ? `${estimate.band} — consolidando` : estimate.band;
}
export function estimateExplanation(
  estimate: Pick<ContinuousEstimate, "reason" | "evidenceCount" | "evidenceDays">,
): string {
  if (estimate.reason === "promoted")
    return `A estimativa avançou após resultados fortes em tarefas variadas, ao longo de ${estimate.evidenceDays} dias.`;
  if (estimate.reason === "demoted")
    return "A estimativa foi ajustada após dificuldades persistentes em tarefas variadas. Vamos consolidar essa habilidade.";
  if (estimate.reason === "strengthening")
    return "Resultados recentes estão fortalecendo esta habilidade; a próxima faixa ainda precisa de mais evidência.";
  if (estimate.reason === "calibration")
    return "Estimativa inicial; a prática recente ajudará a confirmá-la.";
  return `${estimate.evidenceCount} observações relevantes recentes. A faixa permanece estável enquanto reunimos evidência.`;
}
