import { describe, expect, it } from "vitest";
import {
  calibrationSchema,
  calibrationTemplate,
  compareCalibration,
  type Calibration,
} from "./calibration-kit";
import { WRITING_CRITERIA } from "../src/lib/learning/writing/assessment";

describe("internal calibration comparison", () => {
  it("starts pending using the published A2 rubric, without invented scores", () => {
    const template = calibrationTemplate();
    expect(template.records[2]).toMatchObject({
      activityId: "pw-a2-ow-q",
      rubric: { expectedLevel: "A2" },
      modelScores: null,
      humanScores: null,
    });
    expect(compareCalibration(template)).toMatchObject({
      samples: 3,
      compared: 0,
      thresholdsChanged: false,
    });
  });
  it("compares all seven ordinal criteria and flags large disagreements without changing input", () => {
    const template = calibrationTemplate();
    const writing = template.records[2] as Extract<
      Calibration["records"][number],
      { kind: "writing" }
    >;
    writing.model = "recorded-model";
    writing.modelScores = Object.fromEntries(
      WRITING_CRITERIA.map((key) => [key, 3]),
    ) as NonNullable<typeof writing.modelScores>;
    writing.humanScores = { ...writing.modelScores, grammar: 1 };
    const before = JSON.stringify(template);
    expect(compareCalibration(template).comparisons[2]).toMatchObject({
      state: "compared",
      modelMinusHuman: { grammar: 2, vocabulary: 0 },
      reviewCriteria: ["grammar"],
    });
    expect(JSON.stringify(template)).toBe(before);
  });
  it("keeps human speech judgment distinct from provider percentage scores", () => {
    const template = calibrationTemplate();
    const speech = template.records[0] as Extract<
      Calibration["records"][number],
      { kind: "speech" }
    >;
    speech.providerScores = {
      accuracy: 90,
      fluency: 80,
      completeness: 100,
      overall: 88,
      prosody: null,
    };
    speech.systemInterpretation = "private feedback to reviewer";
    speech.human = { pronunciationBand: 2, intelligibilityBand: 3, agreesWithSystem: false };
    speech.notes = "private volunteer notes";
    const result = compareCalibration(template);
    expect(result.comparisons[0]).toMatchObject({ state: "compared", disagreement: true });
    expect(JSON.stringify(result)).not.toContain("private");
    expect(JSON.stringify(result)).not.toContain(speech.target);
  });
  it("rejects invalid scores, missing criteria and unknown privacy fields", () => {
    const input = calibrationTemplate();
    const speech = input.records[0] as Extract<Calibration["records"][number], { kind: "speech" }>;
    speech.providerScores = {
      accuracy: 101,
      fluency: 80,
      completeness: 100,
      overall: 88,
      prosody: null,
    };
    expect(() => calibrationSchema.parse(input)).toThrow();
    const unknown = calibrationTemplate();
    expect(() =>
      calibrationSchema.parse({ ...unknown, records: [unknown.records[0], unknown.records[0]] }),
    ).toThrow();
    expect(() => calibrationSchema.parse({ ...unknown, rawAudio: "private" })).toThrow();
    const writing = unknown.records[2] as Extract<
      Calibration["records"][number],
      { kind: "writing" }
    >;
    writing.humanScores = { grammar: 2 } as typeof writing.humanScores;
    expect(() => calibrationSchema.parse(unknown)).toThrow();
  });
});
