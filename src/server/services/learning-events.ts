import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { learningEventSchema } from "@/lib/learning/telemetry/events";

/** Strict allowlist: no responses, transcripts, messages, errors or profile strings. */
export async function recordLearningEvent(
  tx: Prisma.TransactionClient,
  userId: string,
  input: unknown,
  options: { sessionId?: string; dedupeKey?: string; now?: Date } = {},
) {
  const event = learningEventSchema.parse(input);
  return tx.studyEvent.createMany({
    data: [
      {
        userId,
        type: event.type,
        payload: event.payload as Prisma.InputJsonValue,
        sessionId: options.sessionId,
        dedupeKey: options.dedupeKey,
        createdAt: options.now,
      },
    ],
    skipDuplicates: true,
  });
}
