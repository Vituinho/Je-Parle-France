import { correctText, detectErrors } from "@/lib/learning/errors/patterns";
import { stripSpokenMarker } from "@/lib/learning/tutor/tutor";
import type { GenerateObjectParams, GenerateObjectResult, LLMProvider } from "./types";

/**
 * Development stand-in for the tutor when no LLM is configured. It keeps the
 * whole flow usable offline (scripted replies, rule-based corrections,
 * heuristic report) and marks every result as simulated — the UI shows a
 * "simulado" badge and nothing it produces counts as assessment evidence.
 */
const REPLIES = [
  "D'accord ! Et vous, qu'est-ce que vous aimez faire le week-end ?",
  "Très bien. Vous pouvez m'en dire un peu plus ?",
  "Ah, c'est intéressant ! Et ensuite ?",
  "Parfait. Autre chose ?",
  "Merci ! C'était un plaisir de parler avec vous.",
];

export class MockProvider implements LLMProvider {
  readonly id = "mock" as const;
  readonly simulated = true;

  async generateObject<T>(params: GenerateObjectParams<T>): Promise<GenerateObjectResult<T>> {
    const learnerMessages = params.messages.filter((message) => message.role === "user");
    const last = stripSpokenMarker(learnerMessages.at(-1)?.content ?? "");
    let candidate: unknown;
    if (params.purpose === "tutor_turn") {
      const assistantTurns = params.messages.filter(
        (message) => message.role === "assistant",
      ).length;
      const fixed = correctText(last);
      const recast = fixed !== last ? `${fixed.replace(/[.!?]*$/, "")}, je comprends. ` : "";
      candidate = {
        reply: `${recast}${REPLIES[Math.min(assistantTurns - 1, REPLIES.length - 1)] ?? REPLIES[0]}`,
        corrections: detectErrors(last)
          .slice(0, 3)
          .map((error) => ({
            wrong: error.wrong,
            right: error.right,
            explanationPt: error.explanation,
            severity: error.severity,
          })),
      };
    } else if (params.purpose === "tutor_report") {
      const transcript = last;
      const learnerLines = transcript.split("\n").filter((line) => line.startsWith("LEARNER:"));
      const words = learnerLines.join(" ").split(/\s+/).length;
      const errors = learnerLines.flatMap((line) => detectErrors(line));
      const fluency = Math.min(90, 30 + learnerLines.length * 8 + Math.min(20, words / 5));
      candidate = {
        scores: {
          fluency,
          vocabulary: Math.min(85, 35 + words / 3),
          grammar: Math.max(30, 85 - errors.length * 12),
          comprehension: Math.min(90, 40 + learnerLines.length * 10),
        },
        summaryPt:
          "Relatório simulado (modo de desenvolvimento, sem IA configurada): as notas são estimativas simples baseadas no tamanho das suas mensagens e nos erros detectados automaticamente.",
        strengths: learnerLines.length >= 3 ? ["Você manteve a conversa por várias trocas."] : [],
        corrections: errors.slice(0, 5).map((error) => ({
          wrong: error.wrong,
          right: error.right,
          explanationPt: error.explanation,
        })),
        nextSteps: ["Configure um provedor de IA para receber um relatório detalhado."],
      };
    } else {
      candidate = { feedbackPt: "Correção simulada.", corrected: correctText(last), score: 50 };
    }
    return {
      object: params.schema.parse(candidate),
      usage: { inputTokens: 0, outputTokens: 0 },
      simulated: true,
      model: "mock",
    };
  }
}
