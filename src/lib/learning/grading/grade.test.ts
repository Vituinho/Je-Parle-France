import { describe, expect, it } from "vitest";
import { activitySchema, type Activity, type ActivityInput } from "@/lib/content/schema";
import { gradeActivity, GradingError } from "./grade";

const make = (input: ActivityInput): Activity => activitySchema.parse(input);

describe("gradeActivity", () => {
  it("grades multiple choice with targeted feedback for distractors", () => {
    const activity = make({
      id: "c1",
      type: "choice",
      prompt: { pt: "Como dizer “eu tenho 20 anos”?" },
      options: ["J'ai 20 ans.", "Je suis 20 ans."],
      answer: 0,
      optionFeedback: [null, { pt: "Em francês a idade usa avoir." }],
    });
    expect(gradeActivity(activity, { kind: "choice", choice: 0 })).toMatchObject({
      correct: true,
      score: 1,
    });
    expect(gradeActivity(activity, { kind: "choice", choice: 1 })).toMatchObject({
      correct: false,
      note: { pt: "Em francês a idade usa avoir." },
      expected: "J'ai 20 ans.",
    });
  });

  it("gives partial credit on fill-in-the-blank and builds the model sentence", () => {
    const activity = make({
      id: "f1",
      type: "fill",
      sentence: "Je ___ brésilien et j'___ 30 ans.",
      blanks: [{ accept: ["suis"] }, { accept: ["ai"] }],
    });
    const half = gradeActivity(activity, { kind: "blanks", blanks: ["suis", "est"] });
    expect(half.score).toBe(0.5);
    expect(half.parts).toEqual([true, false]);
    expect(half.expected).toBe("Je suis brésilien et j'ai 30 ans.");
  });

  it("accepts any authored order for sentence ordering", () => {
    const activity = make({
      id: "o1",
      type: "order",
      tokens: ["Demain", "je", "travaille"],
      alternatives: [["Je", "travaille", "demain"]],
    });
    const ok = gradeActivity(activity, { kind: "tokens", tokens: ["je", "travaille", "demain"] });
    const ko = gradeActivity(activity, { kind: "tokens", tokens: ["travaille", "je", "demain"] });
    expect(ok.correct).toBe(true);
    expect(ko.correct).toBe(false);
  });

  it("treats accent-only mistakes in typed answers as almost correct", () => {
    const activity = make({ id: "t1", type: "type", prompt: { pt: "café" }, accept: ["un café"] });
    const result = gradeActivity(activity, { kind: "text", text: "un cafe" });
    expect(result).toMatchObject({ verdict: "almost", correct: true });
    expect(result.note?.pt).toContain("acentos");
  });

  it("gives dictation partial credit for words heard correctly", () => {
    const activity = make({
      id: "d1",
      type: "dictation",
      audio: { text: "Je voudrais un café." },
      accept: ["Je voudrais un café."],
    });
    const result = gradeActivity(activity, { kind: "text", text: "je voudrai un" });
    expect(result.correct).toBe(false);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(0.8);
  });

  it("scores multi-select with penalties for wrong picks", () => {
    const activity = make({
      id: "m1",
      type: "multi_select",
      prompt: { pt: "Quais são femininas?" },
      options: ["la mer", "le lait", "la dent", "le sang"],
      answers: [0, 2],
    });
    expect(gradeActivity(activity, { kind: "choices", choices: [0, 2] }).score).toBe(1);
    expect(gradeActivity(activity, { kind: "choices", choices: [0, 1] }).score).toBe(0);
    expect(gradeActivity(activity, { kind: "choices", choices: [0] }).score).toBe(0.5);
  });

  it("grades matching per pair", () => {
    const match = make({
      id: "p1",
      type: "match",
      pairs: [
        { left: "bonjour", right: "bom dia" },
        { left: "merci", right: "obrigado" },
        { left: "salut", right: "oi" },
      ],
    });
    const result = gradeActivity(match, {
      kind: "pairs",
      pairs: [
        [0, 0],
        [1, 2],
        [2, 1],
      ],
    });
    expect(result.parts).toEqual([true, false, false]);
  });

  it("uses the transcript when speech recognition is available, else the self-rating", () => {
    const speak = make({ id: "s1", type: "speak", mode: "repeat", text: "J'ai besoin d'aide." });
    expect(gradeActivity(speak, { kind: "speech", transcript: "j'ai besoin d'aide" }).correct).toBe(
      true,
    );
    expect(gradeActivity(speak, { kind: "speech", selfRating: 0.5 })).toMatchObject({
      selfRated: true,
      score: 0.5,
    });
    expect(() => gradeActivity(speak, { kind: "speech" })).toThrow(GradingError);
  });

  it("rejects responses of the wrong shape", () => {
    const activity = make({ id: "x", type: "type", prompt: { pt: "oi" }, accept: ["salut"] });
    expect(() => gradeActivity(activity, { kind: "choice", choice: 0 })).toThrow(GradingError);
  });
});
