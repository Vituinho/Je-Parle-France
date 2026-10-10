import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { getContent } from "@/lib/content";
import { serverEnv } from "@/lib/env";
import { CEFR_LEVELS } from "@/lib/learning/cefr";
import { writingJudgmentSchema, WRITING_CRITERIA } from "@/lib/learning/writing/assessment";
import { calibrationReport } from "@/lib/learning/telemetry/calibration-report";
import { calibrationSchema, type Calibration } from "../../../scripts/calibration-kit";
import { db } from "@/server/db";
import { assertPilotAdmin } from "./pilot";
import { requirePilotConsent, PilotParticipationError } from "./pilot-participation";
import { lockLearner } from "./skill-estimation";

export const assessmentSourceSchema = z.strictObject({
  kind: z.enum(["speech", "writing_practice", "writing_placement"]),
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
});
const band = z.number().int().min(0).max(4);
export const humanReviewSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("speech"),
    pronunciationBand: band,
    intelligibilityBand: band,
    agreesWithSystem: z.boolean(),
    heardConsentedSample: z.literal(true),
    notes: z.string().trim().max(500),
  }),
  z.strictObject({
    kind: z.literal("writing"),
    scores: z.record(z.enum(WRITING_CRITERIA), band),
    notes: z.string().trim().max(500),
  }),
]);
const writingSchema = z.object({
  version: z.literal(1),
  method: z.literal("ai_assessment"),
  original: z.string().max(2000),
  expectedLevel: z.enum(CEFR_LEVELS),
  criteria: writingJudgmentSchema.shape.criteria,
  confidence: z.number().min(0).max(1),
  score: z.number().min(0).max(1),
  model: z.string().min(1).max(100),
});
const speechSchema = z.object({
  status: z.literal("ok"),
  scores: z.object({
    accuracy: z.number().min(0).max(100),
    fluency: z.number().min(0).max(100),
    completeness: z.number().min(0).max(100),
    overall: z.number().min(0).max(100),
    prosody: z.null(),
  }),
});

function ensureWritesEnabled() {
  if (!serverEnv().PILOT_ENABLED)
    throw new PilotParticipationError("O piloto está pausado; nenhuma revisão foi gravada.");
}
async function assessmentWindow(tx: Prisma.TransactionClient, userId: string, now: Date) {
  const participant = await requirePilotConsent(tx, userId, true);
  return {
    gte: new Date(Math.max(participant.consentedAt!.getTime(), now.getTime() - 90 * 86400000)),
    lte: participant.finishedAt ?? now,
  };
}

/** Metadata-only inventory; selected source text is read only by the explicit preview below. */
export async function listPilotAssessments(adminId: string, userId: string, now = new Date()) {
  await assertPilotAdmin(adminId);
  return db.$transaction(async (tx) => {
    await lockLearner(tx, userId);
    const createdAt = await assessmentWindow(tx, userId, now);
    const [speech, practice, placement] = await Promise.all([
      tx.speechAttempt.findMany({
        where: {
          userId,
          provider: "azure",
          locale: { in: ["fr-FR", "fr-CA"] },
          createdAt,
          scores: { path: ["status"], equals: "ok" },
        },
        orderBy: { createdAt: "desc" },
        take: 26,
        select: { id: true, activityId: true, locale: true, createdAt: true },
      }),
      tx.activityAttempt.findMany({
        where: {
          userId,
          createdAt,
          type: "open_writing",
          response: { path: ["writingAssessment", "method"], equals: "ai_assessment" },
        },
        orderBy: { createdAt: "desc" },
        take: 26,
        select: { id: true, activityId: true, createdAt: true },
      }),
      tx.placementResponse.findMany({
        where: {
          attempt: { userId },
          createdAt,
          answer: { path: ["writingAssessment", "method"], equals: "ai_assessment" },
        },
        orderBy: { createdAt: "desc" },
        take: 26,
        select: { id: true, itemId: true, createdAt: true },
      }),
    ]);
    return {
      truncated: [speech, practice, placement].some((rows) => rows.length > 25),
      sources: [
        ...speech.slice(0, 25).map((r) => ({
          kind: "speech" as const,
          id: r.id,
          activityId: r.activityId ?? "speech-free-practice",
          locale: r.locale,
          at: r.createdAt,
        })),
        ...practice.slice(0, 25).map((r) => ({
          kind: "writing_practice" as const,
          id: r.id,
          activityId: r.activityId,
          locale: null,
          at: r.createdAt,
        })),
        ...placement.slice(0, 25).map((r) => ({
          kind: "writing_placement" as const,
          id: r.id,
          activityId: r.itemId,
          locale: null,
          at: r.createdAt,
        })),
      ],
    };
  });
}

