import { describe, expect, it } from "vitest";
import { EXAMS, normalCdf, readiness } from "./exams";

describe("exam information", () => {
  it("describes all four abilities for every exam, with official https links", () => {
    for (const exam of EXAMS) {
      expect(exam.url.startsWith("https://"), exam.id).toBe(true);
      expect(new Set(exam.sections.map((s) => s.id)), exam.id).toEqual(
        new Set(["co", "ce", "eo", "ee"]),
      );
    }
  });
});

describe("readiness", () => {
  it("uses a correct normal CDF", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
  });

  it("never guesses for skills that were not measured", () => {
    expect(
      readiness({ theta: 4.5, sd: 0.3, assessed: true, method: "ai_assessment" }, "B2").probability,
    ).toBeNull();
    expect(
      readiness({ theta: 4.5, sd: 0.3, assessed: false, method: "self_report" }, "B2"),
    ).toEqual({
      band: "unmeasured",
      estimate: null,
      probability: null,
    });
  });

  it("shows self-assessments as such, without a probability", () => {
    expect(
      readiness({ theta: 2.4, sd: 0.9, assessed: true, method: "self_assessment" }, "B1"),
    ).toEqual({
      band: "self_assessed",
      estimate: "A2",
      probability: null,
    });
    expect(
      readiness({ theta: 2.4, sd: 0.9, assessed: false, method: "not_assessed" }, "B1").band,
    ).toBe("unmeasured");
  });

  it("grows with ability and shrinks with the target", () => {
    const b1 = { theta: 3.5, sd: 0.4, assessed: true, method: "objective" };
    expect(readiness(b1, "A2").band).toBe("likely");
    expect(readiness(b1, "B1").band).toBe("likely");
    expect(readiness(b1, "B2").band).toBe("far");
    const borderline = readiness(
      { theta: 3.9, sd: 0.4, assessed: true, method: "objective" },
      "B2",
    );
    expect(borderline.band).toBe("close");
    expect(borderline.estimate).toBe("B1");
  });

  it("is more cautious when the estimate is uncertain", () => {
    const sure =
      readiness({ theta: 4.3, sd: 0.2, assessed: true, method: "objective" }, "B2").probability ??
      0;
    const unsure =
      readiness({ theta: 4.3, sd: 1.2, assessed: true, method: "objective" }, "B2").probability ??
      0;
    expect(sure).toBeGreaterThan(unsure);
  });
});
