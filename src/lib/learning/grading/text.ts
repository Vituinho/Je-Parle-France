/**
 * French-aware text comparison for typed answers.
 *
 * Verdicts, from best to worst:
 * - exact:        identical after normalisation (case, spacing, apostrophe and
 *                 quote styles, typographic spaces, final punctuation)
 * - punctuation:  only apostrophes/hyphens differ ("cest" for "c'est")
 * - accent:       only diacritics differ ("deja" for "déjà") — a real error in
 *                 written French, so it is flagged, but the learner clearly
 *                 knows the word
 * - typo:         one slip in a long word, not in its ending (endings carry
 *                 gender, number and conjugation, so they are never "typos")
 * - wrong
 */
export type TextVerdict = "exact" | "punctuation" | "accent" | "typo" | "wrong";

export type TokenStatus = "ok" | "accent" | "typo" | "wrong" | "extra" | "missing";

export interface DiffToken {
  text: string;
  status: TokenStatus;
  /** The expected token, for accent/typo/wrong/missing. */
  expected?: string;
}

export interface TextComparison {
  verdict: TextVerdict;
  score: number;
  /** The accepted answer the response was compared against. */
  matched: string;
  /** Learner's tokens annotated against the matched answer (for red-pen feedback). */
  diff: DiffToken[];
}

export const VERDICT_SCORE: Record<TextVerdict, number> = {
  exact: 1,
  punctuation: 0.95,
  typo: 0.9,
  accent: 0.8,
  wrong: 0,
};

