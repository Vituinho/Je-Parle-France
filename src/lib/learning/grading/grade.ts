import { z } from "zod";
import { BLANK, type Activity, type Localized } from "@/lib/content/schema";
import {
  compareText,
  hasMeaningfulSpellingDifference,
  normalize,
  wordRecall,
  type DiffToken,
  type TextVerdict,
} from "./text";

/**
 * Deterministic grading for every activity type that can be checked without
 * AI. Open writing is graded by the AI service (or self-assessed) elsewhere.
 */

export const activityResponseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), choice: z.number().int().min(0) }),
  z.object({ kind: z.literal("choices"), choices: z.array(z.number().int().min(0)).max(10) }),
  z.object({
    kind: z.literal("pairs"),
    pairs: z.array(z.tuple([z.number().int().min(0), z.number().int().min(0)])).max(10),
  }),
  z.object({ kind: z.literal("tokens"), tokens: z.array(z.string().max(80)).max(40) }),
  z.object({ kind: z.literal("blanks"), blanks: z.array(z.string().max(120)).max(10) }),
  z.object({ kind: z.literal("text"), text: z.string().max(2000) }),
  z.object({ kind: z.literal("answers"), answers: z.array(z.number().int().min(0)).max(20) }),
  z.object({
    kind: z.literal("speech"),
    /** Transcript from a speech-to-text provider, when available. */
    transcript: z.string().max(1000).optional(),
    /** Stored assessment to grade from (resolved on the server). */
    speechAttemptId: z.string().max(64).optional(),
    /** Overall pronunciation score 0–100 — only ever set by the server from a stored attempt. */
    pronunciation: z.number().min(0).max(100).optional(),
    /** Learner's own rating when no recogniser is available. */
    selfRating: z.union([z.literal(0), z.literal(0.5), z.literal(1)]).optional(),
  }),
  z.object({
    kind: z.literal("self"),
    rating: z.union([z.literal(0), z.literal(0.5), z.literal(1)]),
  }),
  z.object({ kind: z.literal("seen") }),
]);
export type ActivityResponse = z.infer<typeof activityResponseSchema>;

export type Verdict = "correct" | "alternative" | "almost" | "wrong" | "recorded";

export interface GradeResult {
  /** 0…1 */
  score: number;
  correct: boolean;
  verdict: Verdict;
  /** The model answer to show. */
  expected?: string;
  /** Learner's answer annotated token by token. */
  diff?: DiffToken[];
  /** Per sub-item correctness (blanks, questions, pairs). */
  parts?: boolean[];
  note?: Localized;
  /** True when the score comes from the learner's self-rating. */
  selfRated?: boolean;
}

export class GradingError extends Error {}

const NOTES: Partial<Record<TextVerdict, Localized>> = {
  accent: {
    pt: "Quase! Só faltou acertar os acentos — em francês eles mudam a escrita e às vezes o sentido.",
    fr: "Presque ! Attention aux accents.",
  },
  typo: { pt: "Quase! Parece um erro de digitação.", fr: "Presque ! Une petite faute de frappe." },
  punctuation: {
    pt: "Quase! Atenção ao apóstrofo ou ao hífen.",
    fr: "Presque ! Attention à l'apostrophe ou au trait d'union.",
  },
};

function fromText(
  verdict: TextVerdict,
  score: number,
): Pick<GradeResult, "verdict" | "correct" | "score" | "note"> {
  if (verdict === "exact") return { verdict: "correct", correct: true, score };
  if (verdict === "wrong") return { verdict: "wrong", correct: false, score };
  // Almost answers keep partial credit, then use the existing one-time retry.
  return { verdict: "almost", correct: false, score, note: NOTES[verdict] };
}

function authoredTextResult(
  response: string,
  accepted: readonly string[],
  alternatives: readonly { text: string; explanation: Localized }[],
) {
  const alternative = alternatives.find(
    (answer) =>
      normalize(response) === normalize(answer.text) &&
      !hasMeaningfulSpellingDifference(response, answer.text),
  );
  if (alternative)
    return {
      score: 1,
      correct: true,
      verdict: "alternative" as const,
      matched: alternative.text,
      note: alternative.explanation,
    };

  const result = compareText(response, [...accepted, ...alternatives.map((answer) => answer.text)]);
  return {
    ...fromText(result.verdict, result.score),
    matched: result.matched,
    diff: result.diff,
  };
}

function expectKind<K extends ActivityResponse["kind"]>(
  response: ActivityResponse,
  kind: K,
): Extract<ActivityResponse, { kind: K }> {
  if (response.kind !== kind)
    throw new GradingError(`Expected a "${kind}" response, got "${response.kind}"`);
  return response as Extract<ActivityResponse, { kind: K }>;
}

function fraction(parts: boolean[]): number {
  return parts.length === 0 ? 0 : parts.filter(Boolean).length / parts.length;
}

function verdictForScore(score: number): Verdict {
  if (score >= 0.999) return "correct";
  if (score >= 0.5) return "almost";
  return "wrong";
}

