/**
 * Provider-agnostic speech interfaces (ADR-004). Business logic and UI only
 * depend on these; vendor specifics stay inside adapters.
 */
export type SpeechLocale = "fr-FR" | "fr-CA";

export interface SynthesisRequest {
  text: string;
  locale: SpeechLocale;
  gender: "f" | "m";
  rate: "slow" | "normal";
}

export interface SynthesisResult {
  audio: ArrayBuffer;
  contentType: string;
}

export interface TextToSpeechProvider {
  readonly id: string;
  synthesize(request: SynthesisRequest): Promise<SynthesisResult>;
}

export type RecognitionStatus = "ok" | "no_speech" | "not_understood" | "error";

export interface TranscriptionResult {
  status: RecognitionStatus;
  transcript: string | null;
}

export interface SpeechToTextProvider {
  readonly id: string;
  /** WAV, 16 kHz, mono, PCM 16-bit. */
  transcribe(wav: ArrayBuffer, locale: SpeechLocale): Promise<TranscriptionResult>;
}

export type WordError = "none" | "omission" | "insertion" | "mispronunciation";

export interface PronunciationResult extends TranscriptionResult {
  /**
   * The finest level at which scores are reliable. For French, Azure scores
   * full text and words but not phonemes — the UI never shows more than this.
   */
  granularity: "word";
  scores: {
    /** How closely the sounds match a reference speaker (0–100). */
    accuracy: number;
    fluency: number;
    /** Share of the reference text that was said (0–100). */
    completeness: number;
    overall: number;
  } | null;
  words: { word: string; accuracy: number | null; error: WordError }[];
}

export interface PronunciationAssessmentProvider {
  readonly id: string;
  assess(
    wav: ArrayBuffer,
    referenceText: string,
    locale: SpeechLocale,
  ): Promise<PronunciationResult>;
}

export class SpeechProviderError extends Error {}
