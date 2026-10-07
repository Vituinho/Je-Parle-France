import { describe, expect, it } from "vitest";
import { describeTheta, levelMidpoint, readTheta, shortLevelLabel } from "./cefr";

describe("CEFR scale", () => {
  it("maps abilities to level bands", () => {
    expect(readTheta(0.2).level).toBe("A0");
    expect(readTheta(1).level).toBe("A1");
    expect(readTheta(2.99).level).toBe("A2");
    expect(readTheta(5.5).level).toBe("C1");
  });

  it("clamps below zero and flags abilities above the ceiling", () => {
    expect(readTheta(-3)).toMatchObject({ level: "A0", aboveCeiling: false, progress: 0 });
    expect(readTheta(6.4)).toMatchObject({ level: "C1", aboveCeiling: true, progress: 1 });
  });

  it("describes position inside the band in Portuguese", () => {
    expect(describeTheta(2.1)).toBe("A2 inicial");
    expect(describeTheta(2.5)).toBe("A2");
    expect(describeTheta(2.85)).toBe("A2 forte · entrando no B1");
    expect(describeTheta(0.1)).toBe("A0 · iniciante");
    expect(describeTheta(5.9)).toBe("C1 forte");
    expect(describeTheta(6.2)).toBe("C1+");
  });

  it("gives compact labels and band midpoints", () => {
    expect(shortLevelLabel(3.9)).toBe("B1+");
    expect(shortLevelLabel(3.5)).toBe("B1");
    expect(levelMidpoint("A2")).toBe(2.5);
  });
});
