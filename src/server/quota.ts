import "server-only";
import { db } from "@/server/db";

export class QuotaError extends Error {}

/**
 * Daily per-user counter (DB-backed, so it holds across instances). Throws
 * QuotaError once `limit` is exceeded for the day.
 */
export async function consumeQuota(
  userId: string,
  feature: string,
  date: string,
  limit: number,
  units = 0,
  unitLimit?: number,
) {
  if (
    ![limit, units, ...(unitLimit === undefined ? [] : [unitLimit])].every(Number.isSafeInteger) ||
    limit < 1 ||
    units < 0 ||
    (unitLimit !== undefined && unitLimit < 1)
  )
    throw new Error("Invalid quota configuration");
  const key = `${feature}:${date}`;
  return db.$transaction(async (tx) => {
    // Serialize reservations for this learner. Refused calls do not spend units or inflate counts.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
    const previous = await tx.usageCounter.findUnique({ where: { userId_key: { userId, key } } });
    if (
      (previous?.count ?? 0) >= limit ||
      (unitLimit !== undefined && (previous?.units ?? 0) + units > unitLimit)
    ) {
      const resource =
        feature === "speech"
          ? "fala"
          : feature === "writing"
            ? "avaliação de escrita"
            : feature === "tts"
              ? "áudio"
              : "tutor";
      throw new QuotaError(
        `Você chegou ao limite diário de ${resource}. Ele volta amanhã; você pode continuar as outras atividades.`,
      );
    }
    const counter = await tx.usageCounter.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key, count: 1, units },
      update: { count: { increment: 1 }, units: { increment: units } },
    });
    return counter.count;
  });
}

export async function addUsageUnits(userId: string, feature: string, date: string, units: number) {
  if (units <= 0) return;
  await db.usageCounter.updateMany({
    where: { userId, key: `${feature}:${date}` },
    data: { units: { increment: units } },
  });
}

const lastCall = new Map<string, number>();

/**
 * Short-window throttle against accidental double submits and scripted abuse.
 * In-memory: enough for a single instance; use Redis when running several.
 */
export function throttle(userId: string, action: string, minIntervalMs: number): boolean {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const previous = lastCall.get(key) ?? 0;
  if (now - previous < minIntervalMs) return false;
  lastCall.set(key, now);
  if (lastCall.size > 10_000) lastCall.clear();
  return true;
}
