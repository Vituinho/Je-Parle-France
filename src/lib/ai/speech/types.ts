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

/**
 * What a pronunciation provider can measure for one locale. Locales differ —
 * for Azure, phoneme names, syllables, spoken-phoneme alternatives and
 * prosody are en-US features — so callers ask instead of assuming.
 */
export interface PronunciationFeatures {
  /** Overall pronunciation score for the utterance. */
  overall: boolean;
  /** Accuracy, fluency (full text) and completeness against the reference text. */
  accuracy: boolean;
  fluency: boolean;
  completeness: boolean;
  /** Per-word accuracy and miscue (omitted / inserted / mispronounced). */
  wordAccuracy: boolean;
  /** Per-phoneme accuracy scores. */
  phonemeAccuracy: boolean;
  /** Which phoneme each score belongs to (IPA or SAPI labels). */
  phonemeNames: boolean;
  /** Which sounds were most likely said instead (N-best spoken phonemes). */
  spokenPhonemeAlternatives: boolean;
  /** Scores grouped by syllable. */
  syllables: boolean;
  /** Stress, intonation, rhythm and speed. */
  prosody: boolean;
}

export interface PronunciationResult extends TranscriptionResult {
  /**
   * The finest level the product reports. Per-phoneme scores without phoneme
   * names cannot tell a learner which sound to fix, so French stays at word level.
   */
  granularity: "word";
  scores: {
    /** How closely the sounds match a reference speaker (0–100). */
    accuracy: number;
    fluency: number;
    /** Share of the reference text that was said (0–100). */
    completeness: number;
    /** Stress, intonation and rhythm (0–100) — null where the locale does not support it. */
    prosody: number | null;
    overall: number;
  } | null;
  words: { word: string; accuracy: number | null; error: WordError }[];
}

export interface PronunciationAssessmentProvider {
  readonly id: string;
  /** What this provider can really measure for a locale. */
  features(locale: SpeechLocale): PronunciationFeatures;
  assess(
    wav: ArrayBuffer,
    referenceText: string,
    locale: SpeechLocale,
  ): Promise<PronunciationResult>;
}

export class SpeechProviderError extends Error {
  constructor(
    message: string,
    readonly reason:
      | "malformed_audio"
      | "unsupported"
      | "timeout"
      | "rate_limited"
      | "invalid_output"
      | "unavailable" = "unavailable",
  ) {
    super(message);
    this.name = "SpeechProviderError";
  }
}
