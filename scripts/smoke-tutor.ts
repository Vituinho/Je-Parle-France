import { config } from "dotenv";
import { AnthropicProvider } from "../src/lib/ai/llm/anthropic";
import { runTutorSmoke, TUTOR_SMOKE_CASES, type TutorSmokeCase } from "./provider-smoke";

config({ quiet: true });
async function main() {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.LLM_MODEL;
  const args = process.argv.slice(2);
  const cases: TutorSmokeCase[] =
    args.length === 0
      ? ["intermediate"]
      : args.length === 1 && args[0] === "--suite"
        ? [...TUTOR_SMOKE_CASES]
        : args.length === 2 &&
            args[0] === "--case" &&
            TUTOR_SMOKE_CASES.includes(args[1] as TutorSmokeCase)
          ? [args[1] as TutorSmokeCase]
          : [];
  if (!key || !model || cases.length === 0) {
    console.error(
      JSON.stringify({
        stage: "preflight",
        passed: false,
        reason: !key || !model ? "missing_credentials_or_model" : "invalid_arguments",
        instruction:
          "Set ANTHROPIC_API_KEY and LLM_MODEL. Use no arguments (one call), --case beginner|intermediate|correction|roleplay|writing, or --suite (five paid calls).",
      }),
    );
    process.exitCode = 1;
    return;
  }
  try {
    const provider = new AnthropicProvider(key, model);
    for (const kind of cases) {
      const result = await runTutorSmoke(provider, kind);
      console.log(JSON.stringify(result));
      if (!result.passed) {
        process.exitCode = 1;
        break;
      } // Never buy the rest of a failing suite.
    }
  } catch {
    console.error(
      JSON.stringify({
        passed: false,
        reason: "smoke_failed",
      }),
    );
    process.exitCode = 1;
  }
}
void main();
