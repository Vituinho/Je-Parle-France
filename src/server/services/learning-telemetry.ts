import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { SessionPlan } from "@/lib/learning/planner/planner";
import { evidenceSchema } from "@/lib/learning/skill-estimation/estimate";
import { learningMetrics } from "@/lib/learning/telemetry/metrics";
import { addDays, localDate } from "@/lib/learning/time";
import { db } from "@/server/db";

/** Bounded, metadata-only reads. Never select responses, transcripts, recordings or profile text. */
export async function getLearningTelemetry(
  userId: string,
  now = new Date(),
  client: Prisma.TransactionClient = db,
) {
  const profile = await client.learnerProfile.findUnique({
    where: { userId },
    select: { timezone: true, dailyMinutes: true, weeklyGoalDays: true },
  });
  const timezone = profile?.timezone ?? "America/Sao_Paulo";
  const since = new Date(now.getTime() - 90 * 86400000);
  const [sessions, attempts, reviews, evidence, events, days] = await Promise.all([
    client.dailySession.findMany({
      where: {
        userId,
        localDate: { gte: addDays(localDate(now, timezone), -90), lte: localDate(now, timezone) },
      },
      orderBy: [{ localDate: "desc" }, { id: "asc" }],
      take: 301,
    }),
    client.activityAttempt.findMany({
      where: { userId, createdAt: { gte: since, lte: now } },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 5001,
      select: {
        id: true,
        activityId: true,
        sessionId: true,
        type: true,
        level: true,
        score: true,
        hinted: true,
        selfRated: true,
        durationMs: true,
        createdAt: true,
      },
    }),
    client.reviewLog.findMany({
      where: { userId, reviewedAt: { gte: since, lte: now } },
      orderBy: [{ reviewedAt: "desc" }, { id: "asc" }],
      take: 5001,
      select: {
        conceptId: true,
        dimension: true,
        elapsedDays: true,
        score: true,
        hinted: true,
        selfRated: true,
        reviewedAt: true,
      },
    }),
    client.skillEvidence.findMany({
      where: { userId, occurredAt: { gte: since, lte: now } },
      orderBy: [{ occurredAt: "desc" }, { id: "asc" }],
      take: 5001,
    }),
    client.studyEvent.findMany({
      where: {
        userId,
        createdAt: { gte: since, lte: now },
        type: {
          in: [
            "activity_started",
            "activity_completed",
            "skill_estimate_changed",
            "provider_usage",
          ],
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 5001,
      select: { type: true, payload: true, createdAt: true, sessionId: true },
    }),
    client.dailyActivity.findMany({
      where: {
        userId,
        localDate: { gte: addDays(localDate(now, timezone), -7), lte: localDate(now, timezone) },
      },
      select: { localDate: true, activeSeconds: true },
    }),
  ]);
  return learningMetrics({
    now,
    timezone,
    dailyMinutes: profile?.dailyMinutes ?? 30,
    weeklyGoalDays: profile?.weeklyGoalDays ?? 5,
    sessions: sessions.slice(0, 300).map((s) => ({ ...s, plan: s.plan as unknown as SessionPlan })),
    attempts: attempts.slice(0, 5000),
    reviews: reviews.slice(0, 5000),
    evidence: evidence.slice(0, 5000).flatMap((e) => {
      const parsed = evidenceSchema.safeParse(e);
      return parsed.success ? [parsed.data] : [];
    }),
    events: events.slice(0, 5000),
    days,
    truncated:
      sessions.length > 300 ||
      [attempts, reviews, evidence, events].some((rows) => rows.length > 5000),
  });
}

/** Planner feedback needs only past frozen plans and first-attempt metadata; no event scan. */
export async function planningAdvice(
  userId: string,
  timezone: string,
  now: Date,
  client: Prisma.TransactionClient,
) {
  const date = localDate(now, timezone),
    from = addDays(date, -90);
  const sessions = await client.dailySession.findMany({
    where: { userId, localDate: { gte: from, lt: date }, activeSeconds: { gt: 0 } },
    orderBy: [{ localDate: "desc" }, { id: "asc" }],
    take: 301,
  });
  if (sessions.length < 10 || sessions.length > 300) return [];
  const attempts = await client.activityAttempt.findMany({
    where: { userId, sessionId: { in: sessions.map((s) => s.id) } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 5001,
    select: {
      id: true,
      activityId: true,
      sessionId: true,
      type: true,
      level: true,
      score: true,
      hinted: true,
      selfRated: true,
      durationMs: true,
      createdAt: true,
    },
  });
  return learningMetrics({
    now,
    timezone,
    dailyMinutes: 0,
    weeklyGoalDays: 0,
    sessions: sessions.map((s) => ({ ...s, plan: s.plan as unknown as SessionPlan })),
    attempts: attempts.slice(0, 5000),
    reviews: [],
    evidence: [],
    events: [],
    days: [],
    truncated: attempts.length > 5000,
  }).recommendation;
}
