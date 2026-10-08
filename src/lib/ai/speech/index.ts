import "server-only";
import { serverEnv } from "@/lib/env";
import { AzureSpeechProvider } from "./azure";
import type {
  PronunciationAssessmentProvider,
  SpeechToTextProvider,
  TextToSpeechProvider,
} from "./types";

export * from "./types";

export interface SpeechProviders {
  tts: TextToSpeechProvider;
  stt: SpeechToTextProvider;
  pronunciation: PronunciationAssessmentProvider;
}

let cached: SpeechProviders | null | undefined;

/**
 * The configured speech providers, or null. There is deliberately no mock in
 * the product path: without a provider the app uses the browser's speech
 * synthesis and self-rated speaking, and never invents speech scores.
 */
export function getSpeech(): SpeechProviders | null {
  if (cached !== undefined) return cached;
  const env = serverEnv();
  if (env.SPEECH_PROVIDER === "azure" && env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION) {
    const azure = new AzureSpeechProvider(env.AZURE_SPEECH_KEY, env.AZURE_SPEECH_REGION);
    cached = { tts: azure, stt: azure, pronunciation: azure };
  } else {
    cached = null;
  }
  return cached;
}
