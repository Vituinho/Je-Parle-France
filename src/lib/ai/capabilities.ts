import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Which external capabilities are really available. Development mocks never
 * count as a capability for assessment purposes: a mocked speech score must
 * not become evidence about the learner.
 */
export interface Capabilities {
  speechRecognition: boolean;
  pronunciationAssessment: boolean;
  serverTts: boolean;
  llm: boolean;
}

export function getCapabilities(): Capabilities {
  const env = serverEnv();
  const azure = env.SPEECH_PROVIDER === "azure";
  return {
    speechRecognition: azure,
    pronunciationAssessment: azure,
    serverTts: azure,
    llm: env.LLM_PROVIDER === "anthropic",
  };
}

/** The subset the browser may know about (no secrets). */
export interface PublicCapabilities {
  serverTts: boolean;
  pronunciation: boolean;
  /** Speech-to-text for spoken tutor turns. */
  speechRecognition: boolean;
}

export function publicCapabilities(): PublicCapabilities {
  try {
    const capabilities = getCapabilities();
    return {
      serverTts: capabilities.serverTts,
      pronunciation: capabilities.pronunciationAssessment,
      speechRecognition: capabilities.speechRecognition,
    };
  } catch {
    return { serverTts: false, pronunciation: false, speechRecognition: false };
  }
}
