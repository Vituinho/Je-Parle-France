import { config } from "dotenv";
import { AnthropicProvider } from "../src/lib/ai/llm/anthropic";
import { LLMUnavailableError } from "../src/lib/ai/llm/types";
import { buildTutorSystemPrompt, tutorTurnSchema } from "../src/lib/learning/tutor/tutor";

config({ quiet: true });
async function main() {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!key || !model) {
    console.error(
      "Required: ANTHROPIC_API_KEY and LLM_MODEL. npm run smoke:tutor makes one paid structured tutor call; no secrets, prompts or learner data are printed.",
    );
    process.exitCode = 1;
    return;
  }
  try {
    const provider = new AnthropicProvider(key, model);
    const result = await provider.generateObject({
      system: buildTutorSystemPrompt({
        level: "A2",
        theta: 2.5,
        destination: "canada_quebec",
        correctionMode: "important_only",
        knownVocabulary: ["bonjour", "travail"],
        weakItems: ["avoir besoin de"],
        recentMistakes: [],
      }),
      messages: [
        { role: "user", content: "Bonjour, je besoin d'aide pour trouver un travail à Montréal." },
      ],
      schema: tutorTurnSchema,
      purpose: "tutor_turn",
      maxTokens: 800,
    });
    console.log(
      JSON.stringify({
        passed: !result.simulated,
        provider: provider.id,
        structuredOutputValid: true,
        usage: result.usage,
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        passed: false,
        reason: error instanceof LLMUnavailableError ? error.reason : "smoke_failed",
      }),
    );
    process.exitCode = 1;
  }
}
void main();
