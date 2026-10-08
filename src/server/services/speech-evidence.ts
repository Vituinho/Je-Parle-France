import "server-only";
import type { ActivityResponse } from "@/lib/learning/grading/grade";
import { db } from "@/server/db";

export class SpeechEvidenceError extends Error {}

/** Assessments older than this are not accepted as evidence. */
const MAX_AGE_MS = 30 * 60_000;

/**
 * Turns a spoken response into gradable evidence. Transcripts and
 * pronunciation scores are only ever read from the learner's own stored
 * assessment (`speech_attempts`), never from the client: whatever else the
 * client sent is dropped, and only a self-rating survives without an attempt.
 */
export async function resolveSpeechResponse(
  userId: string,
  response: ActivityResponse,
  now = new Date(),
): Promise<ActivityResponse> {
  if (response.kind !== "speech") return response;
  const { speechAttemptId, selfRating } = response;
  if (!speechAttemptId) return { kind: "speech", selfRating };
  const attempt = await db.speechAttempt.findFirst({
    where: {
      id: speechAttemptId,
      userId,
      createdAt: { gte: new Date(now.getTime() - MAX_AGE_MS) },
    },
  });
  if (!attempt?.transcript) {
    throw new SpeechEvidenceError("Avaliação de pronúncia não encontrada. Grave de novo.");
  }
  const overall = (attempt.scores as { scores?: { overall?: number } | null } | null)?.scores
    ?.overall;
  return {
    kind: "speech",
    transcript: attempt.transcript,
    pronunciation: typeof overall === "number" ? Math.min(100, Math.max(0, overall)) : undefined,
  };
}
