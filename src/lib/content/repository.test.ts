import { describe, expect, it } from "vitest";
import { buildContentIndex, prerequisiteClosure } from "./repository";
import type { CourseInput } from "./schema";

function fixture(overrides: Partial<CourseInput> = {}): CourseInput {
  return {
    concepts: [
      {
        id: "lex:bonjour",
        kind: "lexical",
        level: "A0",
        french: "bonjour",
        pos: "interjection",
        meaning: "bom dia / olá",
      },
      {
        id: "gram:etre-present",
        kind: "grammar",
        level: "A0",
        prerequisites: ["gram:subject-pronouns"],
        title: { pt: "Être no presente" },
        summary: { pt: "je suis, tu es…" },
        explanation: { pt: ["Explicação"] },
        examples: [{ fr: "Je suis brésilien.", pt: "Sou brasileiro." }],
      },
      {
        id: "gram:subject-pronouns",
        kind: "grammar",
        level: "A0",
        title: { pt: "Pronomes sujeito" },
        summary: { pt: "je, tu, il…" },
        explanation: { pt: ["Explicação"] },
        examples: [{ fr: "Je parle.", pt: "Eu falo." }],
      },
    ],
    modules: [
      {
        id: "a0-m1",
        level: "A0",
        title: { pt: "Primeiros passos" },
        description: { pt: "…" },
        units: [
          {
            id: "a0-u1",
            level: "A0",
            title: { pt: "Cumprimentos" },
            canDo: { pt: "Cumprimentar alguém." },
            lessons: [
              {
                id: "a0-u1-l1",
                title: { pt: "Bonjour" },
                objective: { pt: "Dizer olá" },
                minutes: 5,
                steps: [
                  {
                    id: "a0-u1-l1-t1",
                    type: "teach",
                    title: { pt: "Bonjour" },
                    body: { pt: "…" },
                    introduces: ["lex:bonjour"],
                  },
                  {
                    id: "a0-u1-l1-a1",
                    type: "choice",
                    prompt: { fr: "Bonjour" },
                    options: ["olá", "tchau"],
                    optionsLang: "pt",
                    answer: 0,
                    targets: [{ concept: "lex:bonjour", dimension: "recognition" }],
                  },
                  {
                    id: "a0-u1-l1-a2",
                    type: "fill",
                    sentence: "Je ___ brésilien.",
                    blanks: [{ accept: ["suis"] }],
                    targets: [{ concept: "gram:etre-present", dimension: "writing" }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    placementItems: [],
    scenarios: [],
    authentic: [],
    ...overrides,
  };
}

describe("buildContentIndex", () => {
  it("indexes a valid course", () => {
    const { index, issues } = buildContentIndex(fixture());
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
    expect(index?.lessons.get("a0-u1-l1")?.order).toBe(0);
    expect(index?.activities.get("a0-u1-l1-a2")?.stepIndex).toBe(2);
    expect(index?.conceptLessons.get("lex:bonjour")).toEqual(["a0-u1-l1"]);
    expect(index?.paths.core).toHaveLength(1);
  });

  it("warns about concepts that no lesson teaches", () => {
    const { issues } = buildContentIndex(fixture());
    expect(issues).toContainEqual(
      expect.objectContaining({ severity: "warning", path: "concepts.gram:subject-pronouns" }),
    );
  });

  it("rejects unknown concept targets", () => {
    const course = fixture();
    const step = course.modules[0]!.units[0]!.lessons[0]!.steps[1]!;
    if (step.type !== "choice") throw new Error("fixture changed");
    step.targets = [{ concept: "lex:inexistant", dimension: "recognition" }];
    const { index, issues } = buildContentIndex(course);
    expect(index).toBeUndefined();
    expect(issues.some((i) => i.message.includes("unknown concept lex:inexistant"))).toBe(true);
  });

  it("detects prerequisite cycles", () => {
    const course = fixture();
    const pronouns = course.concepts[2]!;
    pronouns.prerequisites = ["gram:etre-present"];
    const { issues } = buildContentIndex(course);
    expect(issues.some((i) => i.message.startsWith("prerequisite cycle"))).toBe(true);
  });

  it("rejects invalid schemas with a readable path", () => {
    const course = fixture();
    const step = course.modules[0]!.units[0]!.lessons[0]!.steps[2]!;
    if (step.type !== "fill") throw new Error("fixture changed");
    step.sentence = "Je suis brésilien.";
    const { index, issues } = buildContentIndex(course);
    expect(index).toBeUndefined();
    expect(issues[0]?.message).toContain("number of ___");
  });

  it("flags graded activities without targets", () => {
    const course = fixture();
    const step = course.modules[0]!.units[0]!.lessons[0]!.steps[1]!;
    if (step.type !== "choice") throw new Error("fixture changed");
    step.targets = [];
    const { issues } = buildContentIndex(course);
    expect(issues.some((i) => i.message === "graded activity needs at least one target")).toBe(true);
  });

  it("computes transitive prerequisites", () => {
    const { index } = buildContentIndex(fixture());
    expect(prerequisiteClosure(index!, "gram:etre-present")).toEqual(["gram:subject-pronouns"]);
  });
});
