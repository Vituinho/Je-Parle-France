import { describe, expect, it } from "vitest";
import { fixtureIndex } from "@/test/content-fixture";
import type { Skill } from "../skills";
import { createPlan, type BankItem, type Estimates } from "./engine";
import { buildPlacementReport, confidenceOf, recommendStart, type ReportItem } from "./report";

const content = fixtureIndex();

function estimates(
  global: number,
  overrides: Partial<Record<Skill, Partial<Estimates["skills"][Skill]>>> = {},
): Estimates {
  const base = { mean: global, sd: 0.4, n: 4, selfAssessedOnly: false };
  const skills = Object.fromEntries(
    (
      [
        "reading",
        "listening",
        "speaking",
        "writing",
        "vocabulary",
        "grammar",
        "pronunciation",
      ] as Skill[]
    ).map((skill) => [skill, { ...base, ...overrides[skill] }]),
  ) as Estimates["skills"];
  return { global: { mean: global, sd: 0.3, n: 20 }, skills };
}

function item(
  id: string,
  skill: Skill,
  level: "A0" | "A1" | "A2",
  topic: string,
  concepts: string[] = [],
): ReportItem {
  const difficulty = { A0: 0.5, A1: 1.5, A2: 2.5 }[level];
  const bank: BankItem = {
    id,
    skill,
    params: { difficulty, discrimination: 1.7, guess: 0, weight: 1 },
    calibration: false,
    selfAssessment: false,
    requires: [],
  };
  return { bank, level, topic, concepts };
}

describe("placement report", () => {
  const plan = createPlan({
    mode: "quick",
    prior: { mean: 2, sd: 1 },
    capabilities: { speech: false, ai: false },
  });

  it("labels each skill with level, confidence and how it was measured", () => {
    const report = buildPlacementReport({
      plan,
      estimates: estimates(2.5, {
        speaking: { selfAssessedOnly: true, n: 2, sd: 0.7 },
        writing: { selfAssessedOnly: true, n: 2 },
        pronunciation: { n: 0, sd: 0.9 },
      }),
      responses: [],
      items: new Map(),
      content,
    });
    const bySkill = Object.fromEntries(report.skills.map((s) => [s.skill, s]));
    expect(report.overall.short).toBe("A2");
    expect(bySkill.reading?.method).toBe("objective");
    expect(bySkill.speaking?.method).toBe("self_assessment");
    expect(bySkill.speaking?.confidence).toBe("low");
    expect(bySkill.pronunciation?.method).toBe("not_assessed");
  });

  it("reports skills clearly above or below the overall level", () => {
    const report = buildPlacementReport({
      plan,
      estimates: estimates(2.5, { reading: { mean: 3.3 }, listening: { mean: 1.8 } }),
      responses: [],
      items: new Map(),
      content,
    });
    expect(report.strengths.map((f) => f.text)).toContain("Leitura acima do seu nível geral (B1)");
    expect(report.weaknesses.map((f) => f.text)).toContain(
      "Compreensão oral abaixo do seu nível geral (A1+)",
    );
  });

  it("finds topic weaknesses from unexpected failures and gaps below the learner's level", () => {
    const items = new Map<string, ReportItem>([
      ["g1", item("g1", "grammar", "A0", "Saudações", ["lex:bonjour"])],
      ["g2", item("g2", "grammar", "A0", "Saudações", ["lex:merci"])],
      ["g3", item("g3", "grammar", "A2", "Passado composto")],
    ]);
    const report = buildPlacementReport({
      plan,
      estimates: estimates(2.5),
      responses: [
        { itemId: "g1", score: 0, scored: true },
        { itemId: "g2", score: 0, scored: true },
        { itemId: "g3", score: 1, scored: true },
      ],
      items,
      content,
    });
    expect(report.weaknesses).toContainEqual({ kind: "topic", text: "Saudações" });
    expect(report.gaps.map((g) => g.conceptId)).toEqual(["lex:bonjour", "lex:merci"]);
  });

  it("maps posterior spread to confidence", () => {
    expect(confidenceOf(0.3)).toBe("high");
    expect(confidenceOf(0.5)).toBe("medium");
    expect(confidenceOf(0.9)).toBe("low");
  });
});

describe("recommended start", () => {
  it("starts beginners at the first A0 unit", () => {
    expect(recommendStart(0.2, content)).toMatchObject({
      level: "A0",
      unitId: "a0-u1",
      lessonId: "a0-u1-l1",
    });
  });

  it("places learners inside a level by how far they are into it", () => {
    expect(recommendStart(1.3, content).unitId).toBe("a1-u1");
    expect(recommendStart(1.9, content).unitId).toBe("a1-u2");
  });

  it("is honest when the level's content does not exist yet", () => {
    const recommendation = recommendStart(3.6, content);
    expect(recommendation.contentAvailable).toBe(false);
    expect(recommendation.level).toBe("B1");
    expect(recommendation.note).toContain("em produção");
    // …and still starts at the most advanced published content, not at A0.
    const last = content.paths.core.at(-1)!;
    const firstOfLevel = content.paths.core.find((ref) => ref.unit.level === last.unit.level)!;
    expect(recommendation.lessonId).toBe(firstOfLevel.lesson.id);
    expect(recommendation.lessonId).not.toBe(content.paths.core[0]!.lesson.id);
  });
});

describe("placement report noise control", () => {
  it("does not call one lucky multiple-choice guess a strength", () => {
    const plan = createPlan({
      mode: "quick",
      prior: { mean: 1, sd: 1 },
      capabilities: { speech: false, ai: false },
    });
    const guessed: ReportItem = {
      ...item("mc", "reading", "A2", "Anúncios"),
      bank: {
        ...item("mc", "reading", "A2", "Anúncios").bank,
        params: { difficulty: 2.5, discrimination: 1.7, guess: 0.25, weight: 1 },
      },
    };
    const report = buildPlacementReport({
      plan,
      estimates: estimates(0.4),
      responses: [{ itemId: "mc", score: 1, scored: true }],
      items: new Map([["mc", guessed]]),
      content,
    });
    expect(report.strengths.filter((f) => f.kind === "topic")).toEqual([]);
  });
});
