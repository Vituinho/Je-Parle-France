import { calibrationSchema, compareCalibration } from "../../../../scripts/calibration-kit";
import { WRITING_CRITERIA } from "../writing/assessment";

/** Existing kit remains the private record of ratings/notes; return only comparison metadata. */
export function calibrationReport(input: unknown) {
  const records = calibrationSchema.parse(input).records;
  const report = compareCalibration(input);
  const speech = ["fr-FR", "fr-CA"].map((locale) => {
    const rows = records.filter(
      (r) =>
        r.kind === "speech" &&
        r.locale === locale &&
        r.providerScores &&
        r.systemInterpretation &&
        r.human,
    );
    return {
      locale,
      samples: rows.length,
      agreements: rows.filter((r) => r.kind === "speech" && r.human?.agreesWithSystem).length,
    };
  });
  const writing = WRITING_CRITERIA.map((criterion) => {
    const rows = records.flatMap((r) =>
      r.kind === "writing" && r.model && r.modelScores && r.humanScores
        ? [r.modelScores[criterion] - r.humanScores[criterion]]
        : [],
    );
    return {
      criterion,
      samples: rows.length,
      meanDifference: rows.length ? rows.reduce((a, b) => a + b, 0) / rows.length : null,
      largeDisagreements: rows.filter((d) => Math.abs(d) >= 2).length,
    };
  });
  return { ...report, speech, writing };
}
