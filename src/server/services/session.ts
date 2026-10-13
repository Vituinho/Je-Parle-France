import "server-only";
import type { DailySession, LearnerProfile, Prisma } from "@/generated/prisma/client";
import { getCapabilities } from "@/lib/ai/capabilities";
import {
  getContent,
  lessonDependencies,
  conceptDimensions,
  type ContentIndex,
  type LessonRef,
} from "@/lib/content";
import { levelIndex, type CefrLevel } from "@/lib/learning/cefr";
import type { MemoryTraceState } from "@/lib/learning/memory/memory";
import {
  blockKinds,
  planSession,
  type BlockKind,
  type SessionBlock,
  type SessionPlan,
  type UpcomingLesson,
  type PracticeOpportunity,
} from "@/lib/learning/planner/planner";
import { hashString } from "@/lib/learning/random";
import { db } from "@/server/db";
import { loadTraces } from "@/server/repositories/memory";
import { getLearnerLevel, today } from "./learner";
import { lockLearner } from "./skill-estimation";
import { localDate } from "@/lib/learning/time";
import { recordLearningEvent } from "./learning-events";
import { planningAdvice } from "./learning-telemetry";

export class SessionError extends Error {}

const RELOCATION_GOALS = [
  "move_canada",
  "move_quebec",
  "move_france",
  "immigration",
  "work",
  "study",
];

function trackOrder(destination: LearnerProfile["destination"]): ("canada" | "france")[] {
  switch (destination) {
    case "canada_quebec":
      return ["canada"];
    case "france":
      return ["france"];
    case "both":
      return ["canada", "france"];
    default:
      return [];
  }
}

function newConceptsIn(ref: LessonRef, traced: Set<string>): number {
  const introduced = ref.lesson.steps.flatMap((step) =>
    step.type === "teach" ? step.introduces : [],
  );
  return new Set(introduced.filter((id) => !traced.has(id))).size;
}

/** Next lessons on the learner's path: core from their start point, then destination tracks. */
export function upcomingLessons(params: {
  index: ContentIndex;
  profile: Pick<LearnerProfile, "startLessonId" | "destination">;
  level: CefrLevel;
  progress: Map<string, { status: string; stepIndex: number }>;
  traces: readonly MemoryTraceState[];
}): UpcomingLesson[] {
  const { index, profile, progress } = params;
  const traced = new Set(params.traces.map((trace) => trace.conceptId));
  const toUpcoming = (ref: LessonRef): UpcomingLesson => ({
    lessonId: ref.lesson.id,
    track: ref.track,
    minutes: ref.lesson.minutes,
    steps: ref.lesson.steps.length,
    stepIndex:
      progress.get(ref.lesson.id)?.status === "in_progress"
        ? (progress.get(ref.lesson.id)?.stepIndex ?? 0)
        : 0,
    newConcepts: newConceptsIn(ref, traced),
    introducedByStep: ref.lesson.steps.map((step) =>
      step.type === "teach" ? step.introduces : [],
    ),
    prerequisites: lessonDependencies(ref),
    activityIdsByStep: ref.lesson.steps.map((step) => (step.type === "teach" ? null : step.id)),
  });
  const core = index.paths.core;
  const startIndex = Math.max(
    0,
    core.findIndex((ref) => ref.lesson.id === profile.startLessonId),
  );
  const nextCore = core
    .slice(startIndex)
    .filter((ref) => progress.get(ref.lesson.id)?.status !== "completed")
    .slice(0, 4)
    .map(toUpcoming);
  const nextTracks = trackOrder(profile.destination).flatMap((track) =>
    index.paths[track]
      .filter((ref) => levelIndex(ref.unit.level) <= levelIndex(params.level) + 1)
      .filter((ref) => progress.get(ref.lesson.id)?.status !== "completed")
      // Tracks run beside the core path: a track lesson waits until the
      // learner has met whatever it practises without teaching.
      .filter((ref) => lessonDependencies(ref).every((id) => traced.has(id)))
      .slice(0, 2)
      .map(toUpcoming),
  );
  return [...nextCore, ...nextTracks];
}

function pickScenario(
  index: ContentIndex,
  profile: LearnerProfile,
  level: CefrLevel,
  date: string,
) {
  const tracks = new Set<string>(["core", ...trackOrder(profile.destination)]);
  const options = [...index.scenarios.values()]
    .filter((scenario) => tracks.has(scenario.track))
    .filter((scenario) => levelIndex(scenario.minLevel) <= levelIndex(level));
  if (options.length === 0) return undefined;
  return options[hashString(date) % options.length]?.id;
}

