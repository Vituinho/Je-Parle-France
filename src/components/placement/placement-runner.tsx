"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { answerPlacementAction } from "@/app/(focus)/diagnostico/actions";
import { ActivityRenderer } from "@/components/activities/activity-renderer";
import { emptyDraft, isAnswerable, toResponse, type Draft } from "@/components/activities/draft";
import { LocalizedText } from "@/components/activities/localized-text";
import { VoiceNotice } from "@/components/activities/audio-button";
import { LineProgress } from "@/components/line-progress";
import { Button } from "@/components/ui/button";
import type { Phase } from "@/lib/learning/placement/engine";
import { SKILL_LABELS } from "@/lib/learning/skills";
import type { PlacementView } from "@/server/services/placement";

type InProgress = Extract<PlacementView, { status: "in_progress" }>;

function phaseLabel(phase: Phase): string {
  if (phase.kind === "calibration") return "Aquecimento";
  if (phase.kind === "self_assessment")
    return `Autoavaliação: ${SKILL_LABELS[phase.skill].pt.toLowerCase()}`;
  return SKILL_LABELS[phase.skill].pt;
}

/**
 * Runs the adaptive placement: one item at a time, no right/wrong feedback
 * (so the test measures rather than teaches), progress shown by block because
 * the number of items adapts to the learner.
 */
export function PlacementRunner({ initialView }: { initialView: InProgress }) {
  const router = useRouter();
  const [view, setView] = useState<InProgress>(initialView);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(initialView.activity));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(0);
  const heading = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    heading.current?.focus();
  }, [view.itemId]);

  function submit(dontKnow: boolean) {
    if (pending) return;
    if (!dontKnow && !isAnswerable(view.activity, draft)) return;
    setError(null);
    const response = dontKnow ? { kind: "dont_know" as const } : toResponse(view.activity, draft);
    startTransition(async () => {
      const result = await answerPlacementAction({
        attemptId: view.attemptId,
        itemId: view.itemId,
        response,
        durationMs: Date.now() - startedAt.current,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.view.status === "completed") {
        router.replace(`/diagnostico/${view.attemptId}/resultado`);
        return;
      }
      setView(result.view);
      setDraft(emptyDraft(result.view.activity));
    });
  }

  const instruction = view.activity.type !== "teach" ? view.activity.instruction : undefined;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-5 pb-6 sm:px-8">
      <header className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon-lg" aria-label="Sair (seu progresso fica salvo)">
          <Link href="/hoje">
            <X />
          </Link>
        </Button>
        <LineProgress
          showLabels={false}
          ariaLabel="Etapas do diagnóstico"
          stations={view.blocks.map((block, index) => ({
            id: `${block.kind}-${"skill" in block ? block.skill : index}`,
            label: phaseLabel(block),
            state:
              index < view.block.index
                ? "done"
                : index === view.block.index
                  ? "current"
                  : "upcoming",
          }))}
        />
      </header>

      <VoiceNotice className="mt-4" />
      <div ref={heading} tabIndex={-1} className="mt-8 outline-none">
        <p className="text-muted-foreground text-sm">
          Etapa {view.block.index + 1} de {view.block.total} · {phaseLabel(view.phase)}
        </p>
        {instruction && (
          <p className="mt-1 text-lg font-semibold">
            <LocalizedText value={instruction} support="pt-fr" />
          </p>
        )}
      </div>

      <form
        className="mt-6 flex flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          submit(false);
        }}
      >
        <div className="flex-1" key={view.itemId}>
          <ActivityRenderer
            activity={view.activity}
            draft={draft}
            onDraft={setDraft}
            locked={pending}
            support="pt-fr"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="text-destructive bg-destructive-soft mt-6 rounded-lg px-3 py-2 text-sm"
          >
            {error}
          </p>
        )}

        <div className="bg-background/95 sticky bottom-0 mt-8 flex gap-3 py-4 backdrop-blur">
          {view.activity.type !== "self_assess" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => submit(true)}
              disabled={pending}
              className="h-12 flex-1 rounded-xl text-base sm:flex-none sm:px-6"
            >
              Não sei
            </Button>
          )}
          <Button
            type="submit"
            disabled={pending || !isAnswerable(view.activity, draft)}
            className="h-12 flex-1 rounded-xl text-base sm:ml-auto sm:flex-none sm:px-8"
          >
            {pending ? "Enviando…" : "Responder"}
          </Button>
        </div>
      </form>
    </div>
  );
}
