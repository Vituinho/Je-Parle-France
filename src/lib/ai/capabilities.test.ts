import { describe, expect, it, vi } from "vitest";
const env = vi.hoisted(() => ({
  SPEECH_PROVIDER: "azure",
  LLM_PROVIDER: "anthropic",
  SPEECH_STT_ENABLED: false,
  SPEECH_PRONUNCIATION_ENABLED: true,
  SPEECH_TTS_ENABLED: false,
  WRITING_AI_ENABLED: false,
}));
vi.mock("@/lib/env", () => ({ serverEnv: () => env }));
import { getCapabilities, publicCapabilities } from "./capabilities";
describe("published provider capabilities", () => {
  it("matches independent server switches without disclosing credentials", () => {
    expect(getCapabilities()).toEqual({
      speechRecognition: false,
      pronunciationAssessment: true,
      serverTts: false,
      llm: false,
    });
    expect(publicCapabilities()).toEqual({
      speechRecognition: false,
      pronunciation: true,
      serverTts: false,
    });
  });
});
