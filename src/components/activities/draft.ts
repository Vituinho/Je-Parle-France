import type { ClientActivity } from "@/lib/learning/activities/client";
import type { ActivityResponse } from "@/lib/learning/grading/grade";

/** In-progress answer state for each activity type (display-space indices). */
export type Draft =
  | { kind: "seen" }
  | { kind: "choice"; choice: number | null }
  | { kind: "choices"; choices: number[] }
  | { kind: "pairs"; pairs: [number, number][] }
  | { kind: "order"; picked: number[] }
  | { kind: "blanks"; blanks: string[] }
  | { kind: "text"; text: string }
  | { kind: "answers"; answers: (number | null)[] }
  | { kind: "speech"; selfRating: 0 | 0.5 | 1 | null; transcript?: string }
  | { kind: "self"; rating: 0 | 0.5 | 1 | null };

export function emptyDraft(activity: ClientActivity): Draft {
  switch (activity.type) {
    case "teach":
      return { kind: "seen" };
    case "choice":
    case "minimal_pair":
      return { kind: "choice", choice: null };
    case "multi_select":
      return { kind: "choices", choices: [] };
    case "match":
      return { kind: "pairs", pairs: [] };
    case "order":
      return { kind: "order", picked: [] };
    case "fill":
      return { kind: "blanks", blanks: Array(activity.parts.length - 1).fill("") };
    case "type":
    case "dictation":
    case "error_correction":
    case "open_writing":
      return { kind: "text", text: activity.type === "error_correction" ? activity.sentence : "" };
    case "reading":
    case "listening":
      return { kind: "answers", answers: Array(activity.questions.length).fill(null) };
    case "speak":
      return { kind: "speech", selfRating: null };
    case "self_assess":
      return { kind: "self", rating: null };
  }
}

export function isAnswerable(activity: ClientActivity, draft: Draft): boolean {
  switch (draft.kind) {
    case "seen":
      return true;
    case "choice":
      return draft.choice !== null;
    case "choices":
      return draft.choices.length > 0;
    case "pairs":
      return activity.type === "match" && draft.pairs.length === activity.left.length;
    case "order":
      return draft.picked.length > 0;
    case "blanks":
      return draft.blanks.every((blank) => blank.trim().length > 0);
    case "text":
      return draft.text.trim().length > 0;
    case "answers":
      return draft.answers.every((answer) => answer !== null);
    case "speech":
      return draft.selfRating !== null || Boolean(draft.transcript);
    case "self":
      return draft.rating !== null;
  }
}

export function toResponse(activity: ClientActivity, draft: Draft): ActivityResponse {
  switch (draft.kind) {
    case "seen":
      return { kind: "seen" };
    case "choice":
      return { kind: "choice", choice: draft.choice ?? -1 };
    case "choices":
      return { kind: "choices", choices: draft.choices };
    case "pairs":
      return { kind: "pairs", pairs: draft.pairs };
    case "order":
      return {
        kind: "tokens",
        tokens: activity.type === "order" ? draft.picked.map((i) => activity.tokens[i] ?? "") : [],
      };
    case "blanks":
      return { kind: "blanks", blanks: draft.blanks };
    case "text":
      return { kind: "text", text: draft.text };
    case "answers":
      return { kind: "answers", answers: draft.answers.map((answer) => answer ?? -1) };
    case "speech":
      return draft.transcript
        ? { kind: "speech", transcript: draft.transcript }
        : { kind: "speech", selfRating: draft.selfRating ?? 0 };
    case "self":
      return { kind: "self", rating: draft.rating ?? 0 };
  }
}
