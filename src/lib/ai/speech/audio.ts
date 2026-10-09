import { SpeechProviderError } from "./types";

/** Validate the actual container, not a caller-supplied MIME type. No audio is retained. */
export function validateSpeechWav(buffer: ArrayBuffer): number {
  const fail = () => {
    throw new SpeechProviderError(
      "Use WAV PCM 16-bit mono at 16 kHz, up to 30 seconds.",
      "malformed_audio",
    );
  };
  if (buffer.byteLength < 44 || buffer.byteLength > 1_200_000) fail();
  const view = new DataView(buffer);
  const tag = (offset: number) => String.fromCharCode(...new Uint8Array(buffer, offset, 4));
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE" || view.getUint32(4, true) !== buffer.byteLength - 8)
    fail();
  let format = false;
  let data = false;
  let durationMs = 0;
  let offset = 12;
  while (offset + 8 <= buffer.byteLength) {
    const name = tag(offset);
    const size = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (start + size > buffer.byteLength) fail();
    if (name === "fmt ") {
      if (format || size < 16) fail();
      format =
        view.getUint16(start, true) === 1 &&
        view.getUint16(start + 2, true) === 1 &&
        view.getUint32(start + 4, true) === 16_000 &&
        view.getUint32(start + 8, true) === 32_000 &&
        view.getUint16(start + 12, true) === 2 &&
        view.getUint16(start + 14, true) === 16;
      if (!format) fail();
    }
    if (name === "data") {
      // Scripted pronunciation assessment beyond 30 s needs the continuous API.
      if (data || !format || size === 0 || size % 2 !== 0 || size > 30 * 32_000) fail();
      data = true;
      durationMs = Math.round(size / 32);
    }
    offset = start + size + (size % 2);
  }
  if (!format || !data || offset !== buffer.byteLength) fail();
  return durationMs;
}
