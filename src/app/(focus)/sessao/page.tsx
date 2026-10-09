import type { Metadata } from "next";
import { Suspense } from "react";
import { SessionRunner, type BlockPayload } from "@/components/session/session-runner";
import { Skeleton } from "@/components/ui/skeleton";
import { conceptLabel, getContent } from "@/lib/content";
import { toClientActivity } from "@/lib/learning/activities/client";
import { getLearnerLevel, supportFor } from "@/server/services/learner";
import { activitySeed, startLesson } from "@/server/services/practice";
import { prepareReviewItems } from "@/server/services/review";
import {
  blockTitle,
  getSession,
  getTodaySession,
  sessionPlan,
  SessionError,
  recordedStudySeconds,
} from "@/server/services/session";
import { requireLearner } from "@/server/session";
import { learningSegments, lessonWindow } from "@/lib/learning/planner/planner";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Sessão de hoje" };

async function Session({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, profile } = await requireLearner();
  const { id } = await searchParams;
  let session;
  try {
    session =
      typeof id === "string"
        ? await getSession(user.id, id)
        : await getTodaySession(user.id, profile);
  } catch (error) {
    if (error instanceof SessionError) notFound();
    throw error;
  }
  const plan = sessionPlan(session);
  const content = getContent();
  const level = await getLearnerLevel(user.id);
  const seed = activitySeed(user.id);

  const blocks: BlockPayload[] = [];
  for (const [index, block] of plan.blocks.entries()) {
    const base = {
      title: blockTitle(block, content),
      reason: block.reason,
      seconds: block.seconds,
    };
    if (block.kind === "review" || block.kind === "focus") {
      blocks.push({
        ...base,
        kind: block.kind,
        authored: block.kind === "focus" && Boolean(block.activityIds?.length),
        // Items are only prepared for blocks still ahead.
        items:
          index >= session.cursor
            ? [
                ...(await prepareReviewItems(
                  user.id,
                  block.items,
                  plan.date,
                  block.kind === "review",
                  block.kind === "focus",
                )),
                ...(block.kind === "focus" ? (block.activityIds ?? []) : []).flatMap((id) => {
                  const activity = content.activities.get(id)?.activity;
                  if (!activity || activity.type === "teach") return [];
                  const target = activity.targets[0];
                  return [
                    {
                      key: activity.id,
                      conceptId: target?.concept ?? "",
                      dimension: target?.dimension ?? ("recall" as const),
                      activity: toClientActivity(activity, seed),
                    },
                  ];
                }),
              ]
            : [],
      });
    } else if (block.kind === "lesson") {
      const ref = content.lessons.get(block.lessonId);
      if (!ref) continue;
      const progress = index >= session.cursor ? await startLesson(user.id, block.lessonId) : null;
      const window = lessonWindow(
        block,
        progress?.stepIndex ?? 0,
        ref.lesson.steps.length,
        progress?.status === "completed",
      );
      const conceptIds = new Set(
        ref.lesson.steps.flatMap((step) =>
          step.type === "teach" ? step.introduces : step.targets.map((target) => target.concept),
        ),
      );
      blocks.push({
        ...base,
        kind: "lesson",
        lessonId: block.lessonId,
        lessonTitle: ref.lesson.title.pt,
        steps:
          index >= session.cursor
            ? ref.lesson.steps.map((step) => toClientActivity(step, seed))
            : [],
        ...window,
        conceptLabels: Object.fromEntries(
          [...conceptIds].map((conceptId) => [
            conceptId,
            conceptLabel(content.concepts.get(conceptId), conceptId),
          ]),
        ),
      });
    } else {
      blocks.push({ ...base, kind: "conversation", scenarioId: block.scenarioId });
    }
  }

  return (
    <SessionRunner
      key={`${session.id}:${session.cursor}`}
      sessionId={session.id}
      date={plan.date}
      plannedMinutes={Math.max(1, Math.round(plan.seconds / 60))}
      targetMinutes={plan.minutes}
      segments={plan.segments ?? learningSegments(plan.blocks, plan.minutes)}
      recordedSeconds={await recordedStudySeconds(user.id, plan.date)}
      blocks={blocks}
      initialCursor={session.cursor}
      support={supportFor(level.level, profile)}
      extra={typeof id === "string"}
    />
  );
}

export default function SessionPage(props: PageProps<"/sessao">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-24 h-96 w-full max-w-2xl rounded-2xl" />}>
      <Session searchParams={props.searchParams} />
    </Suspense>
  );
}
