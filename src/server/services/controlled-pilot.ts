import "server-only";
import { z } from "zod";
import { db } from "@/server/db";
import { serverEnv } from "@/lib/env";
import { addDays, localDate } from "@/lib/learning/time";
import { pilotObservations } from "@/lib/pilot/report";
import { PILOT_CONSENT_VERSION } from "@/lib/pilot/schema";
import { assertPilotAdmin } from "./pilot";
import { getLearningTelemetry } from "./learning-telemetry";
import { getPilotCalibrationReport } from "./pilot-assessments";
import { lockLearner } from "./skill-estimation";

const rangeSchema = z
  .strictObject({
    from: z.iso.date(),
    through: z.iso.date(),
    learner: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,100}$/)
      .optional(),
  })
  .refine(
    (r) =>
      r.from <= r.through &&
      new Date(r.through).getTime() - new Date(r.from).getTime() <= 90 * 86400000,
  );

export async function getControlledPilotReport(adminId: string, input: unknown, now = new Date()) {
  await assertPilotAdmin(adminId);
  const range = rangeSchema.parse(input);
  const date = now.toISOString().slice(0, 10);
  if (range.from < addDays(date, -90) || range.through > addDays(date, 1))
    throw new Error("Invalid pilot window");
  if (!serverEnv().PILOT_ENABLED)
    return { enabled: false, participants: [], truncated: false, range };
  const cohort = await db.pilotParticipant.findMany({
    where: range.learner ? { userId: range.learner } : {},
    orderBy: { userId: "asc" },
    take: 11,
  });
  const participants = [];
  for (const candidate of cohort.slice(0, 10)) {
    const participant = await db.$transaction(
      async (tx) => {
        await lockLearner(tx, candidate.userId);
        const member = await tx.pilotParticipant.findUniqueOrThrow({
          where: { userId: candidate.userId },
        });
        const metadata = {
          id: member.userId,
          label: `Aluno ${member.userId.slice(-8)}`,
          status: member.status,
          consentVersion: member.consentVersion,
          consentedAt: member.consentedAt,
          invitedAt: member.invitedAt,
          finishedAt: member.finishedAt,
          withdrawnAt: member.withdrawnAt,
        };
        if (
          !member.consentedAt ||
          member.consentVersion !== PILOT_CONSENT_VERSION ||
          !["active", "finished"].includes(member.status)
        )
          return { ...metadata, observation: null };
        const profile = await tx.learnerProfile.findUnique({
          where: { userId: member.userId },
          select: { timezone: true },
        });
        const timezone = profile?.timezone ?? "America/Sao_Paulo";
        const window = {
          from: member.consentedAt,
          through: new Date(Math.min(now.getTime(), member.finishedAt?.getTime() ?? now.getTime())),
        };
        const from = new Date(
          Math.max(
            window.from.getTime(),
            new Date(`${addDays(range.from, -1)}T00:00:00Z`).getTime(),
          ),
        );
        const through = new Date(
          Math.min(
            window.through.getTime(),
            new Date(`${addDays(range.through, 2)}T00:00:00Z`).getTime(),
          ),
        );
        const atRange = (at: Date) =>
          localDate(at, timezone) >= range.from && localDate(at, timezone) <= range.through;
        const createdAt = { gte: from, lte: through };
        const metrics = await getLearningTelemetry(member.userId, now, tx, range, window);
        const [events, feedback, speech, writing, estimates, calibration] = await Promise.all([
          tx.studyEvent.findMany({
            where: { userId: member.userId, createdAt },
            orderBy: [{ createdAt: "desc" }, { id: "asc" }],
            take: 5001,
            select: { type: true, payload: true, createdAt: true },
          }),
          tx.pilotFeedback.findMany({
            where: { userId: member.userId, createdAt },
            orderBy: { createdAt: "desc" },
            take: 101,
            select: { context: true, difficulty: true, createdAt: true },
          }),
          tx.speechAttempt.findMany({
            where: { userId: member.userId, createdAt },
            take: 5001,
            orderBy: [{ createdAt: "desc" }, { id: "asc" }],
            select: { locale: true, provider: true, createdAt: true },
          }),
          tx.placementResponse.findMany({
            where: { attempt: { userId: member.userId }, skill: "writing", createdAt },
            take: 5001,
            orderBy: [{ createdAt: "desc" }, { id: "asc" }],
            select: { scored: true, createdAt: true },
          }),
          tx.skillEstimate.findMany({
            where: { userId: member.userId },
            select: { skill: true, theta: true, method: true, assessed: true, sd: true },
          }),
          getPilotCalibrationReport(adminId, member.userId, now, tx, range),
        ]);
        const observations = pilotObservations({
          timezone,
          events: events.slice(0, 5000).filter((e) => atRange(e.createdAt)),
          feedback: feedback.slice(0, 100).filter((f) => atRange(f.createdAt)),
        });
        const speechRows = speech.slice(0, 5000).filter((s) => atRange(s.createdAt));
        const writingRows = writing.slice(0, 5000).filter((w) => atRange(w.createdAt));
        const timeline = [
          ...observations.timeline,
          ...calibration.samples
            .filter(
              (s) =>
                s.reviewedAt &&
                s.reviewedAt >= from &&
                s.reviewedAt <= through &&
                atRange(s.reviewedAt),
            )
            .map((s) => ({
              at: s.reviewedAt!,
              type: "pilot_calibration_reviewed",
              metadata: { kind: s.kind },
            })),
        ].sort((a, b) => b.at.getTime() - a.at.getTime());
        return {
          ...metadata,
          observation: {
            ...observations,
            timeline: timeline.slice(0, 200),
            metrics,
            sessionTotals: {
              count: metrics.sessions.length,
              completed: metrics.sessions.filter((s) => s.status === "completed").length,
              goalMinutes: metrics.sessions.reduce((n, s) => n + s.goalMinutes, 0),
              plannedSeconds: metrics.sessions.reduce((n, s) => n + s.plannedSeconds, 0),
              activeSeconds: metrics.sessions.reduce((n, s) => n + s.activeSeconds, 0),
              fatigueSessions: metrics.sessions.filter((s) => s.possibleFatigue).length,
            },
            weakSkills: estimates
              .filter((s) => s.assessed && ["objective", "ai_assessment"].includes(s.method))
              .sort((a, b) => a.theta - b.theta)
              .slice(0, 2),
            speech: ["fr-FR", "fr-CA", "unknown"].map((locale) => ({
              locale,
              attempts: speechRows.filter((s) => (s.locale ?? "unknown") === locale).length,
            })),
            writing: {
              practice: metrics.activity
                .filter((a) => a.type === "open_writing")
                .reduce((n, a) => n + a.completed, 0),
              placement: writingRows.length,
              scoredPlacement: writingRows.filter((w) => w.scored).length,
            },
            calibration,
            truncated:
              metrics.truncated ||
              events.length > 5000 ||
              feedback.length > 100 ||
              speech.length > 5000 ||
              writing.length > 5000 ||
              calibration.truncated ||
              timeline.length > 200,
          },
        };
      },
      { timeout: 30000 },
    );
    participants.push(participant);
  }
  return {
    enabled: true,
    range,
    participants,
    truncated: cohort.length > 10 || participants.some((p) => p.observation?.truncated),
  };
}