async function recentBlocks(
  userId: string,
  beforeDate: string,
  client: Prisma.TransactionClient,
): Promise<BlockKind[]> {
  const recent = await client.dailySession.findMany({
    where: { userId, localDate: { lt: beforeDate } },
    orderBy: { createdAt: "desc" },
    take: 2,
  });
  return recent.flatMap((session) => blockKinds(session.plan as unknown as SessionPlan));
}

export async function buildPlan(
  userId: string,
  profile: LearnerProfile,
  now = new Date(),
  client: Prisma.TransactionClient = db,
): Promise<SessionPlan> {
  const index = getContent();
  const date = today(profile, now);
  const [traces, level, progressRows, day, otherPlans] = await Promise.all([
    loadTraces(client, userId),
    getLearnerLevel(userId, client),
    client.lessonProgress.findMany({ where: { userId } }),
    client.dailyActivity.findUnique({ where: { userId_localDate: { userId, localDate: date } } }),
    client.dailySession.findMany({
      where: { userId, localDate: date, status: { not: "abandoned" } },
    }),
  ]);
  const progress = new Map(progressRows.map((row) => [row.lessonId, row]));
  const known = new Set(traces.map((t) => t.conceptId));
  const introducedToday = new Set(
    traces
      .filter((t) => localDate(t.introducedAt, profile.timezone) === date)
      .map((t) => t.conceptId),
  );
  const reserved = new Set(
    otherPlans
      .flatMap((s) => (s.plan as unknown as SessionPlan).newConceptIds ?? [])
      .filter((id) => !known.has(id)),
  );
  const tracks = new Set(["core", ...trackOrder(profile.destination)]);
  const practice: PracticeOpportunity[] = [...index.activities.values()].flatMap((ref) => {
    const activity = ref.activity;
    const lesson = index.lessons.get(ref.lessonId);
    if (
      !lesson ||
      !tracks.has(lesson.track) ||
      activity.type === "teach" ||
      activity.type === "self_assess"
    )
      return [];
    const skill =
      activity.type === "listening" || activity.type === "dictation"
        ? "listening"
        : activity.type === "speak"
          ? activity.targets.some((t) => t.dimension === "pronunciation")
            ? "pronunciation"
            : "speaking"
          : activity.type === "minimal_pair"
            ? "pronunciation"
            : activity.type === "reading"
              ? "reading"
              : ["type", "fill", "order", "error_correction", "open_writing"].includes(
                    activity.type,
                  )
                ? "writing"
                : null;
    // Recognition-only tasks do not fill intensive time. Free writing needs a live grader.
    if (!skill || (activity.type === "open_writing" && !getCapabilities().llm)) return [];
    return [
      {
        activityId: activity.id,
        skill,
        seconds:
          activity.type === "reading" ||
          activity.type === "listening" ||
          activity.type === "open_writing"
            ? 180
            : activity.type === "speak"
              ? 120
              : 75,
        concepts: [
          ...new Set([...lessonDependencies(lesson), ...activity.targets.map((t) => t.concept)]),
        ],
        level: levelIndex(lesson.unit.level),
      },
    ];
  });
  const plan = planSession({
    now,
    date,
    dailyMinutes: profile.dailyMinutes,
    studyPace: profile.studyPace,
    newConceptsToday: Math.max(day?.newConcepts ?? 0, introducedToday.size) + reserved.size,
    practice,
    traces,
    concept: (id) => {
      const concept = index.concepts.get(id);
      return concept
        ? { kind: concept.kind, level: concept.level, dimensions: conceptDimensions(concept) }
        : undefined;
    },
    upcoming: upcomingLessons({ index, profile, level: level.level, progress, traces }),
    skills: level.skills,
    relocation:
      profile.goals.some((goal) => RELOCATION_GOALS.includes(goal)) ||
      profile.destination !== "undecided",
    recentBlocks: await recentBlocks(userId, date, client),
    capabilities: { conversation: getCapabilities().llm },
    scenarioId: pickScenario(index, profile, level.level, date),
    telemetryAdvice: await planningAdvice(userId, profile.timezone, now, client),
  });
  for (const block of plan.blocks)
    if (block.kind === "review") {
      for (const item of block.items) {
        const trace = traces.find(
          (t) => t.conceptId === item.conceptId && t.dimension === item.dimension,
        );
        if (trace)
          item.scheduleVersion = `${trace.reps}:${trace.due.toISOString()}:${trace.lastReview?.toISOString() ?? "new"}`;
      }
    }
  return plan;
}

