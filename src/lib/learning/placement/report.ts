import type { ContentIndex } from "@/lib/content/repository";
import type { Concept } from "@/lib/content/schema";
import { describeTheta, levelIndex, readTheta, shortLevelLabel, type CefrLevel } from "../cefr";
import { SKILLS, SKILL_LABELS, type Skill } from "../skills";
import type { BankItem, Estimates, PlacementMode, PlacementPlan, ResponseRecord } from "./engine";
import { probability } from "./model";
import type { WritingAssessment } from "../writing/assessment";

export type Confidence = "high" | "medium" | "low";
export type AssessmentMethod =
  "objective" | "ai_assessment" | "self_assessment" | "perception" | "not_assessed";

export interface SkillResult {
  skill: Skill;
  theta: number;
  sd: number;
  label: string;
  short: string;
  confidence: Confidence;
  method: AssessmentMethod;
  n: number;
}

export interface Finding {
  kind: "skill" | "topic";
  text: string;
}

export interface Gap {
  conceptId: string;
  title: string;
  level: CefrLevel;
}

export interface Recommendation {
  level: CefrLevel;
  unitId: string | null;
  lessonId: string | null;
  unitTitle: string | null;
  contentAvailable: boolean;
  note: string | null;
}

export interface PlacementReport {
  version: 1;
  mode: PlacementMode;
  overall: { theta: number; sd: number; label: string; short: string; level: CefrLevel };
  skills: SkillResult[];
  strengths: Finding[];
  weaknesses: Finding[];
  gaps: Gap[];
  recommendation: Recommendation;
  writing?: WritingAssessment[];
}

/** Item metadata the report needs (from content). */
export interface ReportItem {
  bank: BankItem;
  level: CefrLevel;
  topic: string;
  concepts: string[];
}

export function confidenceOf(sd: number): Confidence {
  if (sd <= 0.35) return "high";
  if (sd <= 0.6) return "medium";
  return "low";
}

function methodFor(
  skill: Skill,
  estimates: Estimates,
  plan: PlacementPlan,
  items: ReportItem[],
): AssessmentMethod {
  const estimate = estimates.skills[skill];
  if (estimate.n === 0) return "not_assessed";
  if (estimate.selfAssessedOnly) return "self_assessment";
  if (items.some((item) => item.bank.skill === skill && item.bank.aiAssessed))
    return "ai_assessment";
  if (skill === "pronunciation") {
    const answered = items.filter((item) => item.bank.skill === "pronunciation");
    // Secure server audio does not turn a perception drill into production evidence.
    if (
      !plan.capabilities.speech ||
      answered.every((item) => item.bank.perception ?? !item.bank.requires.includes("speech"))
    ) {
      return "perception";
    }
  }
  return "objective";
}

export function conceptTitle(concept: Concept | undefined): string | undefined {
  if (!concept) return undefined;
  return concept.kind === "lexical" ? concept.french : concept.title.pt;
}

/**
 * Turns posterior estimates and responses into the learner-facing report.
 * Strengths/weaknesses use residuals: observed score minus the score the
 * model expected at the learner's estimated ability for that skill.
 */
