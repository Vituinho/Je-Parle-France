import { describe, expect, it } from "vitest";
import { detectErrors } from "../errors/patterns";
import {
  buildTutorSystemPrompt,
  clampScores,
  markSpoken,
  mergeCorrections,
  SPOKEN_MARKER,
  stripSpokenMarker,
  visibleCorrections,
  type TutorContext,
  type TutorCorrection,
} from "./tutor";

const important: TutorCorrection = {
  wrong: "Je besoin",
  right: "J'ai besoin",
  explanationPt: "avoir besoin de",
  severity: "important",
};
const minor: TutorCorrection = {
  wrong: "cafe",
  right: "café",
  explanationPt: "acento",
  severity: "minor",
};

const context: TutorContext = {
  level: "A1",
  theta: 1.4,
  destination: "canada_quebec",
  correctionMode: "important_only",
  knownVocabulary: ["bonjour", "merci"],
  weakItems: ["avoir besoin de"],
  recentMistakes: [],
};

describe("tutor corrections", () => {
  it("shows corrections according to the learner's preference", () => {
    expect(visibleCorrections([important, minor], "immediate")).toHaveLength(2);
    expect(visibleCorrections([important, minor], "important_only")).toEqual([important]);
    expect(visibleCorrections([important, minor], "no_interruptions")).toEqual([]);
    expect(visibleCorrections([important, minor], "report_only")).toEqual([]);
  });

  it("adds deterministic detections the model missed, without duplicates", () => {
    const detected = detectErrors("Je besoin d'aide, je suis 20 ans");
    const merged = mergeCorrections([important], detected);
    expect(merged.filter((c) => c.right.toLowerCase().includes("besoin"))).toHaveLength(1);
    expect(merged.some((c) => c.right === "j'ai 20 ans")).toBe(true);
  });

  it("clamps report scores to 0-100 and trims lists", () => {
    const report = clampScores({
      scores: { fluency: 140, vocabulary: -3, grammar: 71.6, comprehension: Number.NaN },
      summaryPt: "ok",
      strengths: ["a", "b", "c", "d"],
      corrections: [],
      nextSteps: [],
    });
    expect(report.scores).toEqual({ fluency: 100, vocabulary: 0, grammar: 72, comprehension: 0 });
    expect(report.strengths).toHaveLength(3);
  });
});

describe("tutor system prompt", () => {
  it("adapts to level, destination and correction preference", () => {
    const prompt = buildTutorSystemPrompt(context);
    expect(prompt).toContain("Learner level: A1");
    expect(prompt).toContain("Québec");
    expect(prompt).toContain("recast");
    expect(prompt).toContain("avoir besoin de");
    const quiet = buildTutorSystemPrompt({
      ...context,
      correctionMode: "report_only",
      destination: "france",
    });
    expect(quiet).toContain("Do not correct or recast");
    expect(quiet).toContain("France");
  });

  it("tells the model to ignore spelling and punctuation in spoken turns", () => {
    expect(buildTutorSystemPrompt(context)).toContain(`${SPOKEN_MARKER} was spoken`);
  });

  it("is stable for the same context (cache-friendly)", () => {
    expect(buildTutorSystemPrompt(context)).toBe(buildTutorSystemPrompt(context));
  });
});

describe("spoken turns", () => {
  it("marks and unmarks transcribed messages", () => {
    const marked = markSpoken("je besoin d'un compte");
    expect(marked.startsWith(SPOKEN_MARKER)).toBe(true);
    expect(stripSpokenMarker(marked)).toBe("je besoin d'un compte");
    expect(stripSpokenMarker("Bonjour !")).toBe("Bonjour !");
  });
});
