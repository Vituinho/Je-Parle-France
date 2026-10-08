import { describe, expect, it } from "vitest";
import { encodeWav } from "./wav";

describe("encodeWav", () => {
  it("writes a valid 16-bit mono PCM header", async () => {
    const blob = encodeWav(new Float32Array([0, 1, -1, 0.5]), 16_000);
    const view = new DataView(await blob.arrayBuffer());
    const text = (offset: number, length: number) =>
      String.fromCharCode(...Array.from({ length }, (_, i) => view.getUint8(offset + i)));
    expect(text(0, 4)).toBe("RIFF");
    expect(text(8, 4)).toBe("WAVE");
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(8);
    expect(view.getInt16(46, true)).toBe(32767);
    expect(view.getInt16(48, true)).toBe(-32768);
  });
});
