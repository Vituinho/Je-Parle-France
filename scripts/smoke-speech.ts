import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { AzureSpeechProvider } from "../src/lib/ai/speech/azure";
import { SpeechProviderError } from "../src/lib/ai/speech/types";
import { validateSpeechWav } from "../src/lib/ai/speech/audio";
import { runSpeechSmoke, type SpeechSmokeCase } from "./provider-smoke";

config({ quiet: true });
async function main() {
  const args = process.argv.slice(2);
  const caseIndex = args.indexOf("--case");
  const kind = (caseIndex === -1 ? "speech" : args[caseIndex + 1]) as SpeechSmokeCase;
  if (caseIndex !== -1) args.splice(caseIndex, 2);
  const [frPath, caPath, reference = "Bonjour, je voudrais un café, s’il vous plaît."] = args;
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (
    !key ||
    !region ||
    !frPath ||
    !caPath ||
    args.length > 3 ||
    !["speech", "silence", "short"].includes(kind)
  ) {
    console.error(
      JSON.stringify({
        stage: "preflight",
        passed: false,
        reason: !key || !region ? "missing_credentials" : "invalid_arguments",
        instruction:
          "Set AZURE_SPEECH_KEY/REGION; pass two PCM16 mono 16kHz WAV files <=30 seconds, optional generic reference and --case speech|silence|short. Up to four paid calls.",
      }),
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
          const duration = validateSpeechWav(wav);
          if (
            (kind === "short" && duration >= 1000) ||
            reference.trim().length < 1 ||
            reference.length > 300
          )
            throw new Error("Invalid fixture or reference");
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
        const results = await runSpeechSmoke(provider, wav, locale, reference, kind);
        results.forEach((result) => console.log(JSON.stringify(result)));
        if (results.some((r) => !r.passed)) {
          process.exitCode = 1;
          break;
        }
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
