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
    expect(result).toMatchObject({ verdict: "almost", correct: false, score: 0.8 });
    expect(result.note?.pt).toContain("acentos");
  });

  it("accepts an explicitly authored informal wording as a successful alternative", () => {
    const activity = make({
      id: "t-register-alternative",
      type: "type",
      prompt: { pt: "Como dizer “com licença” numa situação informal?" },
      accept: ["Excusez-moi."],
      alternatives: [
        {
          text: "Excuse-moi.",
          explanation: {
            pt: "“Excuse-moi” é informal singular; “Excusez-moi” é formal ou plural.",
          },
        },
      ],
    });
    expect(gradeActivity(activity, { kind: "text", text: "Excuse moi" })).toMatchObject({
      verdict: "alternative",
      correct: true,
      score: 1,
      expected: "Excusez-moi.",
      note: { pt: expect.stringContaining("informal singular") },
    });
  });

  it("does not infer a register alternative when a task expects the formal form", () => {
    const activity = make({
      id: "t-register-strict",
      type: "type",
      prompt: { pt: "Escreva a forma formal singular." },
      accept: ["Excusez-moi."],
    });
    expect(gradeActivity(activity, { kind: "text", text: "Excuse moi" })).toMatchObject({
      verdict: "wrong",
      correct: false,
      score: 0,
    });
  });

  it("requires the exact conjugated form in an exercise that tests person and number", () => {
    const activity = make({
      id: "t-conjugation-strict",
      type: "type",
      prompt: { pt: "Conjugue parler na 3ª pessoa do plural." },
      accept: ["Ils parlent."],
    });
    expect(gradeActivity(activity, { kind: "text", text: "Ils parle." })).toMatchObject({
      verdict: "wrong",
      correct: false,
      score: 0,
    });
  });

  it("marks a different meaning as incorrect even when only one accent differs", () => {
    const activity = make({
      id: "t-accent-meaning",
      type: "type",
      prompt: { pt: "Responda com a conjunção “ou”." },
      accept: ["ou"],
    });
    expect(gradeActivity(activity, { kind: "text", text: "où" })).toMatchObject({
      verdict: "wrong",
      correct: false,
      score: 0,
    });
  });

  it("does not give typo credit to a similar word with a different meaning", () => {
    const activity = make({
      id: "t-similar-word-different-meaning",
      type: "type",
      prompt: { pt: "O que há no Saara?" },
      accept: ["un désert"],
    });
    expect(gradeActivity(activity, { kind: "text", text: "un dessert" })).toMatchObject({
      verdict: "wrong",
      correct: false,
      score: 0,
    });
  });

  it("supports explicitly authored equivalents in blanks while keeping the default strict", () => {
    const equivalent = make({
      id: "f-alternative",
      type: "fill",
      sentence: "___, madame.",
      blanks: [
        {
          accept: ["Excusez-moi"],
          alternatives: [
            {
              text: "Excuse-moi",
              explanation: { pt: "Informal singular; formal or plural." },
            },
          ],
        },
      ],
    });
    expect(gradeActivity(equivalent, { kind: "blanks", blanks: ["excuse moi"] })).toMatchObject({
      verdict: "alternative",
      correct: true,
      parts: [true],
    });

    const strict = make({
      id: "f-formal",
      type: "fill",
      sentence: "Madame, vous ___ ici.",
      blanks: [{ accept: ["habitez"] }],
    });
    expect(gradeActivity(strict, { kind: "blanks", blanks: ["habite"] })).toMatchObject({
      verdict: "wrong",
      correct: false,
      parts: [false],
    });
  });

  it("normalizes harmless case, spacing, punctuation and hyphen changes", () => {
    const activity = make({
      id: "t-formatting",
      type: "type",
      prompt: { pt: "Escreva a expressão." },
      accept: ["Excusez-moi."],
    });
    expect(gradeActivity(activity, { kind: "text", text: "  excusez moi!!! " })).toMatchObject({
      verdict: "correct",
      correct: true,
      score: 1,
    });
  });

  it("gives partial credit and lets the existing lesson retry correctable accents and typos", () => {
    const activity = make({
      id: "t-retry",
      type: "type",
      prompt: { pt: "Escreva a frase." },
      accept: ["Je voudrais un appartement."],
    });
    for (const text of ["Je voudrais un appartement.", "Je voudrais un appartment."]) {
      const result = gradeActivity(activity, { kind: "text", text });
      if (text.includes("appartment"))
        expect(result).toMatchObject({ verdict: "almost", correct: false, score: 0.9 });
      else expect(result).toMatchObject({ verdict: "correct", correct: true, score: 1 });
    }
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
