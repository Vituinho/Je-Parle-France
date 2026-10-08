/**
 * Deterministic detectors for frequent Brazilian-Portuguese → French errors.
 * They are cheap, explainable and never hallucinate, so they run on every
 * learner message before (and in addition to) any AI feedback.
 */
export interface DetectedError {
  id: string;
  /** The learner's fragment. */
  wrong: string;
  /** The corrected fragment. */
  right: string;
  /** Short explanation in Portuguese, contrasting with Portuguese where useful. */
  explanation: string;
  /** important = changes meaning or is a core structure; minor = form/spelling. */
  severity: "important" | "minor";
  /**
   * Course concepts this error is evidence against. Used to feed the memory
   * model: a learner who writes "je suis 25 ans" has not mastered gram:age-avoir.
   */
  concepts: string[];
}

interface Pattern {
  id: string;
  regex: RegExp;
  fix: (match: RegExpExecArray) => string;
  explanation: string;
  severity: DetectedError["severity"];
  concepts?: (match: RegExpExecArray) => string[];
}

const VOWEL_START = "(?=[aeiouyàâäéèêëîïôöûùüœh])";

const STATES: Record<string, string> = {
  faim: "fome",
  soif: "sede",
  peur: "medo",
  froid: "frio",
  chaud: "calor",
  sommeil: "sono",
  raison: "razão",
  tort: "não ter razão",
};

/** States with a course concept of their own (others are covered only by the correction). */
const STATE_CONCEPTS: Record<string, string> = {
  faim: "lex:avoir-faim",
  soif: "lex:avoir-soif",
  froid: "lex:avoir-froid",
};

const PATTERNS: Pattern[] = [
  {
    id: "age-with-etre",
    regex: /\bje suis (\d{1,3}|[a-zéè-]+) ans\b/i,
    fix: (m) => `j'ai ${m[1]} ans`,
    explanation:
      "A idade usa *avoir*: *j'ai 25 ans* (“tenho 25 anos”). *Je suis 25 ans* não existe em francês.",
    severity: "important",
    concepts: () => ["gram:age-avoir"],
  },
  {
    id: "besoin-without-avoir",
    regex: /\b(je|tu|il|elle|on|nous|vous|ils|elles) besoin\b/i,
    fix: (m) =>
      ({
        je: "j'ai besoin",
        tu: "tu as besoin",
        il: "il a besoin",
        elle: "elle a besoin",
        on: "on a besoin",
        nous: "nous avons besoin",
        vous: "vous avez besoin",
        ils: "ils ont besoin",
        elles: "elles ont besoin",
      })[(m[1] ?? "je").toLowerCase()] ?? "j'ai besoin",
    explanation:
      "Em português dizemos “eu preciso”. Em francês a estrutura é *avoir besoin de*: *j'ai besoin d'aide*.",
    severity: "important",
    concepts: () => ["lex:avoir-besoin-de"],
  },
  {
    id: "state-with-etre",
    regex: new RegExp(`\\bje suis (${Object.keys(STATES).join("|")})\\b`, "i"),
    fix: (m) => `j'ai ${m[1]?.toLowerCase()}`,
    explanation:
      "Como em português (“tenho fome”), o francês usa *avoir*: *j'ai faim, j'ai froid, j'ai peur*.",
    severity: "important",
    concepts: (m) => {
      const concept = STATE_CONCEPTS[(m[1] ?? "").toLowerCase()];
      return concept ? [concept] : [];
    },
  },
  {
    id: "missing-elision",
    regex: new RegExp(`\\b(je|me|te|se|le|la|de|ne|que) ${VOWEL_START}(\\p{L}+)`, "iu"),
    fix: (m) => `${(m[1] ?? "").slice(0, -1)}'${m[2]}`,
    explanation:
      "Antes de vogal (ou h mudo), *je, me, te, se, le, la, de, ne, que* perdem a vogal: *j'ai, l'ami, d'accord*.",
    severity: "minor",
  },
  {
    id: "a-le-contraction",
    regex: /(?<!\p{L})à (le|les) /iu,
    fix: (m) => (m[1]?.toLowerCase() === "le" ? "au " : "aux "),
    explanation: "*À + le* vira *au* e *à + les* vira *aux*, assim como em português “a + o = ao”.",
    severity: "minor",
    concepts: () => ["gram:contractions-a-de"],
  },
  {
    id: "de-le-contraction",
    regex: /\bde (le|les) /i,
    fix: (m) => (m[1]?.toLowerCase() === "le" ? "du " : "des "),
    explanation: "*De + le* vira *du* e *de + les* vira *des*, como “de + o = do” em português.",
    severity: "minor",
    concepts: () => ["gram:contractions-a-de"],
  },
  {
    id: "age-question",
    regex: /\btu es quel âge\b/i,
    fix: () => "tu as quel âge",
    concepts: () => ["gram:age-avoir"],
    explanation: "Para perguntar a idade também se usa *avoir*: *tu as quel âge ?*",
    severity: "important",
  },
];

/** Excludes false positives for elision (proper names, h aspiré words, "le" before a vowel-sounding acronym). */
const ELISION_EXCEPTIONS =
  /\b(le|la|de) (haut|hors|héros|hibou|huit|onze|oui|hasard|hall|handicap|hamac)\b/i;

export function detectErrors(text: string): DetectedError[] {
  const found: DetectedError[] = [];
  for (const pattern of PATTERNS) {
    const match = pattern.regex.exec(text);
    if (!match) continue;
    if (pattern.id === "missing-elision" && ELISION_EXCEPTIONS.test(match[0])) continue;
    found.push({
      id: pattern.id,
      wrong: match[0].trim(),
      right: pattern.fix(match).trim(),
      explanation: pattern.explanation,
      severity: pattern.severity,
      concepts: pattern.concepts?.(match) ?? [],
    });
  }
  return found;
}

/** Applies all detected corrections to a sentence (first occurrence each). */
export function correctText(text: string): string {
  let result = text;
  for (const error of detectErrors(text)) {
    const index = result.toLowerCase().indexOf(error.wrong.toLowerCase());
    if (index === -1) continue;
    const replacement =
      result[index] === result[index]?.toUpperCase() && /\p{L}/u.test(result[index] ?? "")
        ? error.right.charAt(0).toUpperCase() + error.right.slice(1)
        : error.right;
    result = result.slice(0, index) + replacement + result.slice(index + error.wrong.length);
  }
  return result;
}
