import "server-only";
import { z } from "zod";

/**
 * Server-side environment, validated once on first access.
 *
 * Optional integrations default to labelled mocks. Explicitly selecting a real
 * provider requires its credentials; configuration mistakes never become mocks.
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
    LLM_PROVIDER: z.enum(["anthropic", "mock"]).default("mock"),
    ANTHROPIC_API_KEY: optionalString,
    /** Claude model for the tutor. Defaults to the current Opus; set a cheaper model to reduce cost. */
    LLM_MODEL: z.preprocess(emptyToUndefined, z.string().default("claude-opus-5-5")),
    /** Daily per-learner limits that keep a free product affordable. */
    TUTOR_DAILY_TURNS: z.coerce.number().int().positive().default(80),
    TUTOR_DAILY_REPORTS: z.coerce.number().int().positive().default(10),
    WRITING_DAILY_ASSESSMENTS: z.coerce.number().int().positive().default(10),
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
    if (
      URL.canParse(env.DATABASE_URL) &&
      !/^postgres(ql)?:$/.test(new URL(env.DATABASE_URL).protocol)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "Use a PostgreSQL connection URL",
      });
    }
    if (env.AZURE_SPEECH_REGION && !/^[a-z0-9-]+$/.test(env.AZURE_SPEECH_REGION)) {
      ctx.addIssue({
        code: "custom",
        path: ["AZURE_SPEECH_REGION"],
        message: "Use an Azure region name, not an endpoint URL",
      });
    }
    if (env.NODE_ENV === "production") {
      if (!env.BETTER_AUTH_URL) {
        ctx.addIssue({
          code: "custom",
          path: ["BETTER_AUTH_URL"],
          message: "Required in production",
        });
      }
      if (/change-me|placeholder|example-secret/i.test(env.BETTER_AUTH_SECRET)) {
        ctx.addIssue({
          code: "custom",
          path: ["BETTER_AUTH_SECRET"],
          message: "Replace the example with a randomly generated secret",
        });
      }
    }
    if (env.BETTER_AUTH_URL && URL.canParse(env.BETTER_AUTH_URL)) {
      const url = new URL(env.BETTER_AUTH_URL);
      const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      if (
        (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["BETTER_AUTH_URL"],
          message:
            "Use the HTTPS public origin without a path (HTTP allowed only on loopback for local tests)",
        });
      }
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function validateServerEnv(input: Record<string, string | undefined>): ServerEnv {
  const parsed = serverEnvSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid server environment:\n${issues}\nSee .env.example.`);
  }
  return parsed.data;
}

export function serverEnv(): ServerEnv {
  cached ??= validateServerEnv(process.env);
  return cached;
}
