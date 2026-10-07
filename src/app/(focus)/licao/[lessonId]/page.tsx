import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { Skeleton } from "@/components/ui/skeleton";
import { conceptLabel, getContent } from "@/lib/content";
import { toClientActivity } from "@/lib/learning/activities/client";
import { getLearnerLevel, supportFor } from "@/server/services/learner";
import { activitySeed, startLesson } from "@/server/services/practice";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Lição" };

async function Lesson({ params }: { params: Promise<{ lessonId: string }> }) {
  const { user, profile } = await requireLearner();
  const { lessonId } = await params;
  const content = getContent();
  const ref = content.lessons.get(lessonId);
  if (!ref) notFound();

  const progress = await startLesson(user.id, lessonId);
  const level = await getLearnerLevel(user.id);
  const seed = activitySeed(user.id);
  const conceptIds = new Set(
    ref.lesson.steps.flatMap((step) =>
      step.type === "teach" ? step.introduces : step.targets.map((target) => target.concept),
    ),
  );
  const conceptLabels = Object.fromEntries(
    [...conceptIds].map((id) => [id, conceptLabel(content.concepts.get(id), id)]),
  );

  return (
    <LessonPlayer
      lessonId={lessonId}
      title={ref.lesson.title.pt}
      steps={ref.lesson.steps.map((step) => toClientActivity(step, seed))}
      startAt={progress.status === "completed" ? 0 : progress.stepIndex}
      support={supportFor(level.level, profile)}
      conceptLabels={conceptLabels}
      exitHref="/hoje"
    />
  );
}

export default function LessonPage(props: PageProps<"/licao/[lessonId]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-24 h-96 w-full max-w-2xl rounded-2xl" />}>
      <Lesson params={props.params} />
    </Suspense>
  );
}