/** Today's session: reuses an unfinished one, otherwise plans a new one. */
export async function getTodaySession(userId: string, profile: LearnerProfile, now = new Date()) {
  return db.$transaction(
    async (tx) => {
      await lockLearner(tx, userId);
      const date = today(profile, now);
      const existing = await tx.dailySession.findFirst({
        where: { userId, localDate: date, status: { in: ["planned", "in_progress", "completed"] } },
        orderBy: { createdAt: "desc" },
      });
      if (existing) return existing;
      const plan = await buildPlan(userId, profile, now, tx);
      return tx.dailySession.create({
        data: {
          userId,
          localDate: date,
          plannedMinutes: plan.minutes,
          plan: plan as unknown as Prisma.InputJsonValue,
        },
      });
    },
    { timeout: 30_000 },
  );
}

/** An extra session after today's is done ("praticar mais"). */
export async function startExtraSession(userId: string, profile: LearnerProfile, now = new Date()) {
  return db.$transaction(
    async (tx) => {
      await lockLearner(tx, userId);
      const unfinished = await tx.dailySession.findFirst({
        where: {
          userId,
          localDate: today(profile, now),
          status: { in: ["planned", "in_progress"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (unfinished) return unfinished;
      const plan = await buildPlan(userId, profile, now, tx);
      return tx.dailySession.create({
        data: {
          userId,
          localDate: plan.date,
          plannedMinutes: plan.minutes,
          plan: plan as unknown as Prisma.InputJsonValue,
        },
      });
    },
    { timeout: 30_000 },
  );
}

export function sessionPlan(session: DailySession): SessionPlan {
  return session.plan as unknown as SessionPlan;
}

export async function getSession(userId: string, sessionId: string) {
  const session = await db.dailySession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw new SessionError("Sessão não encontrada.");
  return session;
}

export async function recordedStudySeconds(userId: string, date: string): Promise<number> {
  return (
    (
      await db.dailyActivity.findUnique({
        where: { userId_localDate: { userId, localDate: date } },
      })
    )?.studySeconds ?? 0
  );
}

/** Marks block `blockIndex` as done and moves the cursor; completes the session at the end. */
export async function completeBlock(
  userId: string,
  sessionId: string,
  blockIndex: number,
  client?: Prisma.TransactionClient,
) {
  const complete = async (tx: Prisma.TransactionClient) => {
    await lockLearner(tx, userId);
    const session = await tx.dailySession.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new SessionError("Sessão não encontrada.");
    const plan = sessionPlan(session);
    if (blockIndex < session.cursor) return session; // already done (double submit)
    if (blockIndex !== session.cursor) throw new SessionError("Bloco fora de ordem.");
    if (!Number.isInteger(blockIndex) || blockIndex < 0 || blockIndex >= plan.blocks.length)
      throw new SessionError("Etapa inválida.");
    const cursor = blockIndex + 1;
    const done = cursor >= plan.blocks.length;
    const now = new Date();
    const updated = await tx.dailySession.update({
      where: { id: sessionId },
      data: {
        cursor,
        status: done ? "completed" : "in_progress",
        startedAt: session.startedAt ?? now,
        completedAt: done ? now : null,
      },
    });
    await recordLearningEvent(
      tx,
      userId,
      {
        type: "block_completed",
        payload: { blockIndex, expectedSeconds: plan.blocks[blockIndex]!.seconds },
      },
      { sessionId, dedupeKey: `block:${sessionId}:${blockIndex}:done`, now },
    );
    if (done) {
      await tx.dailyActivity.upsert({
        where: { userId_localDate: { userId, localDate: session.localDate } },
        create: { userId, localDate: session.localDate, sessionCompleted: true },
        update: { sessionCompleted: true },
      });
      await tx.studyEvent.create({
        data: {
          userId,
          type: "session_completed",
          sessionId,
          dedupeKey: `session:${sessionId}:done`,
          payload: { sessionId, minutes: session.plannedMinutes, blocks: plan.blocks.length },
        },
      });
    }
    return updated;
  };
  return client ? complete(client) : db.$transaction(complete, { timeout: 20_000 });
}

export function blockTitle(block: SessionBlock, index: ContentIndex = getContent()): string {
  switch (block.kind) {
    case "review":
      return `Revisão · ${block.items.length} ${block.items.length === 1 ? "item" : "itens"}`;
    case "lesson": {
      const ref = index.lessons.get(block.lessonId);
      const title = ref?.lesson.title.pt ?? "Lição";
      return block.maxSteps ? `${title} (começo)` : title;
    }
    case "focus":
      return {
        pronunciation: "Pronúncia",
        speaking: "Fala",
        listening: "Escuta",
        writing: "Escrita",
        reading: "Leitura",
      }[block.skill];
    case "conversation":
      return index.scenarios.get(block.scenarioId)?.title.pt ?? "Conversa";
  }
}
