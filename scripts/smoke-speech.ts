import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { AzureSpeechProvider } from "../src/lib/ai/speech/azure";
import { SpeechProviderError } from "../src/lib/ai/speech/types";
import { validateSpeechWav } from "../src/lib/ai/speech/audio";

config({ quiet: true });
async function main() {
  const [frPath, caPath, reference = "Bonjour, je voudrais un café, s’il vous plaît."] =
    process.argv.slice(2);
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region || !frPath || !caPath) {
    console.error(
      "Required: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION; npm run smoke:speech -- <fr-FR.wav> <fr-CA.wav> [reference text]. Two local recordings, WAV PCM16 mono 16 kHz, <=30 seconds. Makes four paid calls; prints no transcript or secrets.",
    );
    process.exitCode = 1;
  } else {
    try {
      const provider = new AzureSpeechProvider(key, region);
      // Validate BOTH files before any paid call, preventing partial-cost failures.
      const recordings = await Promise.all(
        [
          ["fr-FR", frPath],
          ["fr-CA", caPath],
        ].map(async ([locale, path]) => {
          const bytes = await readFile(path!);
          const wav = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
          validateSpeechWav(wav);
          return { locale: locale as "fr-FR" | "fr-CA", wav };
        }),
      );
      try {
        await provider.transcribe(new ArrayBuffer(16), "fr-FR");
        throw new Error("Malformed audio accepted");
      } catch (error) {
        if (!(error instanceof SpeechProviderError) || error.reason !== "malformed_audio")
          throw error;
        console.log(JSON.stringify({ preflight: "passed", malformedAudioRejectedLocally: true }));
      }
      for (const { locale, wav } of recordings) {
        const stt = await provider.transcribe(wav, locale);
        const assessment = await provider.assess(wav, reference, locale);
        const passed =
          stt.status === "ok" &&
          assessment.status === "ok" &&
          assessment.scores !== null &&
          assessment.scores.prosody === null;
        console.log(
          JSON.stringify({
            locale,
            stt: stt.status,
            pronunciation: assessment.status,
            metricsPresent: assessment.scores !== null,
            unsupportedProsodyAbsent: assessment.scores?.prosody === null,
            capabilities: provider.features(locale),
            passed,
          }),
        );
        if (!passed) process.exitCode = 1;
      }
    } catch (error) {
      console.error(
        JSON.stringify({
          passed: false,
          reason: error instanceof SpeechProviderError ? error.reason : "smoke_failed",
        }),
      );
      process.exitCode = 1;
    }
  }
}
void main();
