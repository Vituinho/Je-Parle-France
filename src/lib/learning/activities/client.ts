import type { Activity, ActivityOf, Audio, Localized, Prompt } from "@/lib/content/schema";
import type { ActivityResponse, GradeResult } from "../grading/grade";
import type { DiffToken } from "../grading/text";
import { seededShuffle } from "../random";

/**
 * What the browser receives for an activity: answer keys removed, options
 * shuffled with a seed (so the learner sees a stable order and the server can
 * map indices back). Grading always happens on the server.
 *
 * Audio texts are still sent when the browser synthesises speech; hiding answers
 * is best-effort and only meant to keep them out of casual view.
 */
interface Common {
  id: string;
  instruction?: Localized;
  hint?: Localized;
}

export type ClientActivity =
  | (Common & Omit<ActivityOf<"teach">, "id">)
  | (Common & { type: "choice"; prompt: Prompt; options: string[]; optionsLang: "fr" | "pt" })
  | (Common & { type: "multi_select"; prompt: Prompt; options: string[]; optionsLang: "fr" | "pt" })
  | (Common & {
      type: "match";
      left: string[];
      right: string[];
      leftLang: "fr" | "pt";
      rightLang: "fr" | "pt";
    })
  | (Common & { type: "order"; tokens: string[]; translation?: string; audioText?: string })
  | (Common & {
      type: "fill";
      /** Sentence split around the blanks. */
      parts: string[];
      wordBank?: string[];
      translation?: string;
    })
  | (Common & { type: "type"; prompt: Prompt })
  | (Common & { type: "dictation"; audio: Audio; translation?: string })
  | (Common & {
      type: "speak";
      mode: "repeat" | "read" | "respond";
      text: string;
      prompt?: Prompt;
      region: "fr-FR" | "fr-CA";
      translation?: string;
    })
  | (Common & {
      type: "minimal_pair";
      pair: [
        { word: string; ipa: string; pt?: string },
        { word: string; ipa: string; pt?: string },
      ];
      /** The word that is played. Needed for browser speech synthesis. */
      playText: string;
      region: "fr-FR" | "fr-CA";
    })
  | (Common & {
      type: "reading";
      passage: { title?: string; text: string };
      questions: ClientQuestion[];
    })
  | (Common & {
      type: "listening";
      lines: ActivityOf<"listening">["lines"];
      questions: ClientQuestion[];
      context?: Localized;
    })
  | (Common & { type: "error_correction"; sentence: string })
  | (Common & { type: "open_writing"; prompt: Localized; minWords: number })
  | (Common & { type: "self_assess"; statement: Localized });

export interface ClientQuestion {
  prompt: { fr?: string; pt?: string };
  options: string[];
  optionsLang: "fr" | "pt";
}

const seedFor = (seed: string, activityId: string, part = "") => `${seed}:${activityId}:${part}`;

/** Indices 0…n−1 in display order. displayed[i] = authored index. */
function order(length: number, seed: string): number[] {
  return seededShuffle(
    Array.from({ length }, (_, i) => i),
    seed,
  );
}

export function toClientActivity(activity: Activity, seed: string): ClientActivity {
  if (activity.type === "teach") return activity;
  const common = { id: activity.id, instruction: activity.instruction, hint: activity.hint };
  switch (activity.type) {
    case "choice":
    case "multi_select": {
      const displayed = order(activity.options.length, seedFor(seed, activity.id));
      return {
        ...common,
        type: activity.type,
        prompt: activity.prompt,
        options: displayed.map((i) => activity.options[i] as string),
        optionsLang: activity.optionsLang,
      };
    }
    case "match": {
      const left = order(activity.pairs.length, seedFor(seed, activity.id, "left"));
      const right = order(activity.pairs.length, seedFor(seed, activity.id, "right"));
      return {
        ...common,
        type: "match",
        left: left.map((i) => activity.pairs[i]?.left as string),
        right: right.map((i) => activity.pairs[i]?.right as string),
        leftLang: activity.leftLang,
        rightLang: activity.rightLang,
      };
    }
    case "order": {
      const tokens = [...activity.tokens, ...activity.distractors];
      return {
        ...common,
        type: "order",
        tokens: seededShuffle(tokens, seedFor(seed, activity.id)),
        translation: activity.translation,
        audioText: undefined,
      };
    }
    case "fill":
      return {
        ...common,
        type: "fill",
        parts: activity.sentence.split("___"),
        wordBank: activity.wordBank
          ? seededShuffle(activity.wordBank, seedFor(seed, activity.id))
          : undefined,
        translation: activity.translation,
      };
    case "type":
      return { ...common, type: "type", prompt: activity.prompt };
    case "dictation":
      return {
        ...common,
        type: "dictation",
        audio: activity.audio,
        translation: activity.translation,
      };
    case "speak":
      return {
        ...common,
        type: "speak",
        mode: activity.mode,
        text: activity.text,
        prompt: activity.prompt,
        region: activity.region,
        translation: activity.translation,
      };
    case "minimal_pair":
      return {
        ...common,
        type: "minimal_pair",
        pair: activity.pair,
        playText: activity.pair[activity.answer].word,
        region: activity.region,
      };
    case "reading":
    case "listening": {
      const questions = activity.questions.map((question, q) => {
        const displayed = order(question.options.length, seedFor(seed, activity.id, `q${q}`));
        return {
          prompt: question.prompt,
          options: displayed.map((i) => question.options[i] as string),
          optionsLang: question.optionsLang,
        };
      });
      return activity.type === "reading"
        ? { ...common, type: "reading", passage: activity.passage, questions }
        : {
            ...common,
            type: "listening",
            lines: activity.lines,
            questions,
            context: activity.context,
          };
    }
    case "error_correction":
      return { ...common, type: "error_correction", sentence: activity.sentence };
    case "open_writing":
      return {
        ...common,
        type: "open_writing",
        prompt: activity.prompt,
        minWords: activity.minWords,
      };
    case "self_assess":
      return { ...common, type: "self_assess", statement: activity.statement };
  }
}

