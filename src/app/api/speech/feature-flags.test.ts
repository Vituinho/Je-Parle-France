import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ stt: true, pronunciation: true, tts: true, user: "owner" }));
vi.mock("@/lib/env", () => ({
  serverEnv: () => ({
    SPEECH_STT_ENABLED: mocks.stt,
    SPEECH_PRONUNCIATION_ENABLED: mocks.pronunciation,
    SPEECH_TTS_ENABLED: mocks.tts,
  }),
}));
vi.mock("@/server/session", () => ({
  getCurrentUser: async () => (mocks.user ? { id: mocks.user } : null),
}));
vi.mock("@/lib/ai/speech", () => ({
  getSpeech: () => ({}),
  SpeechProviderError: class extends Error {},
}));
vi.mock("@/server/quota", () => ({
  throttle: () => true,
  consumeQuota: vi.fn(),
  QuotaError: class extends Error {},
}));
import { POST as assess } from "./assess/route";
import { POST as transcribe } from "./transcribe/route";
import { GET as tts } from "../tts/route";
beforeEach(() => {
  mocks.stt = true;
  mocks.pronunciation = true;
  mocks.tts = true;
  mocks.user = "owner";
});
describe("independent speech switches", () => {
  it("disables only selected entry points before processing audio", async () => {
    mocks.pronunciation = false;
    expect((await assess(new Request("http://localhost"))).status).toBe(501);
    expect(
      (await transcribe(new Request("http://localhost", { method: "POST", body: "bad" }))).status,
    ).toBe(400);
    mocks.stt = false;
    expect((await transcribe(new Request("http://localhost"))).status).toBe(501);
    mocks.tts = false;
    expect((await tts(new Request("http://localhost"))).status).toBe(501);
  });
  it("requires a session even when a resource is disabled", async () => {
    mocks.user = "";
    mocks.stt = false;
    expect((await transcribe(new Request("http://localhost"))).status).toBe(401);
  });
});
