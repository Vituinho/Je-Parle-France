import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getContent } from "@/lib/content";
import { reviewActivityId } from "@/lib/learning/review/generate";
import { activeSliceSchema } from "@/lib/learning/telemetry/events";
import type { SessionPlan, SessionBlock } from "@/lib/learning/planner/planner";
import { localDate } from "@/lib/learning/time";
import { db } from "@/server/db";
import { lockLearner } from "./skill-estimation";
import { recordLearningEvent } from "./learning-events";

export class StudyTimeError extends Error {}
const lifecycleTypes = [
  "session_started",
  "session_resumed",
  "session_paused",
  "session_completed",
];

export async function sessionTransition(
  tx: Prisma.TransactionClient,
  userId: string,
  sessionId: string,
  transition: "start" | "pause",
  now = new Date(),
) {
  const session = await tx.dailySession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw new StudyTimeError("Sessão não encontrada.");
  if (session.status === "completed" || session.status === "abandoned") return;
  const last = await tx.studyEvent.findFirst({
    where: { userId, sessionId, type: { in: lifecycleTypes } },
    orderBy: { createdAt: "desc" },
  });
  if (transition === "pause") {
    if (!last || last.type === "session_paused") return;
    await recordLearningEvent(
      tx,
      userId,
      { type: "session_paused", payload: { blockIndex: session.cursor } },
      { sessionId, now },
    );
    return;
  }
  if (!last || last.type === "session_paused")
    await recordLearningEvent(
      tx,
      userId,
      {
        type: last ? "session_resumed" : "session_started",
        payload: { blockIndex: session.cursor },
      },
      { sessionId, now },
    );
  await tx.dailySession.update({
    where: { id: sessionId },
    data: { status: "in_progress", startedAt: session.startedAt ?? now },
  });
  await recordLearningEvent(
    tx,
    userId,
    { type: "block_started", payload: { blockIndex: session.cursor } },
    { sessionId, dedupeKey: `block:${sessionId}:${session.cursor}:start`, now },
  );
}

function inBlock(block: SessionBlock | undefined, activityId: string) {
  if (!block) return false;
  const ref = getContent().activities.get(activityId);
  if (block.kind === "lesson") return ref?.lessonId === block.lessonId;
  if (block.kind !== "review" && block.kind !== "focus") return false;
  if (block.kind === "focus" && block.activityIds?.includes(activityId)) return true;
  return block.items.some(
    (item) =>
      reviewActivityId(item.conceptId, item.dimension).toLowerCase() === activityId.toLowerCase() ||
      (ref?.activity.type !== "teach" &&
        ref?.activity.targets.some(
          (t) => t.concept === item.conceptId && t.dimension === item.dimension,
        )),
  );
}