async function selectedAssessment(
  tx: Prisma.TransactionClient,
  userId: string,
  source: z.infer<typeof assessmentSourceSchema>,
  now: Date,
) {
  const createdAt = await assessmentWindow(tx, userId, now);
  const common = {
    sampleId: `sample-${randomUUID()}`,
    reviewerId: "pending-admin",
    source: "consented_volunteer" as const,
    notes: "",
  };
  if (source.kind === "speech") {
    const row = await tx.speechAttempt.findFirst({
      where: {
        id: source.id,
        userId,
        createdAt,
        provider: "azure",
        locale: { in: ["fr-FR", "fr-CA"] },
      },
    });
    if (!row) throw new PilotParticipationError("Avaliação de fala consentida não encontrada.");
    const scores = speechSchema.parse(row.scores).scores;
    const record = {
      ...common,
      kind: "speech" as const,
      activityId: row.activityId ?? "speech-free-practice",
      recordedAt: row.createdAt.toISOString().slice(0, 10),
      locale: row.locale,
      target: "Referência mantida apenas na avaliação original",
      provider: "azure" as const,
      providerScores: scores,
      systemInterpretation: `Pronúncia: ${Math.round(scores.overall)}/100; precisão: ${Math.round(scores.accuracy)}/100; fluência: ${Math.round(scores.fluency)}/100; completude: ${Math.round(scores.completeness)}/100.`,
      human: null,
    };
    return {
      record: calibrationSchema.parse({ version: 1, records: [record] }).records[0]!,
      sourceText: row.targetText,
      transcript: null,
      audioAvailable: false,
    };
  }
  let activityId: string, body: unknown, at: Date;
  if (source.kind === "writing_practice") {
    const row = await tx.activityAttempt.findFirst({
      where: { id: source.id, userId, createdAt, type: "open_writing" },
      select: { activityId: true, response: true, createdAt: true },
    });
    if (!row) throw new PilotParticipationError("Avaliação de escrita consentida não encontrada.");
    activityId = row.activityId;
    body = row.response;
    at = row.createdAt;
  } else {
    const row = await tx.placementResponse.findFirst({
      where: { id: source.id, attempt: { userId }, createdAt },
      select: { itemId: true, answer: true, createdAt: true },
    });
    if (!row) throw new PilotParticipationError("Avaliação de escrita consentida não encontrada.");
    activityId = row.itemId;
    body = row.answer;
    at = row.createdAt;
  }
  const assessment = z.object({ writingAssessment: writingSchema }).parse(body).writingAssessment;
  const content = getContent();
  const activity =
    content.activities.get(activityId)?.activity ??
    content.placementItems.get(activityId)?.activity;
  if (
    activity?.type !== "open_writing" ||
    !activity.rubric ||
    activity.rubric.expectedLevel !== assessment.expectedLevel
  )
    throw new PilotParticipationError(
      "Rubrica original indisponível; use o kit privado para revisão histórica.",
    );
  const record = {
    ...common,
    kind: "writing" as const,
    activityId: activity.id,
    recordedAt: at.toISOString().slice(0, 10),
    rubric: activity.rubric,
    model: assessment.model,
    modelScores: Object.fromEntries(WRITING_CRITERIA.map((c) => [c, assessment.criteria[c].band])),
    systemScore: assessment.score,
    systemConfidence: assessment.confidence,
    humanScores: null,
  };
  return {
    record: calibrationSchema.parse({ version: 1, records: [record] }).records[0]!,
    sourceText: assessment.original,
    transcript: null,
    audioAvailable: false,
  };
}

