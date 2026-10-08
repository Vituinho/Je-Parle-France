import "server-only";
import { z } from "zod";
import { validateSpeechWav } from "./audio";
import {
  SpeechProviderError,
  type PronunciationAssessmentProvider,
  type PronunciationFeatures,
  type PronunciationResult,
  type RecognitionStatus,
  type SpeechLocale,
  type SpeechToTextProvider,
  type SynthesisRequest,
  type SynthesisResult,
  type TextToSpeechProvider,
  type TranscriptionResult,
  type WordError,
} from "./types";

/**
 * Azure AI Speech adapter over the REST APIs (no SDK, no client secrets):
 * neural TTS for fr-FR / fr-CA, short-audio recognition, and scripted
 * pronunciation assessment at word granularity.
 */

/**
 * What Azure pronunciation assessment offers for French, per the official
 * documentation (how-to-pronunciation-assessment, "Supported features per
 * locale"; checked 2026-10-08). Both locales support scripted assessment with
 * accuracy, fluency, completeness, word scores and miscues. Phoneme accuracy
 * scores exist, but phoneme names, syllable groups and spoken-phoneme
 * alternatives are en-US only, and so is prosody. Update this table — not
 * the UI — when Microsoft extends a feature.
 */
const FRENCH_FEATURES: PronunciationFeatures = {
  overall: true,
  accuracy: true,
  fluency: true,
  completeness: true,
  wordAccuracy: true,
  phonemeAccuracy: true,
  phonemeNames: false,
  spokenPhonemeAlternatives: false,
  syllables: false,
  prosody: false,
};

export const AZURE_PRONUNCIATION_FEATURES: Record<SpeechLocale, PronunciationFeatures> = {
  "fr-FR": FRENCH_FEATURES,
  "fr-CA": FRENCH_FEATURES,
};
const VOICES: Record<SpeechLocale, Record<"f" | "m", string>> = {
  "fr-FR": { f: "fr-FR-DeniseNeural", m: "fr-FR-HenriNeural" },
  "fr-CA": { f: "fr-CA-SylvieNeural", m: "fr-CA-AntoineNeural" },
};

const escapeXml = (text: string) =>
  text.replace(
    /[<>&'"]/g,
    (char) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char] ?? char,
  );

const score = z.number().min(0).max(100);
const recognitionSchema = z.object({
  RecognitionStatus: z.enum([
    "Success",
    "InitialSilenceTimeout",
    "BabbleTimeout",
    "NoMatch",
    "Error",
    "EndOfDictation",
  ]),
  DisplayText: z.string().max(10_000).optional(),
  NBest: z
    .array(
      z.object({
        Display: z.string().max(10_000).optional(),
        AccuracyScore: score.optional(),
        FluencyScore: score.optional(),
        CompletenessScore: score.optional(),
        ProsodyScore: score.optional(),
        PronScore: score.optional(),
        Words: z
          .array(
            z.object({
              Word: z.string().max(500),
              AccuracyScore: score.optional(),
              ErrorType: z.enum(["None", "Omission", "Insertion", "Mispronunciation"]).optional(),
            }),
          )
          .max(1000)
          .optional(),
      }),
    )
    .max(20)
    .optional(),
});
type AzureRecognition = z.infer<typeof recognitionSchema>;

function statusOf(value: string): RecognitionStatus {
  if (value === "Success") return "ok";
  if (value === "InitialSilenceTimeout" || value === "BabbleTimeout") return "no_speech";
  if (value === "NoMatch") return "not_understood";
  return "error";
}

const WORD_ERRORS: Record<string, WordError> = {
  None: "none",
  Omission: "omission",
  Insertion: "insertion",
  Mispronunciation: "mispronunciation",
};

