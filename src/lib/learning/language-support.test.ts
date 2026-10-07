import { describe, expect, it } from "vitest";
import { explainInPortuguese, supportMode } from "./language-support";

describe("Portuguese → French support", () => {
  it("fades Portuguese as the level rises", () => {
    expect(supportMode("A0")).toBe("pt");
    expect(supportMode("A1")).toBe("pt-fr");
    expect(supportMode("A2")).toBe("fr-pt");
    expect(supportMode("B1")).toBe("fr");
    expect(supportMode("C1")).toBe("fr");
  });

  it("shifts one step with the learner's preference, within bounds", () => {
    expect(supportMode("A2", "more_portuguese")).toBe("pt-fr");
    expect(supportMode("A1", "more_french")).toBe("fr-pt");
    expect(supportMode("A0", "more_portuguese")).toBe("pt");
    expect(supportMode("B2", "more_french")).toBe("fr");
  });

  it("keeps explanations in Portuguese through A2 by default", () => {
    expect(explainInPortuguese("A2")).toBe(true);
    expect(explainInPortuguese("B1")).toBe(false);
    expect(explainInPortuguese("B1", "more_portuguese")).toBe(true);
    expect(explainInPortuguese("A2", "more_french")).toBe(false);
  });
});
