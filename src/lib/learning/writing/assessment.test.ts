import { describe, expect, it } from "vitest";
import { openWritingActivitySchema } from "@/lib/content/schema";
import {
  assessWriting,
  WRITING_CRITERIA,
  writingAnalysis,
  writingJudgmentSchema,
  writingPrompt,
  type WritingJudgment,
} from "./assessment";

const original =
  "Bonjour, je suis 25 ans et je besoin d'aide pour trouver un travail à Montréal. Je voudrais commencer lundi et apprendre avec mes collègues.";
const activity = openWritingActivitySchema.parse({
  id: "writing-test",
  type: "open_writing",
  prompt: { pt: "Apresente-se a um colega." },
  minWords: 20,
  modelAnswer: "Bonjour, j'ai 25 ans.",
  focus: ["Clareza"],
  rubric: {
    version: 1,
    expectedLevel: "A2",
    taskRequirements: ["Se apresentar", "Explicar um objetivo"],
  },
});
const concepts = new Map([
  ["gram:age-avoir", { level: "A0" as const }],
  ["lex:avoir-besoin-de", { level: "A1" as const }],
]);
function judgment(): WritingJudgment {
  return {
    criteria: Object.fromEntries(
      WRITING_CRITERIA.map((key) => [key, { band: 3, evidence: ["Bonjour"] }]),
    ) as WritingJudgment["criteria"],
    confidence: 0.9,
    feedbackPt: "Você comunicou seu objetivo. Revise as estruturas com avoir.",
    limitations: [],
    issues: [],
  };
}
const run = (changes: Partial<Parameters<typeof assessWriting>[0]> = {}) =>
  assessWriting({ original, activity, judgment: judgment(), model: "test", concepts, ...changes });

describe("structured writing assessment", () => {
  it("preserves the original, seven separate dimensions and capped evidence confidence", () => {
    const result = run();
    expect(result.original).toBe(original);
    expect(Object.keys(result.criteria!)).toHaveLength(7);
    expect(result.score).toBeCloseTo(0.75);
    expect(result.confidence).toBe(0.65);
    expect(result.quality).toBe(0.5);
    expect(result.issues.flatMap((i) => i.concepts)).toEqual([
      "gram:age-avoir",
      "lex:avoir-besoin-de",
    ]);
  });
  it("rejects missing dimensions, out-of-range bands and invented rubric evidence", () => {
    const invalid = judgment();
    invalid.criteria.grammar.band = 5;
    expect(writingJudgmentSchema.safeParse(invalid).success).toBe(false);
    const invented = judgment();
    invented.criteria.taskCompletion.evidence = ["I invented this"];
    expect(() => run({ judgment: invented })).toThrow("Invented");
    const missing = judgment();
    missing.criteria.cohesion.evidence = [];
    expect(() => run({ judgment: missing })).toThrow("Missing");
  });
  it("uses word count only to limit task completion, not grammar", () => {
    const result = run({ activity: { ...activity, minWords: 100 } });
    expect(result.criteria?.taskCompletion.band).toBe(2);
    expect(result.criteria?.grammar.band).toBe(3);
    expect(writingAnalysis("J'ai vingt-cinq ans.").wordCount).toBe(3);
  });
  it("does not grade low-confidence judgments", () => {
    expect(run({ judgment: { ...judgment(), confidence: 0.2 } })).toMatchObject({
      score: null,
      method: "not_assessed",
    });
  });
  it("never maps model-only corrections or advanced/quoted experimentation to mastery", () => {
    const j = judgment();
    j.issues = [
      {
        wrong: "Montréal",
        right: "Paris",
        criterion: "vocabulary",
        importance: "meaning",
        confidence: 0.9,
        explanationPt: "Correção duvidosa.",
      },
    ];
    const result = run({ judgment: j, concepts: new Map([["gram:age-avoir", { level: "B2" }]]) });
    expect(result.issues.flatMap((i) => i.concepts)).toEqual([]);
    expect(result.issues.find((i) => !i.deterministic)?.concepts).toEqual([]);
    const quoted = "Bonjour, il a écrit «je suis 25 ans» comme exemple.";
    expect(run({ original: quoted }).issues).toEqual([]);
  });
  it("selects at most three important corrections and preserves regional choices", () => {
    const j = judgment();
    j.issues = [
      {
        wrong: "Montréal",
        right: "Paris",
        criterion: "vocabulary",
        importance: "minor",
        confidence: 0.95,
        explanationPt: "Préférence stylistique.",
      },
    ];
    expect(run({ judgment: j }).issues).toHaveLength(2);
    const prompt = writingPrompt(activity, original);
    expect(prompt.system).toContain("Accept France/Québec variants");
    expect(prompt.system).toContain("beyond the expected level");
    expect(prompt.input).not.toContain(activity.modelAnswer);
  });
});