/** Maps display-order indices in a client response back to authored indices. */
export function toAuthoredResponse(
  activity: Activity,
  response: ActivityResponse,
  seed: string,
): ActivityResponse {
  switch (activity.type) {
    case "choice": {
      if (response.kind !== "choice") return response;
      const displayed = order(activity.options.length, seedFor(seed, activity.id));
      return { kind: "choice", choice: displayed[response.choice] ?? -1 };
    }
    case "multi_select": {
      if (response.kind !== "choices") return response;
      const displayed = order(activity.options.length, seedFor(seed, activity.id));
      return { kind: "choices", choices: response.choices.map((i) => displayed[i] ?? -1) };
    }
    case "match": {
      if (response.kind !== "pairs") return response;
      const left = order(activity.pairs.length, seedFor(seed, activity.id, "left"));
      const right = order(activity.pairs.length, seedFor(seed, activity.id, "right"));
      return {
        kind: "pairs",
        pairs: response.pairs.map(([l, r]) => [left[l] ?? -1, right[r] ?? -1] as [number, number]),
      };
    }
    case "reading":
    case "listening": {
      if (response.kind !== "answers") return response;
      return {
        kind: "answers",
        answers: response.answers.map((answer, q) => {
          const question = activity.questions[q];
          if (!question) return -1;
          const displayed = order(question.options.length, seedFor(seed, activity.id, `q${q}`));
          return displayed[answer] ?? -1;
        }),
      };
    }
    default:
      return response;
  }
}

/** Display index of the correct option (for feedback after server grading). */
export function displayedIndex(
  activity: Activity,
  authoredIndex: number,
  seed: string,
  part = "",
): number {
  const length =
    activity.type === "choice" || activity.type === "multi_select"
      ? activity.options.length
      : activity.type === "reading" || activity.type === "listening"
        ? (activity.questions[Number(part.replace("q", ""))]?.options.length ?? 0)
        : 0;
  return order(length, seedFor(seed, activity.id, part)).indexOf(authoredIndex);
}

// ─── Feedback ──────────────────────────────────────────────────────────────

/** Grade result enriched with display-space positions of the right answers. */
export interface ClientFeedback {
  verdict: "correct" | "almost" | "wrong" | "recorded";
  score: number;
  correct: boolean;
  expected?: string;
  diff?: DiffToken[];
  parts?: boolean[];
  note?: Localized;
  explanation?: Localized;
  selfRated?: boolean;
  correctOption?: number;
  correctOptions?: number[];
  correctAnswers?: number[];
  correctPairs?: [number, number][];
}

export function toClientFeedback(
  activity: Activity,
  grade: GradeResult,
  seed: string,
): ClientFeedback {
  const feedback: ClientFeedback = {
    verdict: grade.verdict,
    score: grade.score,
    correct: grade.correct,
    expected: grade.expected,
    diff: grade.diff,
    parts: grade.parts,
    note: grade.note,
    selfRated: grade.selfRated,
    explanation: activity.type === "teach" ? undefined : activity.explanation,
  };
  switch (activity.type) {
    case "choice":
      feedback.correctOption = displayedIndex(activity, activity.answer, seed);
      break;
    case "minimal_pair":
      feedback.correctOption = activity.answer;
      break;
    case "multi_select":
      feedback.correctOptions = activity.answers.map((i) => displayedIndex(activity, i, seed));
      break;
    case "reading":
    case "listening":
      feedback.correctAnswers = activity.questions.map((question, q) =>
        displayedIndex(activity, question.answer, seed, `q${q}`),
      );
      break;
    case "match": {
      const left = order(activity.pairs.length, seedFor(seed, activity.id, "left"));
      const right = order(activity.pairs.length, seedFor(seed, activity.id, "right"));
      feedback.correctPairs = activity.pairs.map(
        (_, authored) => [left.indexOf(authored), right.indexOf(authored)] as [number, number],
      );
      break;
    }
    default:
      break;
  }
  return feedback;
}
