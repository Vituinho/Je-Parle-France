import "server-only";
import { db } from "@/server/db";
import { learningEventSchema } from "@/lib/learning/telemetry/events";
import { z } from "zod";

/** Operational detail only. FSRS, skill history, plans and daily totals remain product state. */
export const PRUNABLE_TELEMETRY = [
  "session_started",
  "session_paused",
  "session_resumed",
  "block_started",
  "block_completed",
  "activity_started",
  "active_time",
  "activity_completed",
  "provider_usage",
];
export async function pruneTelemetry({
  apply = false,
  now = new Date(),
  maxBatches = 20,
  batchSize = 5000,
}: { apply?: boolean; now?: Date; maxBatches?: number; batchSize?: number } = {}) {
  z.number().int().min(1).max(20).parse(maxBatches);
  z.number().int().min(1).max(5000).parse(batchSize);
  z.date().parse(now);
  const cutoff = new Date(now.getTime() - 90 * 86400000);
  type Position = { id: string; createdAt: Date };
  const after = (cursor?: Position) =>
    cursor
      ? {
          OR: [
            { createdAt: { gt: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { gt: cursor.id } },
          ],
        }
      : {};
  let scanned = 0,
    eligibleInBatch = 0,
    removed = 0,
    batches = 0,
    more = false;
  let cursor: Position | undefined;
  for (let batch = 0; batch < maxBatches; batch++) {
    const rows = await db.studyEvent.findMany({
      where: {
        type: { in: PRUNABLE_TELEMETRY },
        AND: [{ createdAt: { lt: cutoff } }, after(cursor)],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: batchSize + 1,
      select: { id: true, type: true, payload: true, createdAt: true },
    });
    const current = rows.slice(0, batchSize);
    if (!current.length) break;
    const ids = current
      .filter((e) => learningEventSchema.safeParse({ type: e.type, payload: e.payload }).success)
      .map((e) => e.id);
    scanned += current.length;
    eligibleInBatch += ids.length;
    batches++;
    if (apply && ids.length)
      removed += (
        await db.studyEvent.deleteMany({ where: { id: { in: ids }, createdAt: { lt: cutoff } } })
      ).count;
    // Walk past invalid legacy payloads instead of revisiting the same full prefix forever.
    cursor = current.at(-1);
    more = rows.length > batchSize;
    if (!more) break;
  }
  let feedbackEligible = 0,
    feedbackRemoved = 0,
    calibrationEligible = 0,
    calibrationRemoved = 0;
  for (const kind of ["feedback", "calibration"] as const) {
    let position: Position | undefined;
    for (let batch = 0; batch < maxBatches; batch++) {
      const query = {
        where: { AND: [{ createdAt: { lt: cutoff } }, after(position)] },
        orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
        take: batchSize + 1,
        select: { id: true, createdAt: true },
      };
      const rows =
        kind === "feedback"
          ? await db.pilotFeedback.findMany(query)
          : await db.pilotCalibration.findMany(query);
      const current = rows.slice(0, batchSize);
      if (!current.length) break;
      if (kind === "feedback") feedbackEligible += current.length;
      else calibrationEligible += current.length;
      if (apply) {
        const where = { id: { in: current.map((r) => r.id) }, createdAt: { lt: cutoff } };
        const count =
          kind === "feedback"
            ? (await db.pilotFeedback.deleteMany({ where })).count
            : (await db.pilotCalibration.deleteMany({ where })).count;
        if (kind === "feedback") feedbackRemoved += count;
        else calibrationRemoved += count;
      }
      position = current.at(-1);
      if (rows.length <= batchSize) break;
      if (batch === maxBatches - 1) more = true;
    }
  }
  return {
    dryRun: !apply,
    cutoff: cutoff.toISOString(),
    scanned,
    eligibleInBatch,
    removed,
    batches,
    feedbackEligible,
    feedbackRemoved,
    calibrationEligible,
    calibrationRemoved,
    more,
  };
}
