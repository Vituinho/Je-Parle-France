import { levelIndex, type CefrLevel } from "./cefr";

/**
 * How much Portuguese the learner sees (docs/PEDAGOGY.md). Computed from the
 * learner's level and preference — never a hard rule by CEFR alone — and every
 * explanation keeps an "Explicar em português" escape hatch.
 *
 * - pt:     Portuguese only (French examples are still French)
 * - pt-fr:  Portuguese first, short French version
 * - fr-pt:  French first, Portuguese gloss
 * - fr:     French only (Portuguese on request)
 */
export type SupportMode = "pt" | "pt-fr" | "fr-pt" | "fr";
export type SupportPreference = "more_portuguese" | "auto" | "more_french";

const LADDER: SupportMode[] = ["pt", "pt-fr", "fr-pt", "fr"];

const BY_LEVEL: Record<CefrLevel, number> = { A0: 0, A1: 1, A2: 2, B1: 3, B2: 3, C1: 3 };

export function supportMode(level: CefrLevel, preference: SupportPreference = "auto"): SupportMode {
  const shift = preference === "more_portuguese" ? -1 : preference === "more_french" ? 1 : 0;
  const step = Math.min(LADDER.length - 1, Math.max(0, BY_LEVEL[level] + shift));
  return LADDER[step] as SupportMode;
}

/** Whether explanations (grammar notes, feedback) default to Portuguese. */
export function explainInPortuguese(
  level: CefrLevel,
  preference: SupportPreference = "auto",
): boolean {
  const shift = preference === "more_portuguese" ? 1 : preference === "more_french" ? -1 : 0;
  return levelIndex(level) - shift <= 2;
}
