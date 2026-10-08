import { conceptDimensions, type ContentIndex } from "@/lib/content/repository";
import type { Activity, Concept, LexicalConcept } from "@/lib/content/schema";
import { seededRandom, seededShuffle } from "../random";
import type { Dimension } from "../skills";

/**
 * Builds the exercise used to review one concept × dimension.
 *
 * - Words and chunks get generated exercises (meaning ↔ form, listening,
 *   saying it) so reviews are varied and focused on the single item.
 * - Grammar and culture reuse the authored lesson activities that target the
 *   concept, rotating between them.
 * - Pronunciation uses the concept's minimal pairs and example words.
 * - Personal items (tutor corrections) are passed in by the server.
 *
 * Deterministic for a given seed, so the server can rebuild the exact same
 * activity when the answer comes back.
 */

export interface PersonalItemData {
  id: string;
  french: string;
  wrong: string | null;
  portuguese: string | null;
  explanation: string | null;
}

const NUMBER_WORDS = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
  "vingt",
];

export const reviewActivityId = (conceptId: string, dimension: Dimension) =>
  `rv-${conceptId.replace(/[:]/g, "-")}-${dimension}`;

const pick = <T>(items: readonly T[], random: () => number): T =>
  items[Math.floor(random() * items.length)] as T;

/** Written forms accepted when the learner must produce the concept. */
export function recallForms(concept: LexicalConcept): string[] {
  if (concept.forms?.length) return concept.forms;
  return concept.french
    .split(" / ")
    .flatMap((form) =>
      form.includes("(e)") ? [form.replace("(e)", ""), form.replace("(e)", "e")] : [form],
    );
}

/** Québec concepts are voiced with a Canadian French voice. */
const voiceFor = (concept: Concept): "fr-FR" | "fr-CA" =>
  concept.region === "fr-CA" ? "fr-CA" : "fr-FR";

