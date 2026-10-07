import { buildContentIndex, type ContentIndex } from "@/lib/content/repository";
import type { CourseInput, LessonInput, UnitInput } from "@/lib/content/schema";
import type { CefrLevel } from "@/lib/learning/cefr";

/** A tiny but complete course used by engine tests (A0 + A1, two units each). */
export function fixtureCourse(): CourseInput {
  const lexical = (id: string, french: string, meaning: string, level: CefrLevel) => ({
    id: `lex:${id}`,
    kind: "lexical" as const,
    level,
    french,
    pos: "expression" as const,
    meaning,
  });
  const lesson = (id: string, concept: string): LessonInput => ({
    id,
    title: { pt: `Lição ${id}` },
    objective: { pt: "Objetivo" },
    minutes: 5,
    steps: [
      {
        id: `${id}-t`,
        type: "teach",
        title: { pt: "Ensino" },
        body: { pt: "…" },
        introduces: [concept],
      },
      {
        id: `${id}-a`,
        type: "choice",
        prompt: { fr: "Question ?" },
        options: ["a", "b", "c"],
        answer: 0,
        targets: [{ concept, dimension: "recognition" }],
      },
      {
        id: `${id}-b`,
        type: "type",
        prompt: { pt: "Escreva" },
        accept: ["a"],
        targets: [{ concept, dimension: "recall" }],
      },
    ],
  });
  const unit = (id: string, level: CefrLevel, concepts: string[]): UnitInput => ({
    id,
    level,
    title: { pt: `Unidade ${id}` },
    canDo: { pt: "Consegue fazer algo." },
    lessons: concepts.map((concept, i) => lesson(`${id}-l${i + 1}`, concept)),
  });
  return {
    concepts: [
      lexical("bonjour", "bonjour", "olá", "A0"),
      lexical("merci", "merci", "obrigado", "A0"),
      lexical("je-m-appelle", "je m'appelle", "eu me chamo", "A0"),
      lexical("je-voudrais", "je voudrais", "eu gostaria", "A0"),
      lexical("avoir-besoin-de", "avoir besoin de", "precisar de", "A1"),
      lexical("il-y-a", "il y a", "há / tem", "A1"),
      lexical("hier", "hier", "ontem", "A1"),
      lexical("demain", "demain", "amanhã", "A1"),
    ],
    modules: [
      {
        id: "a0-m1",
        level: "A0",
        title: { pt: "Primeiros passos" },
        description: { pt: "…" },
        units: [
          unit("a0-u1", "A0", ["lex:bonjour", "lex:merci"]),
          unit("a0-u2", "A0", ["lex:je-m-appelle", "lex:je-voudrais"]),
        ],
      },
      {
        id: "a1-m1",
        level: "A1",
        title: { pt: "Dia a dia" },
        description: { pt: "…" },
        units: [
          unit("a1-u1", "A1", ["lex:avoir-besoin-de", "lex:il-y-a"]),
          unit("a1-u2", "A1", ["lex:hier", "lex:demain"]),
        ],
      },
    ],
    placementItems: [],
    scenarios: [],
    authentic: [],
  };
}

export function fixtureIndex(course: CourseInput = fixtureCourse()): ContentIndex {
  const { index, issues } = buildContentIndex(course);
  if (!index) throw new Error(JSON.stringify(issues, null, 2));
  return index;
}