export async function previewPilotAssessment(
  adminId: string,
  userId: string,
  input: unknown,
  now = new Date(),
) {
  await assertPilotAdmin(adminId);
  const source = assessmentSourceSchema.parse(input);
  return db.$transaction(async (tx) => {
    await lockLearner(tx, userId);
    return selectedAssessment(tx, userId, source, now);
  });
}
/** Explicit selection is the only admin view returning consented writing and private review notes. */
export async function getPilotCalibrationDetail(
  adminId: string,
  userId: string,
  sampleId: string,
  now = new Date(),
) {
  await assertPilotAdmin(adminId);
  return db.$transaction(async (tx) => {
    await lockLearner(tx, userId);
    await requirePilotConsent(tx, userId, true);
    const row = await tx.pilotCalibration.findFirst({
      where: { id: sampleId, userId, createdAt: { gte: new Date(now.getTime() - 90 * 86400000) } },
      select: { id: true, sourceKind: true, sourceId: true, record: true },
    });
    if (!row) throw new PilotParticipationError("Amostra deste participante não encontrada.");
    const record = calibrationSchema.parse({ version: 1, records: [row.record] }).records[0]!;
    const source = assessmentSourceSchema.parse({ kind: row.sourceKind, id: row.sourceId });
    const preview = await selectedAssessment(tx, userId, source, now);
    return { id: row.id, record, sourceText: preview.sourceText, audioAvailable: false };
  });
}
export async function addPilotCalibrationSample(
  adminId: string,
  userId: string,
  input: unknown,
  now = new Date(),
) {
  await assertPilotAdmin(adminId);
  ensureWritesEnabled();
  const source = assessmentSourceSchema.parse(input);
  return db.$transaction(async (tx) => {
    await lockLearner(tx, userId);
    await requirePilotConsent(tx, userId, true);
    const unique = { userId, sourceKind: source.kind, sourceId: source.id };
    const existing = await tx.pilotCalibration.findUnique({
      where: { userId_sourceKind_sourceId: unique },
    });
    if (existing) return { id: existing.id, reviewed: !!existing.reviewedAt };
    if ((await tx.pilotCalibration.count({ where: { userId } })) >= 200)
      throw new PilotParticipationError(
        "Limite de 200 amostras por participante; revise as existentes.",
      );
    const selected = await selectedAssessment(tx, userId, source, now);
    const row = await tx.pilotCalibration.create({
      data: {
        ...unique,
        record: selected.record as unknown as Prisma.InputJsonValue,
        createdAt: now,
      },
      select: { id: true },
    });
    return { ...row, reviewed: false };
  });
}
export async function savePilotHumanReview(
  adminId: string,
  userId: string,
  sampleId: string,
  input: unknown,
  now = new Date(),
) {
  await assertPilotAdmin(adminId);
  ensureWritesEnabled();
  const human = humanReviewSchema.parse(input);
  return db.$transaction(async (tx) => {
    await lockLearner(tx, userId);
    await requirePilotConsent(tx, userId, true);
    const row = await tx.pilotCalibration.findFirst({
      where: { id: sampleId, userId, createdAt: { gte: new Date(now.getTime() - 90 * 86400000) } },
    });
    if (!row) throw new PilotParticipationError("Amostra deste participante não encontrada.");
    const record = calibrationSchema.parse({ version: 1, records: [row.record] }).records[0]!;
    if (record.kind !== human.kind)
      throw new PilotParticipationError("Tipo de revisão incompatível.");
    const updated =
      record.kind === "speech" && human.kind === "speech"
        ? {
            ...record,
            reviewerId: "verified-admin",
            notes: human.notes,
            human: {
              pronunciationBand: human.pronunciationBand,
              intelligibilityBand: human.intelligibilityBand,
              agreesWithSystem: human.agreesWithSystem,
            },
          }
        : record.kind === "writing" && human.kind === "writing"
          ? {
              ...record,
              reviewerId: "verified-admin",
              notes: human.notes,
              humanScores: human.scores,
            }
          : record;
    const parsed = calibrationSchema.parse({ version: 1, records: [updated] });
    await tx.pilotCalibration.update({
      where: { id: row.id },
      data: {
        record: parsed.records[0] as unknown as Prisma.InputJsonValue,
        reviewerId: adminId,
        reviewedAt: now,
      },
    });
    return calibrationReport(parsed);
  });
}
export async function getPilotCalibrationReport(adminId: string, userId: string, now = new Date()) {
  await assertPilotAdmin(adminId);
  await requirePilotConsent(db, userId, true);
  const rows = await db.pilotCalibration.findMany({
    where: { userId, createdAt: { gte: new Date(now.getTime() - 90 * 86400000) } },
    orderBy: { createdAt: "desc" },
    take: 201,
    select: {
      id: true,
      sourceKind: true,
      sourceId: true,
      record: true,
      reviewedAt: true,
      createdAt: true,
    },
  });
  const records: Calibration["records"] = rows.slice(0, 200).flatMap((r) => {
    const parsed = calibrationSchema.safeParse({ version: 1, records: [r.record] });
    return parsed.success ? parsed.data.records : [];
  });
  return {
    truncated: rows.length > 200 || records.length < Math.min(rows.length, 200),
    samples: rows.slice(0, 200).map(({ record, ...row }) => {
      const parsed = calibrationSchema.safeParse({ version: 1, records: [record] });
      return { ...row, kind: parsed.success ? parsed.data.records[0]!.kind : "unknown" };
    }),
    report: records.length
      ? calibrationReport({ version: 1, records })
      : {
          samples: 0,
          compared: 0,
          thresholdsChanged: false,
          speech: [],
          writing: [],
          comparisons: [],
        },
  };
}
