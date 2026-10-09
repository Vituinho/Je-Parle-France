import { z } from "zod";
import { getContent } from "../src/lib/content";
import { WRITING_CRITERIA } from "../src/lib/learning/writing/assessment";

const band = z.number().int().min(0).max(4);
const score = z.number().min(0).max(100);
const criteria = z.record(z.enum(WRITING_CRITERIA), band);
const common = {
  sampleId: z.string().regex(/^[a-z0-9-]{3,80}$/),
  activityId: z.string().min(1).max(100),
  recordedAt: z.iso.date(),
  reviewerId: z.string().regex(/^[a-z0-9-]{3,80}$/),
  source: z.enum(["synthetic", "consented_volunteer"]),
  notes: z.string().max(1000),
};
export const calibrationSchema = z
  .strictObject({
    version: z.literal(1),
    records: z
      .array(
        z.discriminatedUnion("kind", [
          z.strictObject({
            ...common,
            kind: z.literal("speech"),
            locale: z.enum(["fr-FR", "fr-CA"]),
            target: z.string().min(1).max(500),
            provider: z.literal("azure"),
            providerScores: z
              .strictObject({
                accuracy: score,
                fluency: score,
                completeness: score,
                overall: score,
                prosody: z.null(),
              })
              .nullable(),
            systemInterpretation: z.string().min(1).max(1000).nullable(),
            human: z
              .strictObject({
                pronunciationBand: band,
                intelligibilityBand: band,
                agreesWithSystem: z.boolean(),
              })
              .nullable(),
          }),
          z.strictObject({
            ...common,
            kind: z.literal("writing"),
            rubric: z.strictObject({
              version: z.literal(1),
              expectedLevel: z.enum(["A0", "A1", "A2", "B1", "B2", "C1", "C2"]),
              taskRequirements: z.array(z.string().min(1).max(1000)).min(2).max(6),
            }),
            model: z.string().min(1).max(100).nullable(),
            modelScores: criteria.nullable(),
            systemScore: z.number().min(0).max(1).nullable(),
            systemConfidence: z.number().min(0).max(1).nullable(),
            humanScores: criteria.nullable(),
          }),
        ]),
      )
      .min(1)
      .max(200),
  })
  .superRefine((input, ctx) => {
    if (new Set(input.records.map((record) => record.sampleId)).size !== input.records.length) {
      ctx.addIssue({
        code: "custom",
        path: ["records"],
        message: "Use unique anonymous sample IDs",
      });
    }
  });
export type Calibration = z.infer<typeof calibrationSchema>;

/** Read-only comparison. Speech provider metrics and human ordinal bands are different scales. */
export function compareCalibration(input: unknown) {
  const { records } = calibrationSchema.parse(input);
  const comparisons = records.map((record) => {
    if (record.kind === "speech") {
      const comparable = !!(record.providerScores && record.systemInterpretation && record.human);
      return {
        sampleId: record.sampleId,
        kind: record.kind,
        state: comparable ? "compared" : "pending",
        disagreement: comparable ? !record.human!.agreesWithSystem : null,
      };
    }
    const comparable = !!(record.model && record.modelScores && record.humanScores);
    const deltas = comparable
      ? Object.fromEntries(
          WRITING_CRITERIA.map((key) => [key, record.modelScores![key] - record.humanScores![key]]),
        )
      : null;
    return {
      sampleId: record.sampleId,
      kind: record.kind,
      state: comparable ? "compared" : "pending",
      modelMinusHuman: deltas,
      reviewCriteria: deltas ? WRITING_CRITERIA.filter((key) => Math.abs(deltas[key]!) >= 2) : [],
    };
  });
  return {
    version: 1,
    samples: records.length,
    compared: comparisons.filter((r) => r.state === "compared").length,
    thresholdsChanged: false,
    comparisons,
  };
}

export function calibrationTemplate(): Calibration {
  const activity = getContent().placementItems.get("pw-a2-ow")?.activity;
  if (activity?.type !== "open_writing" || !activity.rubric)
    throw new Error("Authored writing rubric missing");
  const common = {
    recordedAt: new Date().toISOString().slice(0, 10),
    reviewerId: "reviewer-01",
    source: "synthetic" as const,
    notes: "",
  };
  return calibrationSchema.parse({
    version: 1,
    records: [
      {
        ...common,
        sampleId: "speech-fr-01",
        activityId: "authored-generic-cafe",
        kind: "speech",
        locale: "fr-FR",
        target: "Bonjour, je voudrais un café, s’il vous plaît.",
        provider: "azure",
        providerScores: null,
        systemInterpretation: null,
        human: null,
      },
      {
        ...common,
        sampleId: "speech-ca-01",
        activityId: "authored-generic-cafe",
        kind: "speech",
        locale: "fr-CA",
        target: "Bonjour, je voudrais un café, s’il vous plaît.",
        provider: "azure",
        providerScores: null,
        systemInterpretation: null,
        human: null,
      },
      {
        ...common,
        sampleId: "writing-a2-01",
        activityId: activity.id,
        kind: "writing",
        rubric: activity.rubric,
        model: null,
        modelScores: null,
        systemScore: null,
        systemConfidence: null,
        humanScores: null,
      },
    ],
  });
}
