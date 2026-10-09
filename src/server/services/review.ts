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

export interface PreparedReviewItem extends ReviewItem {
  key: string;
  activity: ClientActivity;
}

/** Exercises are generated with a per-day seed so they vary from one day to the next. */
export const reviewSeed = (userId: string, date: string, variant?: number) =>
  `rv:${userId}:${date}${variant ? `:v${variant}` : ""}`;

async function personalItems(userId: string, items: readonly ReviewItem[]) {
  const ids = items
    .filter((item) => item.conceptId.startsWith("personal:"))
    .map((item) => item.conceptId.slice("personal:".length));
  if (ids.length === 0) return new Map<string, PersonalItemData>();
  const rows = await db.personalItem.findMany({ where: { userId, id: { in: ids } } });
  return new Map(rows.map((row) => [row.id, row]));
}

export async function prepareReviewItems(
  userId: string,
  items: readonly ReviewItem[],
  date: string,
  dueOnly = false,
  productionPractice = false,
): Promise<PreparedReviewItem[]> {
  const index = getContent();
  const personal = await personalItems(userId, items);
  const prepared: PreparedReviewItem[] = [];
  const due = dueOnly
    ? await loadTraces(db, userId, [...new Set(items.map((i) => i.conceptId))])
    : [];
  for (const item of items) {
    if (
      dueOnly &&
      !due.some(
        (t) =>
          t.conceptId === item.conceptId &&
          t.dimension === item.dimension &&
          t.reps > 0 &&
          t.due.getTime() <= Date.now(),
      )
    )
      continue;
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
}) {
  let scheduleMemory = true;
  let context = params.context;
  let checkDue = false;
  let productionPractice = false;
  if (params.sessionId) {
    const session = await db.dailySession.findFirst({
      where: { id: params.sessionId, userId: params.userId },
    });
    const block = (session?.plan as unknown as SessionPlan | undefined)?.blocks[
      session?.cursor ?? 0
    ];
    if (
      !session ||
      !block ||
      !(block.kind === "review" || block.kind === "focus") ||
      !block.items.some(
        (item) =>
          item.conceptId === params.item.conceptId &&
          item.dimension === params.item.dimension &&
          item.variant === params.item.variant,
      )
    )
      throw new PracticeError("Este item não pertence à etapa atual.");
    scheduleMemory = block.kind === "review";
    productionPractice = block.kind === "focus";
    if (scheduleMemory) {
      context = "review";
      checkDue = true;
    }
  }
  const index = getContent();
  const personal = await personalItems(params.userId, [params.item]);
  const activity = buildReviewActivity({
    index,
    conceptId: params.item.conceptId,
    dimension: params.item.dimension,
    seed: reviewSeed(params.userId, params.date, params.item.variant),
    productionPractice,
    personal: personal.get(params.item.conceptId.replace("personal:", "")),
  });
  if (!activity) throw new PracticeError("Este item não pode ser revisado.");
  if (checkDue) {
    const trace = await db.memoryTrace.findUnique({
      where: {
        userId_conceptId_dimension: {
          userId: params.userId,
          conceptId: params.item.conceptId,
          dimension: params.item.dimension,
        },
      },
    });
    if (!trace || trace.reps === 0 || trace.due.getTime() > Date.now()) {
      const previous = await db.activityAttempt.findFirst({
        where: { userId: params.userId, sessionId: params.sessionId, activityId: activity.id },
        orderBy: { createdAt: "desc" },
        select: { correct: true },
      });
      if (!previous || previous.correct)
        throw new PracticeError(
          "Este item já foi reagendado. Continue a sessão para atualizar a revisão.",
        );
      // One corrective retry is additional practice, not a premature second FSRS review.
      scheduleMemory = false;
      context = "session";
    }
  }
  return submitActivity({
    userId: params.userId,
    activity,
    response: params.response,
    context,
    sessionId: params.sessionId,
    hinted: params.hinted,
    durationMs: params.durationMs,
    scheduleMemory,
  });
}
