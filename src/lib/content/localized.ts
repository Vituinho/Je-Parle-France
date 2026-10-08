import type { Localized } from "./schema";

/** Lowercase without accents, for search and comparisons ("Élève" → "eleve"). */
export const foldText = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

const squash = (text: string) => foldText(text).replace(/[^\p{L}\p{N}]/gu, "");

/**
 * The French version of a title when it says something the Portuguese one does
 * not ("Tu ou vous ?" adds nothing above "Tu ou vous?").
 */
export function distinctFrench(value: Localized): string | undefined {
  if (!value.fr) return undefined;
  return squash(value.fr) === squash(value.pt) ? undefined : value.fr;
}
