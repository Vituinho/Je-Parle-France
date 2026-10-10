import { describe, expect, it, vi } from "vitest";
import type { LLMProvider } from "../src/lib/ai/llm/types";
import { LLMUnavailableError } from "../src/lib/ai/llm/types";
import { AzureSpeechProvider } from "../src/lib/ai/speech/azure";
import {
  TUTOR_SMOKE_CASES,
  runTutorSmoke,
  tutorSmokeRequest,
  runSpeechSmoke,
} from "./provider-smoke";

function wav(durationMs = 500) {
  const size = Math.round(durationMs * 32),
    buffer = new ArrayBuffer(44 + size),
    view = new DataView(buffer);
  const text = (at: number, s: string) =>
    [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + size, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, size, true);
  return buffer;
}
describe("bounded synthetic provider smokes", () => {
  it("covers all requested tutor cases with a small educational context", () => {
    for (const kind of TUTOR_SMOKE_CASES) {
      const request = tutorSmokeRequest(kind);
      expect(
        request.system.length + request.messages.reduce((n, m) => n + m.content.length, 0),
      ).toBeLessThan(12_000);
      expect(request.maxTokens).toBeLessThanOrEqual(2200);
      expect(JSON.stringify(request)).not.toMatch(/email|userId|password/);
    }
    expect(tutorSmokeRequest("writing").purpose).toBe("writing_feedback");
  });
  it("reports latency/schema/units without returning the model reply", async () => {
    const provider = {
      id: "anthropic",
      simulated: false,
      generateObject: vi.fn().mockResolvedValue({
        object: { reply: "PRIVATE REPLY", corrections: [] },
        model: "test",
        simulated: false,
        usage: { inputTokens: 10, outputTokens: 5 },
      }),
    } as unknown as LLMProvider;
    const result = await runTutorSmoke(provider, "beginner");
    expect(result).toMatchObject({
      passed: true,
      structuredOutputValid: true,
      usage: { inputTokens: 10, outputTokens: 5 },
    });
    expect(JSON.stringify(result)).not.toContain("PRIVATE REPLY");
    expect(provider.generateObject).toHaveBeenCalledOnce();
  });
  it("refuses malformed/model-simulated results and redacts failures", async () => {
    const call = vi
      .fn()
      .mockResolvedValueOnce({ object: {}, simulated: false, usage: {} })
      .mockRejectedValueOnce(new LLMUnavailableError("PRIVATE BODY", "rate_limited"));
    const provider = {
      id: "anthropic",
      simulated: false,
      generateObject: call,
    } as unknown as LLMProvider;
    expect(await runTutorSmoke(provider, "correction")).toMatchObject({
      passed: false,
      structuredOutputValid: false,
    });
    const result = await runTutorSmoke(provider, "roleplay");
    expect(result).toMatchObject({ passed: false, reason: "rate_limited" });
    expect(JSON.stringify(result)).not.toContain("PRIVATE BODY");
  });
  it("handles silence/short audio per locale without inventing metrics", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async () =>
        Response.json({ RecognitionStatus: "InitialSilenceTimeout" }),
      );
    vi.stubGlobal("fetch", fetchMock);
    try {
      const provider = new AzureSpeechProvider("key", "canadacentral");
      for (const locale of ["fr-FR", "fr-CA"] as const) {
        const results = await runSpeechSmoke(provider, wav(), locale, "Bonjour.", "silence");
        expect(results).toHaveLength(2);
        expect(results.every((r) => r.passed && r.scoresReturned.length === 0)).toBe(true);
        expect(results[0]?.capabilities.prosody).toBe(false);
      }
      const short = await runSpeechSmoke(provider, wav(100), "fr-FR", "Bonjour.", "short");
      expect(short[0]).toMatchObject({
        passed: true,
        audioMs: 100,
        warnings: ["short_audio_not_quality_validation"],
      });
      await expect(
        runSpeechSmoke(provider, new ArrayBuffer(4), "fr-FR", "Bonjour."),
      ).rejects.toMatchObject({ reason: "malformed_audio" });
      expect(fetchMock).toHaveBeenCalledTimes(6);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
