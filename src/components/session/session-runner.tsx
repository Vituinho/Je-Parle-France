"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  completeBlockAction,
  extraSessionAction,
  checkSessionPracticeAction,
} from "@/app/(focus)/sessao/actions";
import { Fr } from "@/components/fr";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { ReviewPlayer } from "@/components/lesson/review-player";
import { LineProgress } from "@/components/line-progress";
import { Button } from "@/components/ui/button";
import type { ConceptLabel } from "@/lib/content/repository";
import type { ClientActivity } from "@/lib/learning/activities/client";
import type { SupportMode } from "@/lib/learning/language-support";
import type { PreparedReviewItem } from "@/server/services/review";
import type { LearningSegment } from "@/lib/learning/planner/planner";

export type BlockPayload = { title: string; reason: string; seconds: number } & (
  | { kind: "review" | "focus"; items: PreparedReviewItem[]; authored?: boolean }
  | {
      kind: "lesson";
      lessonId: string;
      lessonTitle: string;
      steps: ClientActivity[];
      startAt: number;
      maxSteps?: number;
      alreadyDone?: boolean;
      conceptLabels: Record<string, ConceptLabel>;
    }
  | { kind: "conversation"; scenarioId: string }
);

const minutesLabel = (seconds: number) => `${Math.max(1, Math.round(seconds / 60))} min`;

/**
 * The daily session: an overview drawn as a métro line, then each block in
 * order. Progress is saved after every block, so the learner can stop and
 * come back later the same day.
 */
