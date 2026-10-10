import "server-only";
import { getLLM, LLMUnavailableError } from "@/lib/ai/llm";
import { reportProviderFailure } from "@/lib/ai/diagnostics";
import { getContent } from "@/lib/content";
import type { ActivityOf } from "@/lib/content/schema";
import { serverEnv } from "@/lib/env";
import {
  assessWriting,
  unassessedWriting,
  writingAnalysis,
  writingJudgmentSchema,
  writingPrompt,
} from "@/lib/learning/writing/assessment";
import { consumeQuota, addUsageUnits, throttle, QuotaError } from "@/server/quota";
import { localDate } from "@/lib/learning/time";
import { observeProvider } from "./provider-telemetry";

/** Provider orchestration only. Caller persists this with its original answer in the same transaction. */
export async function evaluateWriting(
  userId: string,
  activity: ActivityOf<"open_writing">,
  original: string,
) {
  if (!activity.rubric || original.length > 2000)
    throw new Error("Invalid writing task or answer.");
  const level = activity.rubric.expectedLevel;
  if (serverEnv().WRITING_AI_ENABLED === false)
    return unassessedWriting(
      original,
      level,
      "Avaliação por IA pausada. Seu texto foi preservado; continue a atividade.",
    );
  if (writingAnalysis(original).wordCount < 3)
    return unassessedWriting(
      original,
      level,
      "Texto insuficiente para avaliar as dimensões de escrita.",
    );
  const llm = getLLM();
  if (llm.simulated)
    return unassessedWriting(
      original,
      level,
      "Provedor real de avaliação de escrita não configurado.",
    );
  if (!throttle(userId, "writing", 1500))
    throw new LLMUnavailableError(
      "Espere um instante antes de avaliar outro texto.",
      "rate_limited",
    );
  const date = localDate(new Date(), "UTC");
  const prompt = writingPrompt(activity, original);
  try {
    await consumeQuota(userId, "writing", date, serverEnv().WRITING_DAILY_ASSESSMENTS);
    const result = await observeProvider(
      userId,
      { provider: llm.id, operation: "writing_feedback", simulated: llm.simulated },
      () =>
        llm.generateObject({
          system: prompt.system,
          messages: [{ role: "user", content: prompt.input }],
          schema: writingJudgmentSchema,
          purpose: "writing_feedback",
          effort: "medium",
          maxTokens: 2200,
        }),
      (result) => result.usage,
    );
    await addUsageUnits(
      userId,
      "writing",
      date,
      result.usage.inputTokens + result.usage.outputTokens,
    );
    if (result.simulated)
      return unassessedWriting(original, level, "Resultado simulado excluído da avaliação.");
    return assessWriting({
      original,
      activity,
      judgment: result.object,
      model: result.model,
      concepts: getContent().concepts,
    });
  } catch (error) {
    if (error instanceof LLMUnavailableError || error instanceof QuotaError)
      return unassessedWriting(original, level, error.message);
    // Malformed or invented output is not learning evidence. Do not expose provider output.
    if (llm.id === "anthropic")
      reportProviderFailure("anthropic", "writing_feedback", "invalid_output");
    return unassessedWriting(
      original,
      level,
      "Não foi possível validar a avaliação. Tente novamente mais tarde.",
    );
  }
}
