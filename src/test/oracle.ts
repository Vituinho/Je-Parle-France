import type { Activity } from "@/lib/content/schema";
import { toClientActivity } from "@/lib/learning/activities/client";
import type { ActivityResponse } from "@/lib/learning/grading/grade";

/**
 * Produces a response in *display* space (what the browser would send) for an
 * activity, either correct or deliberately wrong. Test-only.
 */
export function oracleResponse(
  activity: Activity,
  seed: string,
  correct: boolean,
): ActivityResponse {
  const client = toClientActivity(activity, seed);
  switch (activity.type) {
    case "choice": {
      if (client.type !== "choice") break;
      const right = client.options.indexOf(activity.options[activity.answer] as string);
      return { kind: "choice", choice: correct ? right : (right + 1) % client.options.length };
    }
    case "minimal_pair":
      return { kind: "choice", choice: correct ? activity.answer : 1 - activity.answer };
    case "reading":
    case "listening": {
      if (client.type !== "reading" && client.type !== "listening") break;
      return {
        kind: "answers",
        answers: activity.questions.map((question, q) => {
          const right = client.questions[q]!.options.indexOf(
            question.options[question.answer] as string,
          );
          return correct ? right : (right + 1) % question.options.length;
        }),
      };
    }
    case "fill":
      return {
        kind: "blanks",
        blanks: activity.blanks.map((blank) => (correct ? (blank.accept[0] as string) : "xyz")),
      };
    case "type":
    case "error_correction":
    case "dictation":
      return { kind: "text", text: correct ? (activity.accept[0] as string) : "je ne sais pas" };
    case "order":
      return { kind: "tokens", tokens: correct ? activity.tokens : [...activity.tokens].reverse() };
    case "self_assess":
      return { kind: "self", rating: correct ? 1 : 0 };
    case "speak":
      return { kind: "speech", selfRating: correct ? 1 : 0 };
    case "multi_select":
      return { kind: "choices", choices: correct ? activity.answers : [] };
    case "match":
      return { kind: "pairs", pairs: [] };
    default:
      break;
  }
  throw new Error(`oracle cannot answer ${activity.type}`);
}
