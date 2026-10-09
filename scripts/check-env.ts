import { loadEnvConfig } from "@next/env";
import { validateServerEnv } from "../src/lib/env";

// Use Next's production .env precedence. Validate before next start opens PORT.
loadEnvConfig(process.cwd(), false);
try {
  const env = validateServerEnv({ ...process.env, NODE_ENV: "production" });
  console.log(
    JSON.stringify({ configuration: "valid", llm: env.LLM_PROVIDER, speech: env.SPEECH_PROVIDER }),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Invalid server environment");
  process.exitCode = 1;
}