export function SessionRunner({
  sessionId,
  date,
  plannedMinutes,
  blocks,
  initialCursor,
  support,
  extra,
  segments,
  targetMinutes,
  recordedSeconds,
}: {
  sessionId: string;
  date: string;
  plannedMinutes: number;
  blocks: BlockPayload[];
  initialCursor: number;
  support: SupportMode;
  extra: boolean;
  segments: LearningSegment[];
  targetMinutes: number;
  recordedSeconds: number;
}) {
  const [cursor, setCursor] = useState(initialCursor);
  const [playing, setPlaying] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(recordedSeconds);
  const finished = cursor >= blocks.length;
  const block = blocks[cursor];
  const segmentIndex = Math.max(
    0,
    segments.findIndex((s) => cursor < s.end),
  );
  const atBreak = cursor > 0 && !finished && segments.some((s) => s.end === cursor);

  function blockDone() {
    startTransition(async () => {
      const result = await completeBlockAction({ sessionId, blockIndex: cursor });
      if (!result.ok || result.cursor === undefined) {
        setError("Não foi possível salvar. Tente continuar novamente.");
        setPlaying(false);
        return;
      }
      setError(null);
      setCursor(result.cursor);
      setSeconds(result.recordedSeconds ?? seconds);
      setPlaying(false);
    });
  }

  if (playing && block && !pending) {
    if (block.kind === "lesson") {
      return (
        <LessonPlayer
          lessonId={block.lessonId}
          title={block.lessonTitle}
          steps={block.steps}
          startAt={block.startAt}
          maxSteps={block.maxSteps}
          support={support}
          conceptLabels={block.conceptLabels}
          exitHref="/hoje"
          sessionId={sessionId}
          onFinished={blockDone}
        />
      );
    }
    if (block.kind === "review" || block.kind === "focus") {
      return (
        <ReviewPlayer
          items={block.items}
          date={date}
          support={support}
          title={block.title}
          exitHref="/hoje"
          sessionId={sessionId}
          onFinished={blockDone}
          check={
            block.authored
              ? (input) => checkSessionPracticeAction({ ...input, sessionId })
              : undefined
          }
        />
      );
    }
  }

  const stations = blocks.map((item, index) => ({
    id: `${index}`,
    label: item.title,
    detail:
      index === cursor && !finished
        ? `${minutesLabel(item.seconds)} · ${item.reason}`
        : minutesLabel(item.seconds),
    state: (index < cursor ? "done" : index === cursor ? "current" : "upcoming") as
      "done" | "current" | "upcoming",
  }));

  return (
    <div
      data-session-id={sessionId}
      data-session-cursor={cursor}
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-5 pb-8 sm:px-8"
    >
      <header className="flex items-center justify-between">
        <Button asChild variant="ghost" size="icon-lg" aria-label="Voltar para hoje">
          <Link href="/hoje">
            <X />
          </Link>
        </Button>
        <span className="text-muted-foreground text-sm">
          {extra ? "Prática extra" : "Sessão de hoje"}
        </span>
      </header>
      {error && (
        <p role="alert" className="text-destructive mt-4">
          {error}
        </p>
      )}

      <p className="text-muted-foreground mt-4 text-sm" aria-live="polite">
        Tempo registrado hoje: {Math.floor(seconds / 60)} min · Meta diária: {targetMinutes} min.{" "}
        Plano: ~{plannedMinutes} min. O tempo é uma referência; suas respostas mostram o
        aprendizado.
      </p>
      {finished ? (
        <div className="mt-10">
          <Fr as="p" className="text-primary text-2xl">
            {"Bravo, c'est fait !"}
          </Fr>
          <h1 className="mt-1 text-[2rem] leading-tight font-bold">Sessão concluída</h1>
          <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
            Seu progresso ficou salvo. As revisões seguem seu calendário; a prática extra não
            antecipa revisões. Amanhã o plano considera suas respostas.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 rounded-xl px-6 text-base">
              <Link href="/hoje">Voltar para hoje</Link>
            </Button>
            <form action={extraSessionAction}>
              <Button
                type="submit"
                variant="outline"
                className="h-12 w-full rounded-xl px-6 text-base"
              >
                Praticar mais um pouco
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-1 flex-col">
          <Fr as="p" className="text-primary text-xl">
            {cursor === 0 ? "On y va ?" : "On continue ?"}
          </Fr>
          <h1 className="mt-1 text-[2rem] leading-tight font-bold">
            {cursor === 0
              ? `Sua sessão de hoje · ~${plannedMinutes} min`
              : `Próximo: ${block?.title}`}
          </h1>
          <LineProgress
            orientation="vertical"
            stations={
              segments.length > 1
                ? stations.slice(segments[segmentIndex]!.start, segments[segmentIndex]!.end)
                : stations
            }
            className="mt-8"
            ariaLabel="Etapas da sessão"
          />

          {segments.length > 1 && (
            <section className="mt-5 space-y-3" aria-label="Blocos do dia">
              <p className="font-semibold">
                Bloco {segmentIndex + 1} de {segments.length} · {segments.length - segmentIndex - 1}{" "}
                depois deste
              </p>
              {atBreak && <h2 className="text-lg font-bold">Bloco {segmentIndex} concluído</h2>}
              <p className="text-muted-foreground text-sm">
                {atBreak ? "Boa hora para uma pausa. " : "Você pode pausar quando precisar. "}
                Faça o próximo bloco agora ou mais tarde; o progresso fica salvo.
              </p>
            </section>
          )}
          <Button asChild variant="outline" className="mt-5 h-11 rounded-xl">
            <Link href="/hoje">Pausar e continuar mais tarde</Link>
          </Button>
          {block?.kind === "conversation" ? (
            <div className="border-border bg-card mt-6 rounded-2xl border p-5">
              <p className="font-semibold">{block.title}</p>
              <p className="text-muted-foreground mt-1">{block.reason}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button asChild className="h-11 rounded-xl px-5">
                  <Link href={`/tutor?cenario=${block.scenarioId}&sessao=${sessionId}`}>
                    Abrir conversa
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl px-5"
                  onClick={blockDone}
                >
                  Pular por hoje
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-background/95 sticky bottom-0 mt-auto pt-8 pb-2 backdrop-blur">
              <Button
                type="button"
                onClick={() => {
                  // A review block can end up empty if its items were reviewed elsewhere today.
                  if (
                    block &&
                    (block.kind === "review" || block.kind === "focus") &&
                    block.items.length === 0
                  ) {
                    blockDone();
                    return;
                  }
                  if (block?.kind === "lesson" && block.alreadyDone) {
                    blockDone();
                    return;
                  }
                  setPlaying(true);
                }}
                disabled={pending || !block}
                className="h-12 w-full rounded-xl text-base"
              >
                {pending ? "Salvando…" : cursor === 0 ? "Começar" : "Continuar"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