export function gradeActivity(activity: Activity, response: ActivityResponse): GradeResult {
  switch (activity.type) {
    case "teach":
      return { score: 1, correct: true, verdict: "recorded" };

    case "choice": {
      const { choice } = expectKind(response, "choice");
      const correct = choice === activity.answer;
      const note = activity.optionFeedback?.[choice] ?? undefined;
      return {
        score: correct ? 1 : 0,
        correct,
        verdict: correct ? "correct" : "wrong",
        expected: activity.options[activity.answer],
        note: note ?? undefined,
      };
    }

    case "multi_select": {
      const { choices } = expectKind(response, "choices");
      const picked = new Set(choices);
      const hits = activity.answers.filter((index) => picked.has(index)).length;
      const falsePositives = [...picked].filter(
        (index) => !activity.answers.includes(index),
      ).length;
      const score = Math.max(0, (hits - falsePositives) / activity.answers.length);
      const parts = activity.options.map(
        (_, index) => picked.has(index) === activity.answers.includes(index),
      );
      return { score, correct: score >= 0.999, verdict: verdictForScore(score), parts };
    }

    case "match": {
      const { pairs } = expectKind(response, "pairs");
      // Pairs are (leftIndex, rightIndex) in the authored order; correct when equal.
      const byLeft = new Map(pairs.map(([left, right]) => [left, right]));
      const parts = activity.pairs.map((_, index) => byLeft.get(index) === index);
      const score = fraction(parts);
      return { score, correct: score >= 0.999, verdict: verdictForScore(score), parts };
    }

    case "order": {
      const { tokens } = expectKind(response, "tokens");
      const given = normalize(tokens.join(" "));
      const accepted = [activity.tokens, ...activity.alternatives];
      const correct = accepted.some(
        (sequence) =>
          normalize(sequence.join(" ")) === given &&
          !hasMeaningfulSpellingDifference(tokens.join(" "), sequence.join(" ")),
      );
      return {
        score: correct ? 1 : 0,
        correct,
        verdict: correct ? "correct" : "wrong",
        expected: activity.tokens.join(" "),
      };
    }

    case "fill": {
      const { blanks } = expectKind(response, "blanks");
      const results = activity.blanks.map((blank, index) =>
        authoredTextResult(blanks[index] ?? "", blank.accept, blank.alternatives),
      );
      const parts = results.map((result) => result.correct);
      const score = results.reduce((sum, result) => sum + result.score, 0) / results.length;
      const expected = activity.blanks.reduce(
        (sentence, blank) => sentence.replace(BLANK, blank.accept[0] as string),
        activity.sentence,
      );
      const verdict = parts.every(Boolean)
        ? results.some((result) => result.verdict === "alternative")
          ? "alternative"
          : "correct"
        : verdictForScore(score);
      const feedback =
        results.find((result) => !result.correct) ??
        results.find((result) => result.verdict === "alternative");
      return {
        score,
        correct: parts.every(Boolean),
        verdict,
        expected,
        parts,
        note: feedback?.note,
      };
    }

    case "type": {
      const { text } = expectKind(response, "text");
      return {
        ...authoredTextResult(text, activity.accept, activity.alternatives),
        expected: activity.accept[0],
      };
    }

    case "error_correction": {
      const { text } = expectKind(response, "text");
      return {
        ...authoredTextResult(text, activity.accept, []),
        expected: activity.accept[0],
      };
    }

    case "dictation": {
      const { text } = expectKind(response, "text");
      const result = compareText(text, activity.accept);
      if (result.verdict !== "wrong") {
        return {
          ...fromText(result.verdict, result.score),
          expected: activity.accept[0],
          diff: result.diff,
        };
      }
      // Dictation earns partial credit for the words heard correctly.
      const score = Math.round(wordRecall(text, result.matched) * 0.8 * 100) / 100;
      return {
        score,
        correct: false,
        verdict: score >= 0.5 ? "almost" : "wrong",
        expected: activity.accept[0],
        diff: result.diff,
      };
    }

    case "minimal_pair": {
      const { choice } = expectKind(response, "choice");
      const correct = choice === activity.answer;
      return {
        score: correct ? 1 : 0,
        correct,
        verdict: correct ? "correct" : "wrong",
        expected: activity.pair[activity.answer].word,
      };
    }

    case "reading":
    case "listening": {
      const { answers } = expectKind(response, "answers");
      const parts = activity.questions.map((question, index) => answers[index] === question.answer);
      const score = fraction(parts);
      return { score, correct: score >= 0.999, verdict: verdictForScore(score), parts };
    }

    case "speak": {
      const speech = expectKind(response, "speech");
      if (speech.transcript !== undefined) {
        const targets =
          activity.mode === "respond" && activity.accept.length > 0
            ? activity.accept
            : [activity.text];
        const recall = Math.max(
          ...targets.map((target) => wordRecall(speech.transcript ?? "", target)),
        );
        // With a pronunciation assessment, intelligibility and sound accuracy count equally.
        const combined =
          speech.pronunciation === undefined
            ? recall
            : 0.5 * recall + 0.5 * (speech.pronunciation / 100);
        const score = Math.round(combined * 100) / 100;
        return {
          score,
          correct: score >= 0.8,
          verdict: verdictForScore(score >= 0.8 ? 1 : score),
          expected: activity.text,
        };
      }
      if (speech.selfRating !== undefined) {
        return {
          score: speech.selfRating,
          correct: speech.selfRating >= 0.5,
          verdict: verdictForScore(speech.selfRating),
          expected: activity.text,
          selfRated: true,
        };
      }
      throw new GradingError("Speech responses need a transcript or a self-rating");
    }

    case "self_assess": {
      const { rating } = expectKind(response, "self");
      return { score: rating, correct: true, verdict: "recorded", selfRated: true };
    }

    case "open_writing":
      throw new GradingError("Open writing is graded by the writing feedback service");
  }
}
