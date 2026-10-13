import "server-only";
import { getContent } from "@/lib/content";
import { toClientActivity, type ClientActivity } from "@/lib/learning/activities/client";
import type { ActivityResponse } from "@/lib/learning/grading/grade";
import type { ReviewItem } from "@/lib/learning/planner/planner";
import { buildReviewActivity, type PersonalItemData } from "@/lib/learning/review/generate";
import { reviewCandidates } from "@/lib/learning/planner/planner";
import { db } from "@/server/db";
import { loadTraces } from "@/server/repositories/memory";
import { activitySeed, PracticeError, submitActivity, type PracticeContext } from "./practice";
import type { SessionPlan } from "@/lib/learning/planner/planner";
import type { Prisma } from "@/generated/prisma/client";
import { lockLearner } from "./skill-estimation";
import { completeBlock, SessionError } from "./session";

export interface PreparedReviewItem extends ReviewItem {
  key: string;
  activity: ClientActivity;
  scheduleVersion?: string;
}

const memoryKey = (item: ReviewItem) => `${item.conceptId}#${item.dimension}`;
export const reviewScheduleVersion = (trace: {
  reps: number;
  due: Date;
  lastReview: Date | null;
}) => `${trace.reps}:${trace.due.toISOString()}:${trace.lastReview?.toISOString() ?? "new"}`;

/** Exercises are generated with a per-day seed so they vary from one day to the next. */
export const reviewSeed = (userId: string, date: string, variant?: number) =>
  `rv:${userId}:${date}${variant ? `:v${variant}` : ""}`;

async function personalItems(
  userId: string,
  items: readonly ReviewItem[],
  client: Prisma.TransactionClient = db,
) {
  const ids = items
    .filter((item) => item.conceptId.startsWith("personal:"))
    .map((item) => item.conceptId.slice("personal:".length));
  if (ids.length === 0) return new Map<string, PersonalItemData>();
  const rows = await client.personalItem.findMany({ where: { userId, id: { in: ids } } });
  return new Map(rows.map((row) => [row.id, row]));
}

export async function prepareReviewItems(
  userId: string,
  items: readonly ReviewItem[],
  date: string,
  dueOnly = false,
  productionPractice = false,
  client: Prisma.TransactionClient = db,
  sessionId?: string,
  now = new Date(),
): Promise<PreparedReviewItem[]> {
  const index = getContent();
  const personal = await personalItems(userId, items, client);
  const prepared: PreparedReviewItem[] = [];
  const due = await loadTraces(client, userId, [...new Set(items.map((i) => i.conceptId))]);
  const session =
    dueOnly && sessionId
      ? await client.dailySession.findFirst({
          where: { id: sessionId, userId },
          select: { createdAt: true },
        })
      : null;
  if (sessionId && dueOnly && !session) throw new PracticeError("Sessão não encontrada.");
  const seen = new Set<string>();
  for (const item of items) {
    const trace = due.find((t) => t.conceptId === item.conceptId && t.dimension === item.dimension);
    const key = memoryKey(item);
    if (
      dueOnly &&
      (seen.has(key) ||
        !trace ||
        trace.reps === 0 ||
        trace.due > now ||
        (item.scheduleVersion && item.scheduleVersion !== reviewScheduleVersion(trace)) ||
        (!item.scheduleVersion &&
          session &&
          trace.lastReview &&
          trace.lastReview >= session.createdAt) ||
        (sessionId &&
          (await client.activityAttempt.findFirst({
            where: { userId, sessionId, response: { path: ["reviewReceipt", "key"], equals: key } },
            select: { id: true },
          }))))
    )
      continue;
    if (dueOnly) seen.add(key);
    const activity = buildReviewActivity({
      index,
      conceptId: item.conceptId,
      dimension: item.dimension,
      seed: reviewSeed(userId, date, item.variant),
      productionPractice,
      personal: personal.get(item.conceptId.replace("personal:", "")),
    });
    if (!activity) continue;
    prepared.push({
      ...item,
      key: `${item.conceptId}#${item.dimension}#${item.variant ?? 0}`,
      activity: toClientActivity(activity, activitySeed(userId)),
      scheduleVersion: trace ? reviewScheduleVersion(trace) : undefined,
    });
  }
  return prepared;
}

