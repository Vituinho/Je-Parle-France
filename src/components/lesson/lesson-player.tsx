"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  checkActivityAction,
  completeLessonAction,
  markSeenAction,
  saveStepAction,
} from "@/app/(focus)/licao/[lessonId]/actions";
import { VoiceNotice } from "@/components/activities/audio-button";
import { LineProgress } from "@/components/line-progress";
import { Button } from "@/components/ui/button";
import type { ConceptLabel } from "@/lib/content/repository";
import type { ClientActivity } from "@/lib/learning/activities/client";
import type { SupportMode } from "@/lib/learning/language-support";
import type { MasteryChange, SubmitResult } from "@/server/services/practice";
import { LessonSummary } from "./lesson-summary";
import { PracticeStep } from "./practice-step";
import { sendSessionTransition } from "./use-active-study-time";

export interface LessonPlayerProps {
  lessonId: string;
  title: string;
  steps: ClientActivity[];
  startAt: number;
  support: SupportMode;
  conceptLabels: Record<string, ConceptLabel>;
  exitHref: string;
  sessionId?: string;
  /** Micro-lesson: stop after this many steps and keep the rest for later. */
  maxSteps?: number;
  /** Called instead of showing the summary (daily session continues to the next block). */
  onFinished?: (summary: { score: number; changes: MasteryChange[] }) => void;
}

/**
 * Plays a lesson step by step. Steps answered wrong come back once at the end
 * (retrieval after a short delay), but the lesson score counts first attempts only.
 */
export function LessonPlayer({
  lessonId,
  title,
  steps,
  startAt,
  support,
  conceptLabels,
  exitHref,
  sessionId,
  maxSteps,
  onFinished,
}: LessonPlayerProps) {
  const initialQueue = useMemo(() => {
    const from = Math.min(startAt, steps.length - 1);
    const to = maxSteps ? Math.min(steps.length, from + maxSteps) : steps.length;
    return steps.map((_, index) => index).slice(from, to);
  }, [steps, startAt, maxSteps]);
  const [queue, setQueue] = useState(initialQueue);
  const [position, setPosition] = useState(0);
  const [firstScores, setFirstScores] = useState<Record<number, number>>({});
  const [requeued, setRequeued] = useState<Set<number>>(new Set());
  const [changes, setChanges] = useState<MasteryChange[]>([]);
  const [finished, setFinished] = useState<{
    score: number;
    next: { id: string; title: string } | null;
  } | null>(null);

  const stepIndex = queue[position] ?? 0;
  const activity = steps[stepIndex] as ClientActivity;
  const furthest = Math.max(...queue.slice(0, position + 1));

  const finish = useCallback(
    async (scores: Record<number, number>, allChanges: MasteryChange[]) => {
      const values = Object.values(scores);
      const score = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 1;
      const lastPlanned = initialQueue.at(-1) ?? 0;
      if (lastPlanned < steps.length - 1) {
        // Micro-lesson: remember where to resume tomorrow; the lesson is not complete yet.
        await saveStepAction({ lessonId, stepIndex: lastPlanned + 1 });
        onFinished?.({ score, changes: allChanges });
        return;
      }
      const next = await completeLessonAction({ lessonId, score });
      if (onFinished) {
        onFinished({ score, changes: allChanges });
        return;
      }
      setFinished({ score, next });
    },
    [initialQueue, lessonId, onFinished, steps.length],
  );

  const advance = useCallback(
    (result: SubmitResult | null) => {
      let nextScores = firstScores;
      let nextQueue = queue;
      let nextChanges = changes;
      if (result) {
        nextChanges = [...changes, ...result.changes];
        setChanges(nextChanges);
        if (!(stepIndex in firstScores)) {
          nextScores = { ...firstScores, [stepIndex]: result.feedback.score };
          setFirstScores(nextScores);
        }
        if (
          !result.feedback.correct &&
          result.feedback.verdict !== "recorded" &&
          !requeued.has(stepIndex)
        ) {
          nextQueue = [...queue, stepIndex];
          setQueue(nextQueue);
          setRequeued(new Set([...requeued, stepIndex]));
        }
      }
      if (position + 1 >= nextQueue.length) {
        void finish(nextScores, nextChanges);
        return;
      }
      const nextStep = nextQueue[position + 1] as number;
      setPosition(position + 1);
      if (nextStep > furthest) void saveStepAction({ lessonId, stepIndex: nextStep });
    },
    [changes, finish, firstScores, furthest, lessonId, position, queue, requeued, stepIndex],
  );

  if (finished) {
    return (
      <LessonSummary
        title={title}
        score={finished.score}
        changes={changes}
        conceptLabels={conceptLabels}
        next={finished.next}
        exitHref={exitHref}
      />
    );
  }

  const isRetry = position >= initialQueue.length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-5 pb-2 sm:px-8">
      <header className="flex items-center gap-4">
        <Button
          asChild
          variant="ghost"
          size="icon-lg"
          aria-label="Sair da lição (o progresso fica salvo)"
        >
          <Link
            href={exitHref}
            onClick={() => {
              if (sessionId) void sendSessionTransition(sessionId, "pause");
            }}
          >
            <X />
          </Link>
        </Button>
        <LineProgress
          showLabels={false}
          ariaLabel={`Progresso da lição ${title}`}
          stations={steps.map((step, index) => ({
            id: step.id,
            label: `Etapa ${index + 1}`,
            state: index < furthest ? "done" : index === furthest ? "current" : "upcoming",
          }))}
        />
      </header>
      <VoiceNotice className="mt-4" />
      <p className="text-muted-foreground mt-6 text-sm">
        {title}
        {isRetry && " · Revendo o que ficou para trás"}
      </p>
      <div className="mt-4 flex flex-1 flex-col">
        <PracticeStep
          sessionId={sessionId}
          key={`${stepIndex}-${position}`}
          instanceKey={`${activity.id}-${position}`}
          activity={activity}
          support={support}
          onSeen={async (durationMs) => {
            await markSeenAction({ lessonId, activityId: activity.id, durationMs });
          }}
          onCheck={({ response, hinted, durationMs }) =>
            checkActivityAction({
              lessonId,
              activityId: activity.id,
              response,
              hinted,
              durationMs,
              sessionId,
            })
          }
          onContinue={advance}
        />
      </div>
    </div>
  );
}
