import "server-only";
import { z } from "zod";
import { CEFR_LEVELS } from "@/lib/learning/cefr";
import { SKILLS } from "@/lib/learning/skills";
import { STUDY_PACES, studyPace } from "@/lib/learning/study-pace";
import type { SessionPlan } from "@/lib/learning/planner/planner";
import { learningEventSchema } from "@/lib/learning/telemetry/events";
import { addDays } from "@/lib/learning/time";
import { db } from "@/server/db";
import { getLearningTelemetry } from "./learning-telemetry";
import { calibrationReport } from "@/lib/learning/telemetry/calibration-report";

export class PilotAuthorizationError extends Error {}
export async function assertPilotAdmin(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "admin") throw new PilotAuthorizationError("Admin authorization required");
}
const filtersSchema = z
  .strictObject({
    from: z.iso.date(),
    through: z.iso.date(),
    pace: z.enum(STUDY_PACES).optional(),
    level: z.enum(CEFR_LEVELS).optional(),
    skill: z.enum(SKILLS).optional(),
    learner: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,100}$/)
      .optional(),
  })
  .refine(
    (f) =>
      f.from <= f.through &&
      new Date(f.through).getTime() - new Date(f.from).getTime() <= 90 * 86400000,
  );
export type PilotFilters = z.infer<typeof filtersSchema>;
export async function getPilotReport(adminId: string, input: unknown, now = new Date()) {
  await assertPilotAdmin(adminId);
  const filters = filtersSchema.parse(input);
  if (
    filters.from < addDays(now.toISOString().slice(0, 10), -90) ||
    filters.through > addDays(now.toISOString().slice(0, 10), 1)
  )
    throw new Error("Date range outside pilot window");
  const candidates = await db.dailySession.findMany({
    where: {
      ...(filters.learner ? { userId: filters.learner } : {}),
      localDate: { gte: filters.from, lte: filters.through },
    },
    orderBy: [{ localDate: "desc" }, { id: "asc" }],
    take: 201,
  });
  const matchedPace = candidates
    .slice(0, 200)
    .filter(
      (s) =>
        !filters.pace ||
        studyPace((s.plan as unknown as SessionPlan).pace, s.plannedMinutes) === filters.pace,
    );
  // Difficulty and skill scope refer to observed tasks; unmeasured sessions are kept with date/pace alone.
  const attempts =
    filters.level || filters.skill
      ? await db.activityAttempt.findMany({
          where: {
            sessionId: { in: matchedPace.map((s) => s.id) },
            ...(filters.level ? { level: filters.level } : {}),
          },
          take: 5001,
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          select: { sessionId: true, activityId: true, userId: true },
        })
      : [];
  const evidence = filters.skill
    ? await db.skillEvidence.findMany({
        where: {
          userId: { in: [...new Set(matchedPace.map((s) => s.userId))] },
          skill: filters.skill,
          occurredAt: {
            gte: new Date(`${addDays(filters.from, -1)}T00:00:00Z`),
            lte: new Date(`${addDays(filters.through, 2)}T00:00:00Z`),
          },
        },
        take: 5001,
        orderBy: [{ occurredAt: "desc" }, { id: "asc" }],
        select: { taskId: true, userId: true },
      })
    : [];
  const allowedTasks = new Set(evidence.map((e) => `${e.userId}:${e.taskId}`));
  const matchIds = new Set(
    attempts
      .filter(
        (a) =>
          !filters.skill ||
          matchedPace.some(
            (s) =>
              s.id === a.sessionId &&
              a.userId === s.userId &&
              allowedTasks.has(`${s.userId}:${a.activityId}`),
          ),
      )
      .map((a) => a.sessionId),
  );
  const matched = matchedPace.filter(
    (s) => (!filters.level && !filters.skill) || matchIds.has(s.id),
  );
  const ids = [...new Set(matched.map((s) => s.userId))];
  if (filters.learner && !ids.includes(filters.learner)) ids.unshift(filters.learner);
  const learners = [];
  // Ten profiles maximum; each read stays bounded. No profile names/emails are queried.
  for (const userId of ids.slice(0, 10)) {
    const metrics = await getLearningTelemetry(userId, now, db, filters);
    learners.push({
      id: userId,
      label: `Aluno ${userId.slice(-8)}`,
      sessions: metrics.sessions.filter((s) => matched.some((row) => row.id === s.id)),
      activity: metrics.activity.filter((a) => !filters.level || a.level === filters.level),
      skills: metrics.skills.filter((s) => !filters.skill || s.skill === filters.skill),
      retention: metrics.retention,
      provider: metrics.provider,
      skillChanges: metrics.skillChanges.filter((c) => !filters.skill || c.skill === filters.skill),
      truncated: metrics.truncated,
    });
  }
  const timeline = filters.learner
    ? await db.studyEvent.findMany({
        where: {
          userId: filters.learner,
          createdAt: {
            gte: new Date(`${filters.from}T00:00:00Z`),
            lt: new Date(`${addDays(filters.through, 1)}T00:00:00Z`),
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: 201,
        select: { type: true, payload: true, createdAt: true },
      })
    : [];
  return {
    filters,
    learners,
    truncated:
      candidates.length > 200 ||
      ids.length > 10 ||
      attempts.length > 5000 ||
      evidence.length > 5000 ||
      timeline.length > 200 ||
      learners.some((l) => l.truncated),
    timeline: timeline.slice(0, 200).map((row) => {
      const parsed = learningEventSchema.safeParse({ type: row.type, payload: row.payload });
      // Legacy events are deliberately represented by type/date alone, never arbitrary JSON.
      return {
        at: row.createdAt,
        type: /^[a-z_]{1,60}$/.test(row.type) ? row.type : "legacy",
        metadata: parsed.success ? parsed.data.payload : null,
      };
    }),
  };
}
export async function comparePilotCalibration(adminId: string, input: unknown) {
  await assertPilotAdmin(adminId);
  return calibrationReport(input);
}
