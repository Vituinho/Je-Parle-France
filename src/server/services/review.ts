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
): Promise<PreparedReviewItem[]> {
  const index = getContent();
  const personal = await personalItems(userId, items);
  const prepared: PreparedReviewItem[] = [];
  for (const item of items) {
    const activity = buildReviewActivity({
      index,
      conceptId: item.conceptId,
      dimension: item.dimension,
      seed: reviewSeed(userId, date, item.variant),
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
  }
  const index = getContent();
  const personal = await personalItems(params.userId, [params.item]);
  const activity = buildReviewActivity({
    index,
    conceptId: params.item.conceptId,
    dimension: params.item.dimension,
    seed: reviewSeed(params.userId, params.date, params.item.variant),
    personal: personal.get(params.item.conceptId.replace("personal:", "")),
  });
  if (!activity) throw new PracticeError("Este item não pode ser revisado.");
  return submitActivity({
    userId: params.userId,
    activity,
    response: params.response,
    context: params.context,
    sessionId: params.sessionId,
    hinted: params.hinted,
    durationMs: params.durationMs,
    scheduleMemory,
  });
}
