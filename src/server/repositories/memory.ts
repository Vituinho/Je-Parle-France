import "server-only";
import type { MemoryTrace, Prisma } from "@/generated/prisma/client";
import type { MemoryTraceState, ReviewLogRecord } from "@/lib/learning/memory/memory";
import type { Db } from "@/server/db";

type Tx = Prisma.TransactionClient | Db;

export function traceFromRow(row: MemoryTrace): MemoryTraceState {
  return {
    conceptId: row.conceptId,
    dimension: row.dimension,
    due: row.due,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsedDays: row.elapsedDays,
    scheduledDays: row.scheduledDays,
    learningSteps: row.learningSteps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    lastReview: row.lastReview,
    attempts: row.attempts,
    successes: row.successes,
    lastScore: row.lastScore,
    source: row.source,
    introducedAt: row.introducedAt,
  };
}

function traceData(trace: MemoryTraceState) {
  return {
    due: trace.due,
    stability: trace.stability,
    difficulty: trace.difficulty,
    elapsedDays: trace.elapsedDays,
    scheduledDays: trace.scheduledDays,
    learningSteps: trace.learningSteps,
    reps: trace.reps,
    lapses: trace.lapses,
    state: trace.state,
    lastReview: trace.lastReview,
    attempts: trace.attempts,
    successes: trace.successes,
    lastScore: trace.lastScore,
  };
}

export async function loadTraces(tx: Tx, userId: string, conceptIds?: readonly string[]) {
  const rows = await tx.memoryTrace.findMany({
    where: { userId, ...(conceptIds ? { conceptId: { in: [...conceptIds] } } : {}) },
  });
  return rows.map(traceFromRow);
}

export async function saveTraces(tx: Tx, userId: string, traces: readonly MemoryTraceState[]) {
  for (const trace of traces) {
    await tx.memoryTrace.upsert({
      where: {
        userId_conceptId_dimension: {
          userId,
          conceptId: trace.conceptId,
          dimension: trace.dimension,
        },
      },
      create: {
        userId,
        conceptId: trace.conceptId,
        dimension: trace.dimension,
        source: trace.source,
        introducedAt: trace.introducedAt,
        ...traceData(trace),
      },
      update: traceData(trace),
    });
  }
}

export async function saveReviewLogs(
  tx: Tx,
  userId: string,
  logs: readonly (ReviewLogRecord & { activityId?: string })[],
) {
  if (logs.length === 0) return;
  await tx.reviewLog.createMany({ data: logs.map((log) => ({ userId, ...log })) });
}

export const traceKey = (conceptId: string, dimension: string) => `${conceptId}#${dimension}`;