export class AzureSpeechProvider
  implements TextToSpeechProvider, SpeechToTextProvider, PronunciationAssessmentProvider
{
  readonly id = "azure";

  constructor(
    private readonly key: string,
    private readonly region: string,
    private readonly timeoutMs = 20_000,
  ) {
    if (!/^[a-z0-9-]+$/.test(region)) throw new SpeechProviderError("Invalid Azure region.");
  }

  private async request<T>(
    url: string,
    init: RequestInit,
    read: (response: Response) => Promise<T>,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (!response.ok)
        throw new SpeechProviderError(`Speech request failed with ${response.status}`);
      return await read(response);
    } catch (error) {
      if (controller.signal.aborted)
        throw new SpeechProviderError("Speech request timed out.", "timeout");
      if (error instanceof SpeechProviderError) throw error;
      throw new SpeechProviderError("Speech service unavailable.");
    } finally {
      clearTimeout(timer);
    }
  }

  private sttUrl(locale: SpeechLocale) {
    return `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${locale}&format=detailed`;
  }

  async synthesize(request: SynthesisRequest): Promise<SynthesisResult> {
    this.features(request.locale);
    const voice = VOICES[request.locale][request.gender];
    const rate = request.rate === "slow" ? "-25%" : "0%";
    const ssml = `<speak version="1.0" xml:lang="${request.locale}"><voice name="${voice}"><prosody rate="${rate}">${escapeXml(request.text)}</prosody></voice></speak>`;
    const audio = await this.request(
      `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": this.key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          "User-Agent": "je-parle-francais",
        },
        body: ssml,
      },
      (response) => response.arrayBuffer(),
    );
    if (!audio.byteLength)
      throw new SpeechProviderError("Empty synthesis output.", "invalid_output");
    return { audio, contentType: "audio/mpeg" };
  }

  private async recognize(
    wav: ArrayBuffer,
    locale: SpeechLocale,
    assessment?: object,
  ): Promise<AzureRecognition> {
    this.features(locale);
    validateSpeechWav(wav);
    const headers: Record<string, string> = {
      "Ocp-Apim-Subscription-Key": this.key,
      "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
      Accept: "application/json",
    };
    if (assessment) {
      headers["Pronunciation-Assessment"] = Buffer.from(
        JSON.stringify(assessment),
        "utf8",
      ).toString("base64");
    }
    return this.request(
      this.sttUrl(locale),
      { method: "POST", headers, body: wav },
      async (response) => {
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          throw new SpeechProviderError("Invalid recognition JSON.", "invalid_output");
        }
        const parsed = recognitionSchema.safeParse(body);
        if (!parsed.success)
          throw new SpeechProviderError("Invalid recognition output.", "invalid_output");
        return parsed.data;
      },
    );
  }

  features(locale: SpeechLocale): PronunciationFeatures {
    if (!Object.hasOwn(AZURE_PRONUNCIATION_FEATURES, locale))
      throw new SpeechProviderError("Unsupported speech locale.", "unsupported");
    return AZURE_PRONUNCIATION_FEATURES[locale];
  }

  async transcribe(wav: ArrayBuffer, locale: SpeechLocale): Promise<TranscriptionResult> {
    const result = await this.recognize(wav, locale);
    const status = statusOf(result.RecognitionStatus);
    if (status === "ok" && !(result.NBest?.[0]?.Display ?? result.DisplayText)?.trim())
      throw new SpeechProviderError("Missing recognition transcript.", "invalid_output");
    return {
      status,
      transcript:
        status === "ok" ? (result.NBest?.[0]?.Display ?? result.DisplayText ?? null) : null,
    };
  }

  async assess(
    wav: ArrayBuffer,
    referenceText: string,
    locale: SpeechLocale,
  ): Promise<PronunciationResult> {
    const features = this.features(locale);
    const result = await this.recognize(wav, locale, {
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      // Phoneme scores without phoneme names cannot tell the learner which
      // sound to fix, so word level is the finest granularity requested.
      Granularity: "Word",
      Dimension: "Comprehensive",
      EnableMiscue: "True",
      // Prosody is a paid add-on: request it only where the locale has it.
      ...(features.prosody ? { EnableProsodyAssessment: "True" } : {}),
    });
    const status = statusOf(result.RecognitionStatus);
    const best = result.NBest?.[0];
    if (status !== "ok") {
      return { status, transcript: null, granularity: "word", scores: null, words: [] };
    }
    if (
      !best ||
      best.AccuracyScore === undefined ||
      best.FluencyScore === undefined ||
      best.CompletenessScore === undefined ||
      best.PronScore === undefined
    )
      throw new SpeechProviderError("Missing pronunciation metrics.", "invalid_output");
    return {
      status,
      transcript: best.Display ?? result.DisplayText ?? null,
      granularity: "word",
      scores: {
        accuracy: best.AccuracyScore,
        fluency: best.FluencyScore,
        completeness: best.CompletenessScore,
        prosody: features.prosody ? (best.ProsodyScore ?? null) : null,
        overall: best.PronScore,
      },
      words: (best.Words ?? []).map((word) => ({
        word: word.Word,
        accuracy: word.AccuracyScore ?? null,
        error: WORD_ERRORS[word.ErrorType ?? "None"] ?? "none",
      })),
    };
  }
}
