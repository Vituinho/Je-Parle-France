import "server-only";
import { z } from "zod";

/**
 * Server-side environment, validated once on first access.
 *
 * Optional integrations (LLM, speech, storage) fall back to development mocks
 * when their keys are missing, so the app stays fully usable offline. Each
 * consumer checks `isConfigured` helpers instead of reading process.env directly.
 */
const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    ADMIN_EMAILS: z.preprocess(emptyToUndefined, z.string().optional()).transform((value) =>
      (value ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
    LLM_PROVIDER: z.enum(["anthropic", "mock"]).default("mock"),
    ANTHROPIC_API_KEY: optionalString,
    /** Claude model for the tutor. Defaults to the current Opus; set a cheaper model to reduce cost. */
    LLM_MODEL: z.preprocess(emptyToUndefined, z.string().default("claude-opus-5-5")),
    /** Daily per-learner limits that keep a free product affordable. */
    TUTOR_DAILY_TURNS: z.coerce.number().int().positive().default(80),
    TUTOR_DAILY_REPORTS: z.coerce.number().int().positive().default(10),
    SPEECH_PROVIDER: z.enum(["azure", "mock"]).default("mock"),
    AZURE_SPEECH_KEY: optionalString,
    AZURE_SPEECH_REGION: optionalString,
  })
  .superRefine((env, ctx) => {
    if (env.LLM_PROVIDER === "anthropic" && !env.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["ANTHROPIC_API_KEY"],
        message: "ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic",
      });
    }
    if (env.SPEECH_PROVIDER === "azure" && (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION)) {
      ctx.addIssue({
        code: "custom",
        path: ["AZURE_SPEECH_KEY"],
        message: "AZURE_SPEECH_KEY and AZURE_SPEECH_REGION are required when SPEECH_PROVIDER=azure",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid server environment:\n${issues}\nSee .env.example.`);
  }
  cached = parsed.data;
  return cached;
}