/** The items due right now, most urgent first (for the standalone review page). */
export async function dueReviewItems(
  userId: string,
  limit = 20,
  now = new Date(),
): Promise<ReviewItem[]> {
  const index = getContent();
  const traces = await loadTraces(db, userId);
  return reviewCandidates({
    traces,
    now,
    concept: (id) => {
      const concept = index.concepts.get(id);
      return concept ? { kind: concept.kind, level: concept.level } : undefined;
    },
  })
    .filter((candidate) => candidate.priority >= 1)
    .slice(0, limit)
    .map(({ conceptId, dimension }) => ({ conceptId, dimension }));
}

export async function submitReview(params: {
  userId: string;
  item: ReviewItem;
  date: string;
  response: ActivityResponse;
  context: PracticeContext;
  sessionId?: string;
  hinted?: boolean;
  durationMs?: number;
  scheduleVersion?: string;
  correctiveRetry?: boolean;
  blockIndex?: number;
  now?: Date;
}) {
  // Provider-based grading stays outside the write transaction. The authoritative
  // guard is repeated under the same learner lock as FSRS, attempt and metric writes.
  const state = await reviewState(db, params);
  if (state.stale) return { skipped: true as const };
  try {
    return await submitActivity({
      userId: params.userId,
      activity: state.activity!,
      response: params.response,
      context: state.context,
      sessionId: params.sessionId,
      hinted: params.hinted,
      durationMs: params.durationMs,
      scheduleMemory: state.scheduleMemory,
      now: params.now,
      reviewGuard: async (tx) => {
        const current = await reviewState(tx, params);
        if (
          current.stale ||
          current.context !== state.context ||
          current.scheduleMemory !== state.scheduleMemory
        )
          throw new StaleReview();
      },
      reviewReceipt: state.dueReview
        ? {
            key: memoryKey(params.item),
            phase: params.correctiveRetry ? "retry" : "first",
            version: params.scheduleVersion,
          }
        : undefined,
    });
  } catch (error) {
    if (error instanceof StaleReview) return { skipped: true as const };
    throw error;
  }
}
class StaleReview extends Error {}

