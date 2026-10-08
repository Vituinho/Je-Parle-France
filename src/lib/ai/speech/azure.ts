import "server-only";
import {
  SpeechProviderError,
  type PronunciationAssessmentProvider,
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
 * neural TTS for fr-FR / fr-CA, short-audio recognition, and pronunciation
 * assessment at word granularity (phoneme-level results are not offered for
 * French, so they are never requested or shown).
 */
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

interface AzureWord {
  Word: string;
  AccuracyScore?: number;
  ErrorType?: string;
}

interface AzureNBest {
  Display?: string;
  Lexical?: string;
  AccuracyScore?: number;
  FluencyScore?: number;
  CompletenessScore?: number;
  PronScore?: number;
  Words?: AzureWord[];
}

interface AzureRecognition {
  RecognitionStatus: string;
  DisplayText?: string;
  NBest?: AzureNBest[];
}

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
  ) {}

  private sttUrl(locale: SpeechLocale) {
    return `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${locale}&format=detailed`;
  }

  async synthesize(request: SynthesisRequest): Promise<SynthesisResult> {
    const voice = VOICES[request.locale][request.gender];
    const rate = request.rate === "slow" ? "-25%" : "0%";
    const ssml = `<speak version="1.0" xml:lang="${request.locale}"><voice name="${voice}"><prosody rate="${rate}">${escapeXml(request.text)}</prosody></voice></speak>`;
    const response = await fetch(
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
    );
    if (!response.ok) throw new SpeechProviderError(`TTS failed with ${response.status}`);
    return { audio: await response.arrayBuffer(), contentType: "audio/mpeg" };
  }

  private async recognize(
    wav: ArrayBuffer,
    locale: SpeechLocale,
    assessment?: object,
  ): Promise<AzureRecognition> {
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
    const response = await fetch(this.sttUrl(locale), { method: "POST", headers, body: wav });
    if (!response.ok) throw new SpeechProviderError(`Recognition failed with ${response.status}`);
    return (await response.json()) as AzureRecognition;
  }

  async transcribe(wav: ArrayBuffer, locale: SpeechLocale): Promise<TranscriptionResult> {
    const result = await this.recognize(wav, locale);
    const status = statusOf(result.RecognitionStatus);
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
    const result = await this.recognize(wav, locale, {
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      Granularity: "Word",
      Dimension: "Comprehensive",
      EnableMiscue: "True",
    });
    const status = statusOf(result.RecognitionStatus);
    const best = result.NBest?.[0];
    if (status !== "ok" || !best) {
      return { status, transcript: null, granularity: "word", scores: null, words: [] };
    }
    return {
      status,
      transcript: best.Display ?? result.DisplayText ?? null,
      granularity: "word",
      scores: {
        accuracy: best.AccuracyScore ?? 0,
        fluency: best.FluencyScore ?? 0,
        completeness: best.CompletenessScore ?? 0,
        overall: best.PronScore ?? 0,
      },
      words: (best.Words ?? []).map((word) => ({
        word: word.Word,
        accuracy: word.AccuracyScore ?? null,
        error: WORD_ERRORS[word.ErrorType ?? "None"] ?? "none",
      })),
    };
  }
}