/** Credit once, under the learner lock, bounded by both slices and shared server wall time. */
export async function recordActiveSlice(userId: string, input: unknown, now = new Date()) {
  const slice = activeSliceSchema.parse(input);
  return db.$transaction(
    async (tx) => {
      await lockLearner(tx, userId);
      const session = slice.sessionId
        ? await tx.dailySession.findFirst({ where: { id: slice.sessionId, userId } })
        : null;
      if (slice.sessionId && (!session || ["completed", "abandoned"].includes(session.status)))
        throw new StudyTimeError("Sessão não encontrada ou encerrada.");
      const conversation = slice.activityId.startsWith("conversation:")
        ? await tx.conversation.findFirst({
            where: { id: slice.activityId.slice("conversation:".length), userId, status: "active" },
            select: { scenarioId: true },
          })
        : null;
      const currentBlock = (session?.plan as unknown as SessionPlan | undefined)?.blocks?.[
        session?.cursor ?? 0
      ];
      const conversationAllowed =
        !!conversation &&
        (!session ||
          (currentBlock?.kind === "conversation" &&
            currentBlock.scenarioId === conversation.scenarioId));
      if (
        session &&
        !conversationAllowed &&
        !inBlock(
          (session.plan as unknown as SessionPlan).blocks?.[session.cursor],
          slice.activityId,
        )
      )
        throw new StudyTimeError("Esta atividade não pertence à etapa atual.");
      if (
        !session &&
        !getContent().activities.has(slice.activityId) &&
        !conversationAllowed &&
        !/^rv-[a-z0-9-]+$/.test(slice.activityId)
      )
        throw new StudyTimeError("Atividade não encontrada.");
      const dedupeKey = `time:${slice.streamId}:${slice.sequence}`;
      if (await tx.studyEvent.findUnique({ where: { userId_dedupeKey: { userId, dedupeKey } } }))
        return { creditedSeconds: 0 };
      if (slice.sequence === 0) {
        if (slice.activeMs !== 0) throw new StudyTimeError("Início inválido.");
        if (session) await sessionTransition(tx, userId, session.id, "start", now);
        await recordLearningEvent(
          tx,
          userId,
          {
            type: "activity_started",
            payload: {
              activityId: slice.activityId,
              streamId: slice.streamId,
              ...(session ? { blockIndex: session.cursor } : {}),
            },
          },
          { sessionId: slice.sessionId, dedupeKey, now },
        );
        return { creditedSeconds: 0 };
      }
      const start = await tx.studyEvent.findUnique({
        where: { userId_dedupeKey: { userId, dedupeKey: `time:${slice.streamId}:0` } },
      });
      const startPayload = start?.payload as { activityId?: string; blockIndex?: number } | null;
      if (
        !start ||
        start.sessionId !== (slice.sessionId ?? null) ||
        startPayload?.activityId !== slice.activityId ||
        (session && startPayload.blockIndex !== session.cursor)
      )
        throw new StudyTimeError("Janela de estudo inválida.");
      if (session) {
        const lifecycle = await tx.studyEvent.findFirst({
          where: { userId, sessionId: session.id, type: { in: lifecycleTypes } },
          orderBy: { createdAt: "desc" },
        });
        if (lifecycle?.type === "session_paused") throw new StudyTimeError("Sessão pausada.");
      }
      const previous = await tx.studyEvent.findFirst({
        where: { userId, type: "active_time" },
        orderBy: { createdAt: "desc" },
      });
      const since = Math.max(start.createdAt.getTime(), previous?.createdAt.getTime() ?? 0);
      const seconds = Math.floor(
        Math.min(slice.activeMs, Math.max(0, now.getTime() - since)) / 1000,
      );
      const inserted = await recordLearningEvent(
        tx,
        userId,
        {
          type: "active_time",
          payload: {
            streamId: slice.streamId,
            sequence: slice.sequence,
            activityId: slice.activityId,
            activeMs: seconds * 1000,
          },
        },
        { sessionId: slice.sessionId, dedupeKey, now },
      );
      if (inserted.count && seconds > 0) {
        const profile = await tx.learnerProfile.findUnique({
          where: { userId },
          select: { timezone: true },
        });
        const date = localDate(now, profile?.timezone ?? "UTC");
        await tx.dailyActivity.upsert({
          where: { userId_localDate: { userId, localDate: date } },
          create: { userId, localDate: date, activeSeconds: seconds },
          update: { activeSeconds: { increment: seconds } },
        });
        if (session)
          await tx.dailySession.update({
            where: { id: session.id },
            data: { activeSeconds: { increment: seconds } },
          });
      }
      return { creditedSeconds: inserted.count ? seconds : 0 };
    },
    { timeout: 10000 },
  );
}

export async function recordSessionTransition(
  userId: string,
  sessionId: string,
  transition: "start" | "pause",
  now = new Date(),
) {
  return db.$transaction(async (tx) => {
    await lockLearner(tx, userId);
    await sessionTransition(tx, userId, sessionId, transition, now);
  });
}
