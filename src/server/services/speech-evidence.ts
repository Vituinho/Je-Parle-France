import "server-only";
import { z } from "zod";
import type { Activity } from "@/lib/content/schema";
import type { ActivityResponse } from "@/lib/learning/grading/grade";
import { db } from "@/server/db";

export class SpeechEvidenceError extends Error {}

/** Assessments older than this are not accepted as evidence. */
const MAX_AGE_MS = 30 * 60_000;
const assessmentSchema = z.object({
  status: z.literal("ok"),
  scores: z.object({ overall: z.number().min(0).max(100) }),
});

/**
 * Turns a spoken response into gradable evidence. Transcripts and
 * pronunciation scores are only ever read from the learner's own stored
 * assessment (`speech_attempts`), never from the client: whatever else the
 * client sent is dropped, and only a self-rating survives without an attempt.
 */
export async function resolveSpeechResponse(
  userId: string,
  response: ActivityResponse,
  activity: Activity,
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
  // The reference is supplied when recording, so ownership alone is not enough:
  // a perfect assessment of an easier text must not score this exercise.
  if (activity.type !== "speak" || attempt.targetText.trim() !== activity.text.trim()) {
    throw new SpeechEvidenceError("Esta avaliação é de outro texto. Grave o exercício atual.");
  }
  const assessment = assessmentSchema.safeParse(attempt.scores);
  if (attempt.provider !== "azure" || !assessment.success) {
    throw new SpeechEvidenceError("A gravação não tem uma avaliação válida. Grave de novo.");
  }
  return {
    kind: "speech",
    transcript: attempt.transcript,
    pronunciation: assessment.data.scores.overall,
  };
}
