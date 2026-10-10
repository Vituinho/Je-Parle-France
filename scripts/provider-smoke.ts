import { z } from "zod";
import type { LLMProvider, GenerateObjectParams } from "../src/lib/ai/llm/types";
import { LLMUnavailableError } from "../src/lib/ai/llm/types";
import type {
  PronunciationAssessmentProvider,
  SpeechToTextProvider,
  SpeechLocale,
} from "../src/lib/ai/speech/types";
import { SpeechProviderError } from "../src/lib/ai/speech/types";
import { validateSpeechWav } from "../src/lib/ai/speech/audio";
import { getContent } from "../src/lib/content";
import { buildTutorSystemPrompt, tutorTurnSchema } from "../src/lib/learning/tutor/tutor";
import { writingJudgmentSchema, writingPrompt } from "../src/lib/learning/writing/assessment";

export const TUTOR_SMOKE_CASES = [
  "beginner",
  "intermediate",
  "correction",
  "roleplay",
  "writing",
] as const;
export type TutorSmokeCase = (typeof TUTOR_SMOKE_CASES)[number];
export type SpeechSmokeCase = "speech" | "silence" | "short";
const units = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
});

/** Synthetic content only; no database, real learner context or transcript output. */
export function tutorSmokeRequest(kind: TutorSmokeCase): GenerateObjectParams<unknown> {
  if (kind === "writing") {
    const activity = getContent().placementItems.get("pw-a2-ow")?.activity;
    if (activity?.type !== "open_writing" || !activity.rubric)
      throw new Error("Missing authored rubric");
    const prompt = writingPrompt(
      activity,
      "Bonjour, je m'appelle Ana. Je suis brésilienne et j'habite à Montréal. Je cherche un emploi et je voudrais apprendre le français pour parler avec mes collègues.",
    );
    return {
      system: prompt.system,
      messages: [{ role: "user", content: prompt.input }],
      schema: writingJudgmentSchema,
      purpose: "writing_feedback",
      effort: "medium",
      maxTokens: 2200,
    };
  }
  const level = kind === "beginner" ? "A0" : kind === "intermediate" ? "B1" : "A2";
  return {
    system: buildTutorSystemPrompt({
      level,
      theta: level === "A0" ? 0.4 : level === "B1" ? 3.2 : 2.5,
      destination: "canada_quebec",
      correctionMode: "important_only",
      knownVocabulary: ["bonjour", "travail"],
      weakItems: ["avoir besoin de"],
      recentMistakes: [],
      ...(kind === "roleplay"
        ? {
            scenario: {
              title: "Au café",
              setting: "Un café à Montréal",
              aiRole: "Serveur",
              learnerGoal: "Commander un café",
              region: "fr-CA" as const,
            },
          }
        : {}),
    }),
    messages: [
      {
        role: "user",
        content:
          kind === "beginner"
            ? "Bonjour. Je m'appelle Ana."
            : kind === "correction"
              ? "Je besoin d'aide pour trouver un travail."
              : kind === "roleplay"
                ? "Bonjour, je voudrais un café, s'il vous plaît."
                : "Je voudrais discuter des avantages du transport en commun à Montréal.",
      },
    ],
    schema: tutorTurnSchema,
    purpose: "tutor_turn",
    effort: "low",
    maxTokens: 1000,
  };
}

export async function runTutorSmoke(provider: LLMProvider, kind: TutorSmokeCase) {
  const request = tutorSmokeRequest(kind);
  const contextCharacters =
    request.system.length + request.messages.reduce((n, m) => n + m.content.length, 0);
  const common = {
    provider: provider.id,
    case: kind,
    contextCharacters,
    maxOutputTokens: request.maxTokens,
    liveValidated: false,
  };
  if (contextCharacters > 12_000)
    return {
      ...common,
      passed: false,
      requestSuccess: false,
      reason: "context_limit",
      latencyMs: 0,
    };
  const start = performance.now();
  try {
    const result = await provider.generateObject(request);
    const valid = request.schema.safeParse(result.object).success;
    const usage = units.safeParse(result.usage);
    const passed = valid && !result.simulated;
    return {
      ...common,
      model: result.model,
      passed,
      requestSuccess: true,
      structuredOutputValid: valid,
      liveValidated: passed,
      latencyMs: Math.round(performance.now() - start),
      usage: usage.success ? usage.data : null,
      warnings: usage.success ? [] : ["usage_unknown"],
    };
  } catch (error) {
    return {
      ...common,
      passed: false,
      requestSuccess: false,
      latencyMs: Math.round(performance.now() - start),
      reason: error instanceof LLMUnavailableError ? error.reason : "smoke_failed",
    };
  }
}

export async function runSpeechSmoke(
  provider: SpeechToTextProvider & PronunciationAssessmentProvider,
  wav: ArrayBuffer,
  locale: SpeechLocale,
  reference: string,
  kind: SpeechSmokeCase = "speech",
) {
  const audioMs = validateSpeechWav(wav);
  if (reference.trim().length < 1 || reference.length > 300) throw new Error("Invalid reference");
  if (kind === "short" && audioMs >= 1000) throw new Error("Expected a subsecond fixture");
  const capabilities = provider.features(locale);
  const results = [];
  for (const operation of ["stt", "pronunciation"] as const) {
    const start = performance.now();
    const common = {
      provider: provider.id,
      locale,
      operation,
      case: kind,
      audioMs,
      capabilities,
      capabilitySource: "adapter_contract",
    };
    try {
      const assessment =
        operation === "pronunciation" ? await provider.assess(wav, reference, locale) : null;
      const result = assessment ?? (await provider.transcribe(wav, locale));
      const scores = assessment?.scores ?? null;
      const scoresReturned = scores
        ? Object.entries(scores)
            .filter(([, v]) => v !== null)
            .map(([k]) => k)
        : [];
      const unsupported = scores && !capabilities.prosody && scores.prosody !== null;
      const passed =
        !unsupported &&
        (kind === "silence"
          ? result.status === "no_speech" || result.status === "not_understood"
          : kind === "short"
            ? result.status !== "error"
            : result.status === "ok" && (operation === "stt" || scores !== null));
      results.push({
        ...common,
        passed,
        requestSuccess: result.status !== "error",
        recognition: result.status,
        liveValidated: passed,
        latencyMs: Math.round(performance.now() - start),
        scoresReturned,
        warnings: [
          ...(kind === "short" ? ["short_audio_not_quality_validation"] : []),
          ...(unsupported ? ["unsupported_metric_returned"] : []),
        ],
      });
      if (!passed) break;
    } catch (error) {
      results.push({
        ...common,
        passed: false,
        requestSuccess: false,
        liveValidated: false,
        latencyMs: Math.round(performance.now() - start),
        scoresReturned: [],
        reason: error instanceof SpeechProviderError ? error.reason : "smoke_failed",
      });
      break;
    }
  }
  return results;
}
