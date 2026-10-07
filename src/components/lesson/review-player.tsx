"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { checkReviewAction } from "@/app/(focus)/revisar/actions";
import { VoiceNotice } from "@/components/activities/audio-button";
import { Fr } from "@/components/fr";
import { Button } from "@/components/ui/button";
import type { SupportMode } from "@/lib/learning/language-support";
import type { SubmitResult } from "@/server/services/practice";
import type { PreparedReviewItem } from "@/server/services/review";
import { PracticeStep } from "./practice-step";

export interface ReviewSummary {
  answered: number;
  correct: number;
}

/**
 * Plays review (or skill-focus) items. Items missed come back once at the end;
 * the summary counts first attempts.
 */
export function ReviewPlayer({
  items,
  date,
  support,
  title,
  exitHref,
  sessionId,
  onFinished,
}: {
  items: PreparedReviewItem[];
  date: string;
  support: SupportMode;
  title: string;
  exitHref: string;
  sessionId?: string;
  onFinished?: (summary: ReviewSummary) => void;
}) {
  const [queue, setQueue] = useState(() => items.map((_, index) => index));
  const [position, setPosition] = useState(0);
  const [first, setFirst] = useState<Record<number, boolean>>({});
  const [requeued, setRequeued] = useState<Set<number>>(new Set());
  const [done, setDone] = useState<ReviewSummary | null>(null);

  const itemIndex = queue[position] ?? 0;
  const item = items[itemIndex];

  const advance = useCallback(
    (result: SubmitResult | null) => {
      let nextFirst = first;
      let nextQueue = queue;
      if (result) {
        if (!(itemIndex in first)) {
          nextFirst = { ...first, [itemIndex]: result.feedback.correct };
          setFirst(nextFirst);
        }
        if (
          !result.feedback.correct &&
          result.feedback.verdict !== "recorded" &&
          !requeued.has(itemIndex)
        ) {
          nextQueue = [...queue, itemIndex];
          setQueue(nextQueue);
          setRequeued(new Set([...requeued, itemIndex]));
        }
      }
      if (position + 1 >= nextQueue.length) {
        const summary = {
          answered: Object.keys(nextFirst).length,
          correct: Object.values(nextFirst).filter(Boolean).length,
        };
        if (onFinished) onFinished(summary);
        else setDone(summary);
        return;
      }
      setPosition(position + 1);
    },
    [first, itemIndex, onFinished, position, queue, requeued],
  );

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-12 sm:px-8">
        <Fr as="p" className="text-primary text-2xl">
          Révision terminée.
        </Fr>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">Revisão concluída</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          {done.correct} de {done.answered} certos de primeira. Cada item foi reagendado conforme a
          sua resposta.
        </p>
        <Button asChild className="mt-8 h-12 w-full rounded-xl text-base sm:w-auto sm:px-8">
          <Link href={exitHref}>Voltar para hoje</Link>
        </Button>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-5 pb-2 sm:px-8">
      <header className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon-lg" aria-label="Sair da revisão">
          <Link href={exitHref}>
            <X />
          </Link>
        </Button>
        <div
          className="bg-muted h-2 flex-1 overflow-hidden rounded-full"
          role="progressbar"
          aria-label="Progresso da revisão"
          aria-valuemin={0}
          aria-valuemax={queue.length}
          aria-valuenow={position}
        >
          <div
            className="bg-primary h-full rounded-full transition-[width]"
            style={{ width: `${(position / queue.length) * 100}%` }}
          />
        </div>
        <span className="text-muted-foreground text-sm tabular-nums">
          {Math.min(position + 1, queue.length)}/{queue.length}
        </span>
      </header>
      <VoiceNotice className="mt-4" />
      <p className="text-muted-foreground mt-6 text-sm">{title}</p>
      <div className="mt-4 flex flex-1 flex-col">
        <PracticeStep
          key={`${item.key}-${position}`}
          activity={item.activity}
          support={support}
          onCheck={({ response, hinted, durationMs }) =>
            checkReviewAction({
              conceptId: item.conceptId,
              dimension: item.dimension,
              date,
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
