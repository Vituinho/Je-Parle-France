import "server-only";
import type { PreferencesInput } from "@/lib/learning/preferences";
import { db } from "@/server/db";
import { lockLearner } from "./skill-estimation";
import { levelIndex, readTheta } from "@/lib/learning/cefr";

/**
 * Account settings and the learner's LGPD rights: access/portability (export)
 * and deletion. Account deletion itself goes through Better Auth (password
 * re-check); every table cascades from the user row.
 */
export async function getAccount(userId: string) {
  const [user, profile, counts] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true, createdAt: true },
    }),
    db.learnerProfile.findUnique({ where: { userId } }),
    db.$transaction([
      db.conversation.count({ where: { userId } }),
      db.personalItem.count({ where: { userId } }),
      db.speechAttempt.count({ where: { userId } }),
    ]),
  ]);
  const [conversations, corrections, speechAttempts] = counts;
  return { user, profile, counts: { conversations, corrections, speechAttempts } };
}

export async function updatePreferences(userId: string, input: PreferencesInput) {
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { name: input.name } }),
    db.learnerProfile.update({
      where: { userId },
      data: {
        dailyMinutes: input.dailyMinutes,
        studyPace: input.studyPace,
        weeklyGoalDays: input.weeklyGoalDays,
        destination: input.destination,
        targetLevel: input.targetLevel,
        targetDate: input.targetMonth ? new Date(`${input.targetMonth}-01T00:00:00Z`) : null,
        correctionMode: input.correctionMode,
        supportPreference: input.supportPreference,
        timezone: input.timezone,
      },
    }),
    db.studyEvent.create({
      data: {
        userId,
        type: "preferences_updated",
        payload: {
          dailyMinutes: input.dailyMinutes,
          studyPace: input.studyPace ?? null,
          weeklyGoalDays: input.weeklyGoalDays,
          destination: input.destination,
          supportPreference: input.supportPreference,
        },
      },
    }),
  ]);
}

/**
 * Everything stored about the learner, as JSON. Authentication secrets
 * (password hash, session tokens, OAuth tokens) are deliberately left out.
 */
export async function exportUserData(userId: string) {
  const where = { userId };
  const [
    user,
    accounts,
    profile,
    skillEstimates,
    skillEvidence,
    placementAttempts,
    memoryTraces,
    reviewLogs,
    lessonProgress,
    activityAttempts,
    dailySessions,
    dailyActivity,
    personalItems,
    conversations,
    speechAttempts,
    studyEvents,
    achievements,
    usageCounters,
    pilotParticipant,
    pilotFeedback,
    pilotCalibration,
  ] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        createdAt: true,
      },
    }),
    db.account.findMany({ where, select: { providerId: true, createdAt: true } }),
    db.learnerProfile.findUnique({ where }),
    db.skillEstimate.findMany({ where }),
    db.skillEvidence.findMany({ where, orderBy: { occurredAt: "asc" } }),
    db.placementAttempt.findMany({
      where,
      include: { responses: true },
      orderBy: { startedAt: "asc" },
    }),
    db.memoryTrace.findMany({ where }),
    db.reviewLog.findMany({ where, orderBy: { reviewedAt: "asc" } }),
    db.lessonProgress.findMany({ where }),
    db.activityAttempt.findMany({ where, orderBy: { createdAt: "asc" } }),
    db.dailySession.findMany({ where, orderBy: { localDate: "asc" } }),
    db.dailyActivity.findMany({ where }),
    db.personalItem.findMany({ where, orderBy: { createdAt: "asc" } }),
    db.conversation.findMany({
      where,
      include: { turns: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    db.speechAttempt.findMany({ where, orderBy: { createdAt: "asc" } }),
    db.studyEvent.findMany({ where, orderBy: { createdAt: "asc" } }),
    db.userAchievement.findMany({ where }),
    db.usageCounter.findMany({ where }),
    db.pilotParticipant.findUnique({ where }),
    db.pilotFeedback.findMany({ where, orderBy: { createdAt: "asc" } }),
    db.pilotCalibration.findMany({
      where,
      select: {
        id: true,
        sourceKind: true,
        sourceId: true,
        record: true,
        createdAt: true,
        reviewedAt: true,
      },
    }),
  ]);
  return {
    format: "je-parle-francais/export",
    version: 1,
    exportedAt: new Date().toISOString(),
    note: "Recordings of your voice are never stored, so they are not part of this export.",
    user,
    accounts,
    profile,
    skillEstimates,
    skillEvidence,
    placementAttempts,
    memoryTraces,
    reviewLogs,
    lessonProgress,
    activityAttempts,
    dailySessions,
    dailyActivity,
    personalItems,
    conversations,
    speechAttempts,
    studyEvents,
    achievements,
    usageCounters,
    pilotParticipant,
    pilotFeedback,
    pilotCalibration,
  };
}

export interface PrivateDataSelection {
  /** Tutor conversations and their reports. */
  conversations: boolean;
  /** Corrections saved for review (and their review history). */
  corrections: boolean;
  /** Transcripts and scores of speech assessments. */
  speech: boolean;
}

export async function deletePrivateData(userId: string, selection: PrivateDataSelection) {
  const personalTraces = { userId, conceptId: { startsWith: "personal:" } };
  const counts = { conversations: 0, corrections: 0, speechAttempts: 0 };
  await db.$transaction(async (tx) => {
    await lockLearner(tx, userId);
    if (selection.conversations) {
      await tx.pilotFeedback.deleteMany({ where: { userId, context: "conversation" } });
      counts.conversations = (await tx.conversation.deleteMany({ where: { userId } })).count;
      // Corrections kept for review no longer point to a conversation.
      await tx.personalItem.updateMany({
        where: { userId, conversationId: { not: null } },
        data: { conversationId: null },
      });
    }
    if (selection.corrections) {
      counts.corrections = (await tx.personalItem.deleteMany({ where: { userId } })).count;
      await tx.memoryTrace.deleteMany({ where: personalTraces });
      await tx.reviewLog.deleteMany({ where: personalTraces });
    }
    if (selection.speech) {
      await tx.pilotFeedback.deleteMany({ where: { userId, context: "speech" } });
      await tx.pilotCalibration.deleteMany({ where: { userId, sourceKind: "speech" } });
      await tx.skillEvidence.deleteMany({ where: { userId, source: "speech" } });
      const estimates = await tx.skillEstimate.findMany({
        where: { userId, skill: { in: ["speaking", "pronunciation"] }, source: "practice" },
      });
      for (const estimate of estimates) {
        const theta = estimate.calibrationTheta ?? estimate.theta;
        const method = estimate.calibrationMethod ?? "not_assessed";
        await tx.skillEstimate.update({
          where: { userId_skill: { userId, skill: estimate.skill } },
          data: {
            theta,
            sd: estimate.calibrationSd ?? 1,
            method,
            assessed: ["objective", "perception", "ai_assessment"].includes(method),
            source: method === "self_report" ? "self_report" : "placement",
            displayBand: levelIndex(readTheta(theta).level),
            reason: "calibration",
            evidenceCount: 0,
            evidenceDays: 0,
            distinctTasks: 0,
            effectiveWeight: 0,
            lastEvidenceAt: null,
          },
        });
      }
      counts.speechAttempts = (await tx.speechAttempt.deleteMany({ where: { userId } })).count;
    }
  });
  return counts;
}