type ReviewReference = {
  userId: string;
  item: ReviewItem;
  date: string;
  context: PracticeContext;
  sessionId?: string;
  scheduleVersion?: string;
  correctiveRetry?: boolean;
  blockIndex?: number;
  now?: Date;
};
async function reviewState(tx: Prisma.TransactionClient, params: ReviewReference) {
  const now = params.now ?? new Date();
  let context = params.context,
    scheduleMemory = true,
    dueReview = context === "review",
    productionPractice = false;
  let frozenVersion: string | undefined, sessionCreatedAt: Date | undefined;
  let date = params.date;
  if (params.sessionId) {
    const session = await tx.dailySession.findFirst({
      where: { id: params.sessionId, userId: params.userId },
    });
    if (!session || session.status === "abandoned")
      throw new PracticeError("Sessão não encontrada.");
    const plan = session.plan as unknown as SessionPlan;
    date = plan.date;
    const contains = (block: SessionPlan["blocks"][number]) =>
      (block.kind === "review" || block.kind === "focus") &&
      block.items.some(
        (item) =>
          item.conceptId === params.item.conceptId &&
          item.dimension === params.item.dimension &&
          (item.variant ?? 0) === (params.item.variant ?? 0),
      );
    const block = plan.blocks[session.cursor];
    if (params.blockIndex !== undefined && params.blockIndex !== session.cursor) {
      const requested = plan.blocks[params.blockIndex];
      if (params.blockIndex < session.cursor && requested?.kind === "review" && contains(requested))
        return { stale: true, context, scheduleMemory: false, dueReview: true };
      throw new PracticeError("Esta etapa da revisão não está disponível. Recarregue a sessão.");
    }
    if (!block || !contains(block)) {
      if (plan.blocks.slice(0, session.cursor).some((b) => b.kind === "review" && contains(b)))
        return { stale: true, context, scheduleMemory: false, dueReview: true };
      throw new PracticeError("Este item não pertence à etapa atual.");
    }
    scheduleMemory = block.kind === "review";
    dueReview = scheduleMemory;
    productionPractice = block.kind === "focus";
    if (block.kind === "review")
      frozenVersion = block.items.find(
        (item) => memoryKey(item) === memoryKey(params.item),
      )?.scheduleVersion;
    sessionCreatedAt = session.createdAt;
    if (dueReview) context = "review";
  }
  const index = getContent();
  const personal = await personalItems(params.userId, [params.item], tx);
  const activity = buildReviewActivity({
    index,
    conceptId: params.item.conceptId,
    dimension: params.item.dimension,
    seed: reviewSeed(params.userId, date, params.item.variant),
    productionPractice,
    personal: personal.get(params.item.conceptId.replace("personal:", "")),
  });
  if (!activity) {
    if (dueReview) return { stale: true, context, scheduleMemory: false, dueReview };
    throw new PracticeError("Este item não pode ser revisado.");
  }
  if (dueReview) {
    const receipts =
      params.sessionId || params.scheduleVersion
        ? await tx.activityAttempt.findMany({
            where: {
              userId: params.userId,
              sessionId: params.sessionId ?? null,
              AND: [
                { response: { path: ["reviewReceipt", "key"], equals: memoryKey(params.item) } },
                ...(!params.sessionId
                  ? [
                      {
                        response: {
                          path: ["reviewReceipt", "version"],
                          equals: params.scheduleVersion,
                        },
                      },
                    ]
                  : []),
              ],
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 2,
            select: { correct: true, response: true },
          })
        : [];
    const receipt =
      receipts.find(
        (r) =>
          (r.response as { reviewReceipt?: { phase: string } } | null)?.reviewReceipt?.phase ===
          "retry",
      ) ?? receipts[0];
    const phase = (receipt?.response as { reviewReceipt?: { phase: string } } | null)?.reviewReceipt
      ?.phase;
    const trace = await tx.memoryTrace.findUnique({
      where: {
        userId_conceptId_dimension: {
          userId: params.userId,
          conceptId: params.item.conceptId,
          dimension: params.item.dimension,
        },
      },
    });
    if (params.correctiveRetry) {
      // A separate, explicitly requested corrective phase is practice, never another FSRS write.
      if (!receipt || receipt.correct || phase !== "first")
        return { stale: true, context, scheduleMemory: false, dueReview };
      scheduleMemory = false;
      context = "session";
    } else if (
      receipt ||
      !trace ||
      trace.reps === 0 ||
      trace.due > now ||
      ((frozenVersion ?? params.scheduleVersion) !== undefined &&
        (frozenVersion ?? params.scheduleVersion) !== reviewScheduleVersion(trace)) ||
      (!frozenVersion &&
        sessionCreatedAt &&
        trace.lastReview &&
        trace.lastReview >= sessionCreatedAt)
    ) {
      return { stale: true, context, scheduleMemory: false, dueReview };
    }
  }
  return { stale: false, activity, context, scheduleMemory, dueReview };
}

/** Revalidate before displaying the next question, without grading, scheduling or counting it. */
export async function reviewIsStale(params: ReviewReference) {
  return db.$transaction(async (tx) => {
    await lockLearner(tx, params.userId);
    return (await reviewState(tx, params)).stale;
  });
}

/** Preserve frozen plans; persist only cursor/status when a whole review block is exhausted. */
export async function reconcileSessionReviews(
  userId: string,
  sessionId: string,
  client?: Prisma.TransactionClient,
  now = new Date(),
) {
  const reconcile = async (tx: Prisma.TransactionClient) => {
    await lockLearner(tx, userId);
    let session = await tx.dailySession.findFirst({ where: { id: sessionId, userId } });
    if (!session || session.status === "abandoned")
      throw new SessionError("Sessão não encontrada.");
    while (session.status !== "completed") {
      const plan = session.plan as unknown as SessionPlan,
        block = plan.blocks[session.cursor];
      if (block?.kind !== "review") break;
      const valid = await prepareReviewItems(
        userId,
        block.items,
        plan.date,
        true,
        false,
        tx,
        sessionId,
        now,
      );
      if (valid.length) break;
      session = await completeBlock(userId, sessionId, session.cursor, tx);
    }
    return session;
  };
  return client ? reconcile(client) : db.$transaction(reconcile, { timeout: 20000 });
}