function numberRange(concept: LexicalConcept): [number, number] | null {
  const match = /nombres-(\d+)-(\d+)$/.exec(concept.id);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

function distractorMeanings(
  index: ContentIndex,
  concept: LexicalConcept,
  random: () => number,
): string[] {
  const others = [...index.concepts.values()].filter(
    (other): other is LexicalConcept =>
      other.kind === "lexical" &&
      other.id !== concept.id &&
      other.meaning !== concept.meaning &&
      other.french !== concept.french &&
      other.pos !== "number",
  );
  const sameTag = others.filter((other) => other.tags.some((tag) => concept.tags.includes(tag)));
  const pool = [...seededShuffle(sameTag, random()), ...seededShuffle(others, random())];
  const meanings: string[] = [];
  for (const other of pool) {
    if (!meanings.includes(other.meaning)) meanings.push(other.meaning);
    if (meanings.length === 3) break;
  }
  return meanings;
}

function lexicalActivity(
  index: ContentIndex,
  concept: LexicalConcept,
  dimension: Dimension,
  random: () => number,
): Activity | null {
  const id = reviewActivityId(concept.id, dimension);
  const targets = [{ concept: concept.id, dimension, weight: 1 }];
  const range = numberRange(concept);

  if (range) {
    const [low, high] = range;
    const numbers = Array.from({ length: high - low + 1 }, (_, i) => low + i);
    const value = pick(numbers, random);
    const word = NUMBER_WORDS[value] as string;
    const others = seededShuffle(
      numbers.filter((n) => n !== value),
      random(),
    ).slice(0, 3);
    switch (dimension) {
      case "recognition":
        return {
          id,
          type: "choice",
          targets,
          instruction: { pt: "Qual é o número?", fr: "Quel est ce nombre ?" },
          prompt: { fr: word, hideText: false },
          options: [String(value), ...others.map(String)],
          optionsLang: "pt",
          answer: 0,
        };
      case "listening":
        return {
          id,
          type: "choice",
          targets,
          instruction: {
            pt: "Ouça. Qual número você ouviu?",
            fr: "Quel nombre avez-vous entendu ?",
          },
          prompt: {
            audio: { text: word, region: voiceFor(concept), gender: "f", rate: "normal" },
            hideText: true,
          },
          options: [String(value), ...others.map(String)],
          optionsLang: "pt",
          answer: 0,
        };
      case "recall":
      case "writing":
        return {
          id,
          type: "type",
          targets,
          instruction: { pt: "Escreva o número por extenso.", fr: "Écrivez le nombre en lettres." },
          prompt: { pt: String(value), hideText: false },
          accept: [word],
        };
      default:
        return {
          id,
          type: "speak",
          targets,
          mode: "repeat",
          instruction: {
            pt: "Ouça, grave e compare.",
            fr: "Écoutez, enregistrez-vous et comparez.",
          },
          text: numbers
            .slice(0, 5)
            .map((n) => NUMBER_WORDS[n])
            .join(", "),
          accept: [],
          region: voiceFor(concept),
        };
    }
  }

  const example = concept.examples.length > 0 ? pick(concept.examples, random) : undefined;
  switch (dimension) {
    case "recognition":
      return {
        id,
        type: "choice",
        targets,
        instruction: { pt: "O que significa?", fr: "Qu'est-ce que ça veut dire ?" },
        prompt: {
          fr: concept.french,
          audio: { text: concept.french, region: voiceFor(concept), gender: "f", rate: "normal" },
          hideText: false,
        },
        options: [concept.meaning, ...distractorMeanings(index, concept, random)],
        optionsLang: "pt",
        answer: 0,
      };
    case "listening": {
      const spoken = example?.fr ?? concept.french;
      return {
        id,
        type: "choice",
        targets,
        instruction: {
          pt: "Ouça. O que a frase quer dizer?",
          fr: "Écoutez. Qu'est-ce que ça veut dire ?",
        },
        prompt: {
          audio: { text: spoken, region: voiceFor(concept), gender: "f", rate: "normal" },
          hideText: true,
        },
        options: example
          ? [example.pt, ...otherExamples(index, concept, random)]
          : [concept.meaning, ...distractorMeanings(index, concept, random)],
        optionsLang: "pt",
        answer: 0,
        explanation: { pt: `Você ouviu: *${spoken}*` },
      };
    }
    case "recall":
    case "writing":
      return {
        id,
        type: "type",
        targets,
        instruction: { pt: "Como se diz em francês?", fr: "Comment dit-on en français ?" },
        prompt: { pt: concept.meaning, hideText: false },
        accept: recallForms(concept),
      };
    case "speaking":
    case "pronunciation": {
      const text = example?.fr ?? recallForms(concept)[0] ?? concept.french;
      return {
        id,
        type: "speak",
        targets,
        mode: "repeat",
        instruction: { pt: "Ouça, grave e compare.", fr: "Écoutez, enregistrez-vous et comparez." },
        text,
        translation: example?.pt ?? concept.meaning,
        accept: [],
        region: voiceFor(concept),
      };
    }
  }
}

function otherExamples(
  index: ContentIndex,
  concept: LexicalConcept,
  random: () => number,
): string[] {
  const pool = [...index.concepts.values()]
    .filter((other): other is LexicalConcept => other.kind === "lexical" && other.id !== concept.id)
    .flatMap((other) => other.examples.map((example) => example.pt));
  const unique = [...new Set(pool)].filter(
    (pt) => !concept.examples.some((example) => example.pt === pt),
  );
  return seededShuffle(unique, random()).slice(0, 3);
}

/** Authored activities that evidence this concept × dimension, most focused first. */
export function authoredCandidates(
  index: ContentIndex,
  conceptId: string,
  dimension: Dimension,
): Activity[] {
  return [...index.activities.values()]
    .map((ref) => ref.activity)
    .filter(
      (activity) =>
        activity.type !== "teach" &&
        activity.targets.some(
          (target) => target.concept === conceptId && target.dimension === dimension,
        ),
    )
    .sort((a, b) => {
      const ta = a.type === "teach" ? 0 : a.targets.length;
      const tb = b.type === "teach" ? 0 : b.targets.length;
      return ta - tb || a.id.localeCompare(b.id);
    });
}

function pronunciationActivity(
  concept: Extract<Concept, { kind: "pronunciation" }>,
  dimension: Dimension,
  random: () => number,
): Activity {
  const id = reviewActivityId(concept.id, dimension);
  const targets = [{ concept: concept.id, dimension, weight: 1 }];
  if (dimension === "listening" && concept.minimalPairs.length > 0) {
    const pair = pick(concept.minimalPairs, random);
    return {
      id,
      type: "minimal_pair",
      targets,
      instruction: { pt: "Qual palavra você ouviu?", fr: "Quel mot avez-vous entendu ?" },
      pair,
      answer: random() < 0.5 ? 0 : 1,
      region: voiceFor(concept),
    };
  }
  if (dimension === "listening") {
    // No minimal pairs: recognise which example word was said.
    const options = seededShuffle(concept.examples, random()).slice(0, 4);
    const heard = options[0] as (typeof options)[number];
    return {
      id,
      type: "choice",
      targets,
      instruction: { pt: "Qual palavra você ouviu?", fr: "Quel mot avez-vous entendu ?" },
      prompt: {
        audio: { text: heard.word, region: voiceFor(concept), gender: "f", rate: "normal" },
        hideText: true,
      },
      options: options.map((word) => word.word),
      optionsLang: "fr",
      answer: 0,
    };
  }
  const words = seededShuffle(concept.examples, random()).slice(0, 3);
  return {
    id,
    type: "speak",
    targets: [{ concept: concept.id, dimension: "pronunciation", weight: 1 }],
    mode: "repeat",
    instruction: { pt: "Ouça, grave e compare.", fr: "Écoutez, enregistrez-vous et comparez." },
    text: words.map((word) => word.word).join(", "),
    translation: words.map((word) => word.pt ?? word.word).join(", "),
    accept: [],
    region: voiceFor(concept),
  };
}

function grammarFallback(
  concept: Extract<Concept, { kind: "grammar" }>,
  dimension: Dimension,
  random: () => number,
): Activity | null {
  const id = reviewActivityId(concept.id, dimension);
  const targets = [{ concept: concept.id, dimension, weight: 1 }];
  const mistake =
    concept.commonMistakes.length > 0 ? pick(concept.commonMistakes, random) : undefined;
  if (dimension === "recognition" && mistake) {
    return {
      id,
      type: "choice",
      targets,
      instruction: { pt: "Qual frase está correta?", fr: "Quelle phrase est correcte ?" },
      prompt: { pt: concept.title.pt, hideText: false },
      options: [mistake.right, mistake.wrong],
      optionsLang: "fr",
      answer: 0,
      explanation: { pt: mistake.why },
    };
  }
  if (dimension === "writing" && mistake) {
    return {
      id,
      type: "error_correction",
      targets,
      instruction: { pt: "Corrija a frase.", fr: "Corrigez la phrase." },
      sentence: mistake.wrong,
      accept: [mistake.right],
      explanation: { pt: mistake.why },
    };
  }
  const example = pick(concept.examples, random);
  return {
    id,
    type: "speak",
    targets,
    mode: "repeat",
    instruction: { pt: "Ouça, grave e compare.", fr: "Écoutez, enregistrez-vous et comparez." },
    text: example.fr,
    translation: example.pt,
    accept: [],
    region: voiceFor(concept),
  };
}

function personalActivity(
  item: PersonalItemData,
  dimension: Dimension,
  random: () => number,
): Activity {
  const conceptId = `personal:${item.id}`;
  const id = `rv-personal-${item.id.toLowerCase()}-${dimension}`;
  const targets = [{ concept: conceptId, dimension, weight: 1 }];
  const explanation = item.explanation ? { pt: item.explanation } : undefined;
  if (dimension === "recognition" && item.wrong) {
    const flip = random() < 0.5;
    return {
      id,
      type: "choice",
      targets,
      instruction: { pt: "Qual é a forma correta?", fr: "Quelle est la forme correcte ?" },
      prompt: { pt: item.portuguese ?? "Escolha a frase natural em francês.", hideText: false },
      options: flip ? [item.wrong, item.french] : [item.french, item.wrong],
      optionsLang: "fr",
      answer: flip ? 1 : 0,
      explanation,
    };
  }
  if ((dimension === "recall" || dimension === "writing") && item.wrong) {
    return {
      id,
      type: "error_correction",
      targets,
      instruction: { pt: "Você disse assim numa conversa. Corrija.", fr: "Corrigez la phrase." },
      sentence: item.wrong,
      accept: [item.french],
      explanation,
    };
  }
  return {
    id,
    type: "speak",
    targets,
    mode: "repeat",
    instruction: {
      pt: "Diga a forma correta em voz alta.",
      fr: "Dites la forme correcte à voix haute.",
    },
    text: item.french,
    translation: item.portuguese ?? undefined,
    accept: [],
    region: "fr-FR",
  };
}

export function buildReviewActivity(params: {
  index: ContentIndex;
  conceptId: string;
  dimension: Dimension;
  seed: string;
  personal?: PersonalItemData;
}): Activity | null {
  const { index, conceptId, dimension, seed } = params;
  const random = seededRandom(`${seed}:${conceptId}:${dimension}`);
  if (conceptId.startsWith("personal:")) {
    return params.personal ? personalActivity(params.personal, dimension, random) : null;
  }
  const concept = index.concepts.get(conceptId);
  if (!concept || !conceptDimensions(concept).includes(dimension)) return null;
  switch (concept.kind) {
    case "lexical":
      return lexicalActivity(index, concept, dimension, random);
    case "pronunciation":
      return pronunciationActivity(concept, dimension, random);
    case "grammar":
    case "culture": {
      const authored = authoredCandidates(index, conceptId, dimension);
      if (authored.length > 0) return pick(authored.slice(0, 4), random);
      return concept.kind === "grammar" ? grammarFallback(concept, dimension, random) : null;
    }
  }
}
