import { describe, expect, it } from "vitest";
import { course } from "@content/index";
import { buildContentIndex, conceptDimensions } from "@/lib/content/repository";
import { oracleResponse } from "@/test/oracle";
import { toAuthoredResponse } from "../activities/client";
import { gradeActivity } from "../grading/grade";
import { buildReviewActivity, recallForms } from "./generate";

const { index } = buildContentIndex(course);
if (!index) throw new Error("content must be valid");

describe("review activity generator", () => {
  it("turns taught vocabulary into dictation and prompted speech without unseen sentence material", () => {
    for (const conceptId of ["lex:bonjour", "lex:le-souper", "lex:nombres-0-10"]) {
      for (const dimension of ["listening", "speaking"] as const) {
        const activity = buildReviewActivity({
          index,
          conceptId,
          dimension,
          seed: "practice",
          productionPractice: true,
        })!;
        expect(activity.type).toBe(dimension === "listening" ? "dictation" : "speak");
        if (activity.type === "speak") expect(activity.mode).toBe("respond");
        const response = oracleResponse(activity, "seed", true);
        expect(
          gradeActivity(activity, toAuthoredResponse(activity, response, "seed")).correct,
        ).toBe(true);
        expect(
          buildReviewActivity({
            index,
            conceptId,
            dimension,
            seed: "practice",
            productionPractice: true,
          }),
        ).toEqual(activity);
      }
    }
    expect(
      buildReviewActivity({
        index,
        conceptId: "lex:bonjour",
        dimension: "listening",
        seed: "practice",
      })?.type,
    ).toBe("choice");
  });
  it("builds a correctly gradable exercise for every concept × tracked dimension", () => {
    let built = 0;
    for (const concept of index.concepts.values()) {
      for (const dimension of conceptDimensions(concept)) {
        const activity = buildReviewActivity({
          index,
          conceptId: concept.id,
          dimension,
          seed: "s1",
        });
        if (!activity) {
          // Only culture notes without authored practice may be skipped.
          expect(concept.kind, `${concept.id} ${dimension}`).toBe("culture");
          continue;
        }
        built += 1;
        expect(activity.type).not.toBe("teach");
        if (activity.type === "teach") continue;
        expect(
          activity.targets.some((t) => t.concept === concept.id && t.dimension === dimension),
          `${activity.id} targets ${concept.id}/${dimension}`,
        ).toBe(true);
        const response = oracleResponse(activity, "seed", true);
        const grade = gradeActivity(activity, toAuthoredResponse(activity, response, "seed"));
        expect(grade.correct, `${activity.id} accepts its own answer`).toBe(true);
      }
    }
    expect(built).toBeGreaterThan(100);
  });

  it("is deterministic per seed and varies across days", () => {
    const a = buildReviewActivity({
      index,
      conceptId: "lex:merci",
      dimension: "recognition",
      seed: "day-1",
    });
    const b = buildReviewActivity({
      index,
      conceptId: "lex:merci",
      dimension: "recognition",
      seed: "day-1",
    });
    expect(a).toEqual(b);
    const variants = new Set(
      Array.from({ length: 10 }, (_, i) =>
        JSON.stringify(
          buildReviewActivity({
            index,
            conceptId: "lex:nombres-0-10",
            dimension: "recall",
            seed: `day-${i}`,
          }),
        ),
      ),
    );
    expect(variants.size).toBeGreaterThan(1);
  });

  it("asks for the meaning with plausible distractors and never repeats an option", () => {
    const activity = buildReviewActivity({
      index,
      conceptId: "lex:bonjour",
      dimension: "recognition",
      seed: "x",
    });
    expect(activity?.type).toBe("choice");
    if (activity?.type !== "choice") return;
    expect(activity.options[activity.answer]).toBe("bom dia, boa tarde, olá");
    expect(new Set(activity.options).size).toBe(activity.options.length);
    expect(activity.options.length).toBe(4);
  });

  it("accepts every authored written form on recall", () => {
    const concept = index.concepts.get("lex:enchante");
    if (concept?.kind !== "lexical") throw new Error("fixture");
    expect(recallForms(concept)).toEqual(["enchanté", "enchantée"]);
  });

  it("turns a tutor correction into review exercises", () => {
    const personal = {
      id: "abc123",
      french: "J'ai besoin d'ouvrir un compte.",
      wrong: "Je besoin d'ouvrir un compte.",
      portuguese: "Eu preciso abrir uma conta.",
      explanation: "Avoir besoin de: ter necessidade de.",
    };
    const fix = buildReviewActivity({
      index,
      conceptId: "personal:abc123",
      dimension: "writing",
      seed: "s",
      personal,
    });
    expect(fix).toMatchObject({
      type: "error_correction",
      sentence: personal.wrong,
      accept: [personal.french],
    });
    const choose = buildReviewActivity({
      index,
      conceptId: "personal:abc123",
      dimension: "recognition",
      seed: "s",
      personal,
    });
    expect(choose?.type).toBe("choice");
  });
});

describe("regional vocabulary in reviews", () => {
  it("voices Québec words with a Canadian voice", () => {
    const activity = buildReviewActivity({
      index,
      conceptId: "lex:le-souper",
      dimension: "recognition",
      seed: "s1",
    });
    expect(activity?.type).toBe("choice");
    if (activity?.type !== "choice") return;
    expect(activity.prompt.audio?.region).toBe("fr-CA");
  });

  it("never offers the meaning of a homograph from the other region as a distractor", () => {
    const france = index.concepts.get("lex:le-diner-fr");
    expect(france?.kind).toBe("lexical");
    if (france?.kind !== "lexical") return;
    for (let i = 0; i < 40; i += 1) {
      const activity = buildReviewActivity({
        index,
        conceptId: "lex:le-diner-qc",
        dimension: "recognition",
        seed: `s${i}`,
      });
      if (activity?.type !== "choice") throw new Error("expected a choice");
      expect(activity.options).not.toContain(france.meaning);
    }
  });
});