export function buildPlacementReport(params: {
  plan: PlacementPlan;
  estimates: Estimates;
  responses: readonly ResponseRecord[];
  items: ReadonlyMap<string, ReportItem>;
  content: ContentIndex;
}): PlacementReport {
  const { plan, estimates, responses, items, content } = params;
  const answeredItems = responses
    .filter((response) => response.scored)
    .map((response) => ({ response, item: items.get(response.itemId) }))
    .filter((entry): entry is { response: ResponseRecord; item: ReportItem } =>
      Boolean(entry.item),
    );

  const overallTheta = estimates.global.mean;
  const overallReading = readTheta(overallTheta);

  const skills: SkillResult[] = SKILLS.map((skill) => {
    const estimate = estimates.skills[skill];
    return {
      skill,
      theta: estimate.mean,
      sd: estimate.sd,
      label: describeTheta(estimate.mean),
      short: shortLevelLabel(estimate.mean),
      confidence: confidenceOf(estimate.sd),
      method: methodFor(
        skill,
        estimates,
        plan,
        answeredItems.map((entry) => entry.item),
      ),
      n: estimate.n,
    };
  });

  // Skill-level findings (only skills with objective evidence).
  const strengths: Finding[] = [];
  const weaknesses: Finding[] = [];
  for (const result of skills) {
    if (result.method === "not_assessed" || result.method === "self_assessment") continue;
    const delta = result.theta - overallTheta;
    const name = SKILL_LABELS[result.skill].pt;
    if (delta >= 0.4)
      strengths.push({ kind: "skill", text: `${name} acima do seu nível geral (${result.short})` });
    if (delta <= -0.4)
      weaknesses.push({
        kind: "skill",
        text: `${name} abaixo do seu nível geral (${result.short})`,
      });
  }

  // Topic-level residuals.
  const byTopic = new Map<
    string,
    { observed: number; expected: number; difficulty: number; count: number; guessable: boolean }
  >();
  for (const { response, item } of answeredItems) {
    if (item.bank.selfAssessment) continue;
    const theta = estimates.skills[item.bank.skill].mean;
    const entry = byTopic.get(item.topic) ?? {
      observed: 0,
      expected: 0,
      difficulty: 0,
      count: 0,
      guessable: false,
    };
    entry.guessable ||= item.bank.params.guess > 0;
    entry.observed += response.score;
    entry.expected += probability(theta, item.bank.params);
    entry.difficulty += item.bank.params.difficulty;
    entry.count += 1;
    byTopic.set(item.topic, entry);
  }
  const residuals = [...byTopic.entries()].map(([topic, entry]) => ({
    topic,
    residual: entry.observed - entry.expected,
    difficulty: entry.difficulty / entry.count,
    // A single right answer on a guessable item is too weak to call a strength.
    reliable: entry.count >= 2 || !entry.guessable,
  }));
  residuals
    .filter((r) => r.reliable && r.residual >= 0.55 && r.difficulty >= overallTheta - 0.3)
    .sort((a, b) => b.residual - a.residual)
    .slice(0, 4)
    .forEach((r) => strengths.push({ kind: "topic", text: r.topic }));
  residuals
    .filter((r) => r.residual <= -0.55)
    .sort((a, b) => a.residual - b.residual)
    .slice(0, 4)
    .forEach((r) => weaknesses.push({ kind: "topic", text: r.topic }));

  // Gaps: concepts below the learner's level that they got wrong.
  const gaps: Gap[] = [];
  const seen = new Set<string>();
  for (const { response, item } of answeredItems) {
    if (response.score >= 0.5 || item.bank.selfAssessment) continue;
    if (levelIndex(item.level) >= levelIndex(overallReading.level)) continue;
    for (const conceptId of item.concepts) {
      const concept = content.concepts.get(conceptId);
      if (!concept || seen.has(conceptId)) continue;
      seen.add(conceptId);
      gaps.push({ conceptId, title: conceptTitle(concept) ?? conceptId, level: concept.level });
    }
  }

  return {
    version: 1,
    mode: plan.mode,
    overall: {
      theta: overallTheta,
      sd: estimates.global.sd,
      label: describeTheta(overallTheta),
      short: shortLevelLabel(overallTheta),
      level: overallReading.level,
    },
    skills,
    strengths,
    weaknesses,
    gaps,
    recommendation: recommendStart(overallTheta, content),
  };
}

/**
 * Recommended starting point in the core path: slightly below the estimate
 * (consolidation is cheaper than gaps), positioned inside the level by how far
 * the learner already is into it.
 */
export function recommendStart(theta: number, content: ContentIndex): Recommendation {
  const target = readTheta(Math.max(0, theta - 0.25));
  const path = content.paths.core;
  const atLevel = path.filter((ref) => ref.unit.level === target.level);
  if (atLevel.length > 0) {
    const unitIds = [...new Set(atLevel.map((ref) => ref.unit.id))];
    const unitIndex = Math.min(unitIds.length - 1, Math.floor(target.progress * unitIds.length));
    const first = atLevel.find((ref) => ref.unit.id === unitIds[unitIndex]) ?? atLevel[0];
    return {
      level: target.level,
      unitId: first?.unit.id ?? null,
      lessonId: first?.lesson.id ?? null,
      unitTitle: first?.unit.title.pt ?? null,
      contentAvailable: true,
      note: null,
    };
  }
  const highest = [...path].reverse()[0];
  const highestLevel = highest?.unit.level;
  const higherThanContent =
    highestLevel !== undefined && levelIndex(target.level) > levelIndex(highestLevel);
  if (higherThanContent) {
    // Above the published course: start at the most advanced level that exists
    // (its first unit — consolidation), never back at the beginning.
    const first = path.find((ref) => ref.unit.level === highestLevel);
    return {
      level: target.level,
      unitId: first?.unit.id ?? null,
      lessonId: first?.lesson.id ?? null,
      unitTitle: first?.unit.title.pt ?? null,
      contentAvailable: false,
      note: `As unidades do ${target.level} ainda estão em produção. Até lá, você começa pelo ${highestLevel}, o nível mais avançado publicado, para consolidar, e sua sessão diária combina revisão, escuta, pronúncia, conversa com o tutor e as trilhas Vivre au Canada e Vivre en France.`,
    };
  }
  return {
    level: target.level,
    unitId: null,
    lessonId: null,
    unitTitle: null,
    contentAvailable: false,
    note: "Ainda não há unidades publicadas para este nível.",
  };
}
