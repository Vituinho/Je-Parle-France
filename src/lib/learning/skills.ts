/**
 * Skills are what the learner is assessed on (placement, dashboard).
 * Dimensions are how a single concept is known (memory traces).
 */
export const SKILLS = [
  "reading",
  "listening",
  "speaking",
  "writing",
  "vocabulary",
  "grammar",
  "pronunciation",
] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_LABELS: Record<Skill, { pt: string; fr: string }> = {
  reading: { pt: "Leitura", fr: "Compréhension écrite" },
  listening: { pt: "Compreensão oral", fr: "Compréhension orale" },
  speaking: { pt: "Fala", fr: "Expression orale" },
  writing: { pt: "Escrita", fr: "Expression écrite" },
  vocabulary: { pt: "Vocabulário", fr: "Vocabulaire" },
  grammar: { pt: "Gramática", fr: "Grammaire" },
  pronunciation: { pt: "Pronúncia", fr: "Prononciation" },
};

/**
 * - recognition: understands the written form (FR → meaning)
 * - recall: retrieves the form from meaning (meaning → FR, typed)
 * - listening: understands it when heard
 * - writing: uses it correctly in written production
 * - speaking: produces it orally
 * - pronunciation: articulates the target sounds
 */
export const DIMENSIONS = [
  "recognition",
  "recall",
  "listening",
  "writing",
  "speaking",
  "pronunciation",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<Dimension, string> = {
  recognition: "Reconhecimento",
  recall: "Lembrar a forma",
  listening: "Ao ouvir",
  writing: "Na escrita",
  speaking: "Na fala",
  pronunciation: "Pronúncia",
};

export const CONCEPT_KINDS = ["lexical", "grammar", "pronunciation", "culture"] as const;
export type ConceptKind = (typeof CONCEPT_KINDS)[number];

/** Dimensions tracked by default for each concept kind. */
export const DEFAULT_DIMENSIONS: Record<ConceptKind, readonly Dimension[]> = {
  lexical: ["recognition", "recall", "listening", "speaking"],
  grammar: ["recognition", "writing", "speaking"],
  pronunciation: ["listening", "pronunciation"],
  culture: ["recognition"],
};

/**
 * Which skill a piece of evidence on a dimension informs. Lexical and grammar
 * concepts additionally inform the vocabulary / grammar skills.
 */
export const DIMENSION_SKILL: Record<Dimension, Skill> = {
  recognition: "reading",
  recall: "writing",
  listening: "listening",
  writing: "writing",
  speaking: "speaking",
  pronunciation: "pronunciation",
};

export function skillsForEvidence(kind: ConceptKind, dimension: Dimension): Skill[] {
  const skills = new Set<Skill>([DIMENSION_SKILL[dimension]]);
  if (kind === "lexical") skills.add("vocabulary");
  if (kind === "grammar") skills.add("grammar");
  if (kind === "pronunciation") skills.add("pronunciation");
  return [...skills];
}