const APOSTROPHES = /[’‘ʼ`´]/g;
const QUOTES = /[«»“”„"]/g;
const SPACES = /[\s   ]+/g;
const HYPHENS = /[‐‑‒–—−]/g;
const MEANINGFUL_ACCENT_PAIRS = new Set([
  "a|à",
  "de|dès",
  "du|dû",
  "jeune|jeûne",
  "la|là",
  "mur|mûr",
  "ou|où",
  "peche|pêche",
  "sur|sûr",
]);
const MEANINGFUL_SPELLING_PAIRS = new Set(["dessert|désert", "peut être|peut-être"]);

function normalizeKeepingHyphens(text: string): string {
  return text
    .normalize("NFC")
    .replace(APOSTROPHES, "'")
    .replace(QUOTES, " ")
    .replace(HYPHENS, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/[,.!?;:…¿¡]/gu, " ")
    .replace(SPACES, " ")
    .toLowerCase()
    .trim();
}

/** Known French spelling pairs where dropping a hyphen or changing a word alters meaning. */
export function hasMeaningfulSpellingDifference(given: string, expected: string): boolean {
  const pair = [normalizeKeepingHyphens(given), normalizeKeepingHyphens(expected)].sort().join("|");
  return MEANINGFUL_SPELLING_PAIRS.has(pair);
}

/** Canonical form: lowercase, NFC, unified apostrophes, no quotes, single spaces, no final punctuation. */
export function normalize(text: string): string {
  return (
    text
      .normalize("NFC")
      .replace(APOSTROPHES, "'")
      .replace(QUOTES, " ")
      // Hyphenated and open spellings are both common in learner input;
      // retain word boundaries so this never merges distinct words.
      .replace(HYPHENS, "-")
      .replace(/\s*-\s*/g, " ")
      .replace(/œ/g, "oe")
      .replace(/Œ/g, "OE")
      .replace(/æ/g, "ae")
      .toLowerCase()
      .replace(/[,.!?;:…¿¡]/gu, " ")
      .replace(/\s*([?!:;])/g, " $1") // French typographic spaces are optional for learners
      .replace(SPACES, " ")
      .replace(/\s*'\s*/g, "'")
      .replace(/[\s.!?…:;,]+$/u, "")
      .replace(/^[\s¿¡]+/u, "")
      .replace(/\s+([,])/g, "$1")
      .trim()
  );
}

export function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function stripPunctuation(text: string): string {
  return text.replace(/['\-\s,?!:;.]/g, "");
}

/** Splits into words, keeping elided articles/pronouns as their own token ("l'", "j'"). */
export function tokenize(text: string): string[] {
  const normalized = normalize(text);
  if (!normalized) return [];
  return normalized
    .replace(/'/g, "' ")
    .split(/[\s]+/)
    .map((token) => token.replace(/^[,?!:;]+|[,?!:;]+$/g, ""))
    .filter(Boolean);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0] as number;
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = previous[j] as number;
      previous[j] = Math.min(
        (previous[j] as number) + 1,
        (previous[j - 1] as number) + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = temp;
    }
  }
  return previous[b.length] as number;
}

/** Index of the first differing character, or -1. */
function firstDifference(a: string, b: string): number {
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) if (a[i] !== b[i]) return i;
  return -1;
}

function compareToken(given: string, expected: string): TokenStatus {
  if (given === expected) return "ok";
  if (MEANINGFUL_SPELLING_PAIRS.has([given, expected].sort().join("|"))) return "wrong";
  if (stripAccents(given) === stripAccents(expected)) {
    const pair = [given, expected].sort().join("|");
    return MEANINGFUL_ACCENT_PAIRS.has(pair) ? "wrong" : "accent";
  }
  const a = stripAccents(given);
  const b = stripAccents(expected);
  const longEnough = Math.min(a.length, b.length) >= 6;
  // A slip anywhere except the last two letters (where grammar lives).
  if (longEnough && levenshtein(a, b) === 1 && firstDifference(a, b) < b.length - 2) {
    return "typo";
  }
  return "wrong";
}

/** Word-level alignment (LCS on accent-insensitive tokens) to annotate the learner's answer. */
export function diffTokens(given: string[], expected: string[]): DiffToken[] {
  const a = given.map(stripAccents);
  const b = expected.map(stripAccents);
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i]![j] =
        a[i] === b[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
    }
  }
  const result: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      const status = compareToken(given[i] as string, expected[j] as string);
      result.push({
        text: given[i] as string,
        status,
        expected: status === "ok" ? undefined : expected[j],
      });
      i += 1;
      j += 1;
    } else if (i < a.length && j < b.length && table[i + 1]![j + 1] === table[i]![j]) {
      // Substitution: same position, different word.
      const status = compareToken(given[i] as string, expected[j] as string);
      result.push({ text: given[i] as string, status, expected: expected[j] });
      i += 1;
      j += 1;
    } else if (j < b.length && (i >= a.length || table[i]![j + 1]! >= table[i + 1]![j]!)) {
      result.push({ text: expected[j] as string, status: "missing", expected: expected[j] });
      j += 1;
    } else {
      result.push({ text: given[i] as string, status: "extra" });
      i += 1;
    }
  }
  return result;
}

const SEVERITY: Record<TokenStatus, number> = {
  ok: 0,
  accent: 1,
  typo: 2,
  wrong: 3,
  extra: 3,
  missing: 3,
};

function compareOne(response: string, accepted: string): TextComparison {
  const given = normalize(response);
  const expected = normalize(accepted);
  const diff = diffTokens(tokenize(response), tokenize(accepted));
  if (hasMeaningfulSpellingDifference(response, accepted)) {
    return { verdict: "wrong", score: 0, matched: accepted, diff };
  }
  if (given === expected) return { verdict: "exact", score: 1, matched: accepted, diff };
  if (stripPunctuation(given) === stripPunctuation(expected)) {
    return { verdict: "punctuation", score: VERDICT_SCORE.punctuation, matched: accepted, diff };
  }
  if (
    stripPunctuation(stripAccents(given)) === stripPunctuation(stripAccents(expected)) &&
    diff.every((token) => token.status === "ok" || token.status === "accent")
  ) {
    return { verdict: "accent", score: VERDICT_SCORE.accent, matched: accepted, diff };
  }
  const worst = diff.reduce((max, token) => Math.max(max, SEVERITY[token.status]), 0);
  const typos = diff.filter((token) => token.status === "typo").length;
  if (worst <= SEVERITY.typo && typos === 1) {
    return { verdict: "typo", score: VERDICT_SCORE.typo, matched: accepted, diff };
  }
  return { verdict: "wrong", score: 0, matched: accepted, diff };
}

const RANK: Record<TextVerdict, number> = {
  exact: 0,
  punctuation: 1,
  typo: 2,
  accent: 3,
  wrong: 4,
};

/** Compares a response with every accepted answer and keeps the best match. */
export function compareText(response: string, accepted: readonly string[]): TextComparison {
  if (accepted.length === 0) throw new Error("compareText needs at least one accepted answer");
  let best: TextComparison | undefined;
  let bestOverlap = -1;
  for (const answer of accepted) {
    const comparison = compareOne(response, answer);
    const overlap = comparison.diff.filter((token) => token.status === "ok").length;
    if (
      !best ||
      RANK[comparison.verdict] < RANK[best.verdict] ||
      (comparison.verdict === best.verdict && overlap > bestOverlap)
    ) {
      best = comparison;
      bestOverlap = overlap;
    }
  }
  return best as TextComparison;
}

/** Share of expected words present in the response (accent-insensitive), for dictation/speech. */
export function wordRecall(response: string, expected: string): number {
  const expectedTokens = tokenize(expected);
  if (expectedTokens.length === 0) return 0;
  const diff = diffTokens(tokenize(response), expectedTokens);
  const matched = diff.filter((token) => token.status === "ok" || token.status === "accent").length;
  return matched / expectedTokens.length;
}
