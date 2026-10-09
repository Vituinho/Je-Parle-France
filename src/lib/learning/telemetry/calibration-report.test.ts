import { expect, it } from "vitest";
import { calibrationTemplate } from "../../../../scripts/calibration-kit";
import { calibrationReport } from "./calibration-report";
it("compares speech agreement by locale and writing ordinal differences without exposing private notes or changing scores", () => {
  const template = calibrationTemplate();
  const speech = template.records[0]!;
  if (speech.kind !== "speech") throw new Error("fixture");
  speech.providerScores = {
    accuracy: 70,
    fluency: 65,
    completeness: 100,
    overall: 70,
    prosody: null,
  };
  speech.systemInterpretation = "PRIVATE INTERPRETATION";
  speech.notes = "PRIVATE NOTES";
  speech.human = { pronunciationBand: 3, intelligibilityBand: 3, agreesWithSystem: false };
  const report = calibrationReport(template);
  expect(report.speech[0]).toEqual({ locale: "fr-FR", samples: 1, agreements: 0 });
  expect(report.speech[1]?.samples).toBe(0);
  expect(report.thresholdsChanged).toBe(false);
  expect(JSON.stringify(report)).not.toContain("PRIVATE");
  expect(speech.providerScores.overall).toBe(70);
});
