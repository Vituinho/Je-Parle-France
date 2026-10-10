import "server-only";
import { db } from "@/server/db";
import { learningEventSchema } from "@/lib/learning/telemetry/events";

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
}: { apply?: boolean; now?: Date } = {}) {
  const cutoff = new Date(now.getTime() - 90 * 86400000);
  const rows = await db.studyEvent.findMany({
    where: { type: { in: PRUNABLE_TELEMETRY }, createdAt: { lt: cutoff } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 5001,
    select: { id: true, type: true, payload: true },
  });
  const ids = rows
    .slice(0, 5000)
    .filter((e) => learningEventSchema.safeParse({ type: e.type, payload: e.payload }).success)
    .map((e) => e.id);
  const deleted =
    apply && ids.length
      ? await db.studyEvent.deleteMany({ where: { id: { in: ids }, createdAt: { lt: cutoff } } })
      : { count: 0 };
  return {
    dryRun: !apply,
    cutoff: cutoff.toISOString(),
    scanned: Math.min(rows.length, 5000),
    eligibleInBatch: ids.length,
    removed: deleted.count,
    more: rows.length > 5000,
  };
}
