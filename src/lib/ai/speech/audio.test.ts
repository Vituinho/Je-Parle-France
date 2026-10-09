import { describe, expect, it } from "vitest";
import { encodeWav } from "@/components/activities/wav";
import { validateSpeechWav } from "./audio";

describe("short speech WAV validation", () => {
  it("rejects clips beyond the scripted pronunciation API limit", async () => {
    const wav = await encodeWav(new Float32Array(31 * 16000), 16000).arrayBuffer();
    expect(() => validateSpeechWav(wav)).toThrow("up to 30 seconds");
  });
  it("accepts the browser recorder's actual format", async () => {
    const awaited = await encodeWav(new Float32Array(1600), 16_000).arrayBuffer();
    expect(() => validateSpeechWav(awaited)).not.toThrow();
  });
  it.each([8000, 44100])("rejects an incorrect sample rate %s", async (rate) => {
    const wav = await encodeWav(new Float32Array(1600), rate).arrayBuffer();
    expect(() => validateSpeechWav(wav)).toThrow("WAV PCM");
  });
  it("rejects empty, truncated and oversized containers", async () => {
    const wav = await encodeWav(new Float32Array(1600), 16_000).arrayBuffer();
    const empty = await encodeWav(new Float32Array(0), 16_000).arrayBuffer();
    for (const invalid of [empty, wav.slice(0, -2), new ArrayBuffer(1_200_001)])
      expect(() => validateSpeechWav(invalid)).toThrow("WAV PCM");
  });
});
