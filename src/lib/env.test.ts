import { describe, expect, it } from "vitest";
import { validateServerEnv } from "./env";

const base = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://user:private-db-password@postgres.railway.internal:5432/railway",
  BETTER_AUTH_SECRET: "test-random-secret-with-at-least-32-characters",
  BETTER_AUTH_URL: "https://staging.example.test",
};

describe("staging environment validation", () => {
  it("validates independent flags and bounded numeric quotas", () => {
    expect(
      validateServerEnv({
        ...base,
        TUTOR_ENABLED: "false",
        WRITING_AI_ENABLED: "true",
        SPEECH_STT_ENABLED: "false",
      }),
    ).toMatchObject({
      TUTOR_ENABLED: false,
      WRITING_AI_ENABLED: true,
      SPEECH_STT_ENABLED: false,
      SPEECH_PRONUNCIATION_ENABLED: true,
      PILOT_ENABLED: false,
    });
    for (const change of [
      { TUTOR_ENABLED: "0" },
      { SPEECH_DAILY_MINUTES: "NaN" },
      { SPEECH_DAILY_MINUTES: "0" },
      { SPEECH_DAILY_REQUESTS: "1.5" },
      { TTS_DAILY_REQUESTS: "100001" },
    ])
      expect(() => validateServerEnv({ ...base, ...change })).toThrow("Invalid server environment");
  });
  it("defaults optional providers to mocks and keeps quotas", () => {
    expect(validateServerEnv(base)).toMatchObject({
      LLM_PROVIDER: "mock",
      SPEECH_PROVIDER: "mock",
      WRITING_DAILY_ASSESSMENTS: 10,
    });
  });
  it.each([
    undefined,
    "http://public.example.test",
    "https://staging.example.test/api/auth",
    "https://user:password@staging.example.test",
    "https://staging.example.test?x=1",
    "not-a-url",
  ])("rejects an absent or unsafe production origin: %s", (url) => {
    expect(() => validateServerEnv({ ...base, BETTER_AUTH_URL: url })).toThrow(/BETTER_AUTH_URL/);
  });
  it.each(["http://localhost:3200", "http://127.0.0.1:3200", "http://[::1]:3200"])(
    "permits loopback production tests: %s",
    (url) => {
      expect(validateServerEnv({ ...base, BETTER_AUTH_URL: url }).BETTER_AUTH_URL).toBe(url);
    },
  );
  it("rejects the example secret", () => {
    expect(() =>
      validateServerEnv({
        ...base,
        BETTER_AUTH_SECRET: "change-me-to-a-long-random-string-of-at-least-32-chars",
      }),
    ).toThrow(/Replace the example/);
  });
  it.each([{ LLM_PROVIDER: "anthropic" }, { SPEECH_PROVIDER: "azure" }])(
    "fails a selected real provider without credentials",
    (provider) => {
      expect(() => validateServerEnv({ ...base, ...provider })).toThrow(/is required|are required/);
    },
  );
  it("rejects a non-PostgreSQL URL and malformed Azure region", () => {
    expect(() => validateServerEnv({ ...base, DATABASE_URL: "https://database.test" })).toThrow(
      /PostgreSQL/,
    );
    expect(() => validateServerEnv({ ...base, DATABASE_URL: "invalid" })).toThrow(/DATABASE_URL/);
    expect(() =>
      validateServerEnv({
        ...base,
        AZURE_SPEECH_REGION: "https://eastus.api.cognitive.microsoft.com",
      }),
    ).toThrow(/region name/);
  });
  it("never includes credentials in validation errors", () => {
    try {
      validateServerEnv({
        ...base,
        BETTER_AUTH_URL: "https://user:private-secret@host.test",
        TUTOR_DAILY_TURNS: "0",
      });
    } catch (error) {
      expect(String(error)).not.toContain("private-secret");
      expect(String(error)).not.toContain("private-db-password");
      expect(String(error)).not.toContain(base.BETTER_AUTH_SECRET);
    }
  });
});
