"use client";

import { Mic, RotateCcw, Square } from "lucide-react";
import { useState } from "react";
import { Fr } from "@/components/fr";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCapabilities } from "@/components/capabilities";
import { AudioButton } from "../audio-button";
import { PronunciationCheck } from "../pronunciation-check";
import { useRecorder } from "../recorder";
import { DiffView } from "./text";
import { OptionRow, PromptView, type RendererProps } from "./shared";

export function OrderRenderer({
  activity,
  draft,
  onDraft,
  locked,
  feedback,
}: RendererProps<"order">) {
  const picked = draft.kind === "order" ? draft.picked : [];
  const set = (next: number[]) => onDraft({ kind: "order", picked: next });
  return (
    <div className="space-y-6">
      {activity.translation && <p className="text-xl font-semibold">{activity.translation}</p>}
      <div
        aria-label="Sua frase"
        className={cn(
          "border-border flex min-h-16 flex-wrap items-center gap-2 border-b-2 pb-3",
          feedback && (feedback.correct ? "border-success" : "border-destructive"),
        )}
      >
        {picked.length === 0 && (
          <span className="text-muted-foreground">Toque nas palavras na ordem certa.</span>
        )}
        {picked.map((tokenIndex, position) => (
          <button
            key={`${tokenIndex}-${position}`}
            type="button"
            disabled={locked}
            onClick={() => set(picked.filter((_, p) => p !== position))}
            className="bg-accent border-primary/40 font-fr rounded-xl border px-3 py-1.5 text-xl"
          >
            {activity.tokens[tokenIndex]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Palavras disponíveis">
        {activity.tokens.map((token, index) => {
          const used = picked.includes(index);
          return (
            <button
              key={`${token}-${index}`}
              type="button"
              disabled={locked || used}
              onClick={() => set([...picked, index])}
              className={cn(
                "border-border bg-card hover:border-primary/50 font-fr rounded-xl border px-3 py-1.5 text-xl transition-opacity",
                used && "opacity-25",
              )}
            >
              {token}
            </button>
          );
        })}
      </div>
      {feedback && !feedback.correct && feedback.expected && (
        <p className="text-lg">
          <span className="text-muted-foreground text-sm">Ordem certa: </span>
          <Fr>{feedback.expected}</Fr>
        </p>
      )}
    </div>
  );
}

const PAIR_COLORS = [
  "bg-chart-1/15 border-chart-1",
  "bg-chart-2/15 border-chart-2",
  "bg-chart-3/15 border-chart-3",
  "bg-chart-4/15 border-chart-4",
  "bg-chart-5/15 border-chart-5",
  "bg-primary/10 border-primary",
];

export function MatchRenderer({
  activity,
  draft,
  onDraft,
  locked,
  feedback,
}: RendererProps<"match">) {
  const pairs = draft.kind === "pairs" ? draft.pairs : [];
  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const pairOfLeft = (l: number) => pairs.findIndex(([left]) => left === l);
  const pairOfRight = (r: number) => pairs.findIndex(([, right]) => right === r);
  const correct = (l: number, r: number) =>
    feedback?.correctPairs?.some(([cl, cr]) => cl === l && cr === r) ?? false;

  const chooseRight = (r: number) => {
    if (activeLeft === null) return;
    const next = pairs.filter(([left, right]) => left !== activeLeft && right !== r);
    next.push([activeLeft, r]);
    onDraft({ kind: "pairs", pairs: next });
    setActiveLeft(null);
  };

  const cellClass = (pairIndex: number, active: boolean, ok?: boolean) =>
    cn(
      "w-full rounded-2xl border-[1.5px] px-4 py-3 text-left transition-colors",
      pairIndex === -1
        ? "border-border bg-card hover:border-primary/40"
        : PAIR_COLORS[pairIndex % PAIR_COLORS.length],
      active && "ring-primary ring-2",
      ok === true && "border-success bg-success-soft",
      ok === false && "border-destructive bg-destructive-soft",
    );

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Toque em um item da esquerda e depois no par dele.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <ul className="space-y-2.5">
          {activity.left.map((text, l) => {
            const pairIndex = pairOfLeft(l);
            const pair = pairs[pairIndex];
            return (
              <li key={text}>
                <button
                  type="button"
                  disabled={locked}
                  aria-pressed={activeLeft === l}
                  onClick={() => setActiveLeft(activeLeft === l ? null : l)}
                  className={cellClass(
                    pairIndex,
                    activeLeft === l,
                    feedback && pair ? correct(pair[0], pair[1]) : undefined,
                  )}
                >
                  <span
                    lang={activity.leftLang}
                    className={activity.leftLang === "fr" ? "font-fr text-lg" : ""}
                  >
                    {text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <ul className="space-y-2.5">
          {activity.right.map((text, r) => {
            const pairIndex = pairOfRight(r);
            const pair = pairs[pairIndex];
            return (
              <li key={text}>
                <button
                  type="button"
                  disabled={locked || activeLeft === null}
                  onClick={() => chooseRight(r)}
                  className={cellClass(
                    pairIndex,
                    false,
                    feedback && pair ? correct(pair[0], pair[1]) : undefined,
                  )}
                >
                  <span
                    lang={activity.rightLang}
                    className={activity.rightLang === "fr" ? "font-fr text-lg" : ""}
                  >
                    {text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const SELF_RATINGS = [
  { value: 0 as const, label: "Ainda não saiu" },
  { value: 0.5 as const, label: "Quase" },
  { value: 1 as const, label: "Saiu bem" },
];

/**
 * Speaking without a speech provider: listen, record, compare with the model,
 * then rate yourself honestly. The recording never leaves the browser.
 */
export function SpeakRenderer({
  activity,
  draft,
  onDraft,
  locked,
  feedback,
}: RendererProps<"speak">) {
  const recorder = useRecorder();
  const { pronunciation } = useCapabilities();
  const rating = draft.kind === "speech" ? draft.selfRating : null;
  const assessed = draft.kind === "speech" && Boolean(draft.speechAttemptId);
  const canAssess = pronunciation && activity.mode !== "respond";
  const showText = activity.mode !== "respond" || locked;
  return (
    <div className="space-y-6">
      {activity.prompt && <PromptView prompt={activity.prompt} revealed={locked} />}
      <div className="border-border bg-card space-y-4 rounded-2xl border p-5">
        <div className="flex items-start gap-4">
          <AudioButton
            lines={[{ text: activity.text, region: activity.region }]}
            label="Ouvir o modelo"
          />
          {showText && (
            <div>
              <Fr as="p" className="text-2xl leading-snug">
                {activity.text}
              </Fr>
              {activity.translation && (
                <p className="text-muted-foreground mt-1">{activity.translation}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {recorder.state === "recording" ? (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={recorder.stop}
            className="h-12 rounded-xl px-5"
          >
            <Square className="fill-current" /> Parar gravação
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() =>
              recorder.state === "recorded" ? recorder.reset() : void recorder.start()
            }
            disabled={locked || recorder.state === "unsupported" || recorder.state === "denied"}
            className="h-12 rounded-xl px-5"
          >
            {recorder.state === "recorded" ? <RotateCcw /> : <Mic />}
            {recorder.state === "recorded" ? "Gravar de novo" : "Gravar minha voz"}
          </Button>
        )}
        {recorder.audioUrl && (
          <audio
            controls
            src={recorder.audioUrl}
            className="h-10 max-w-full"
            aria-label="Sua gravação"
          />
        )}
      </div>
      {canAssess && recorder.blob && (
        <PronunciationCheck
          key={recorder.audioUrl ?? "none"}
          recording={recorder.blob}
          referenceText={activity.text}
          locale={activity.region}
          activityId={activity.id}
          disabled={locked}
          onAssessed={(speechAttemptId) =>
            onDraft({ kind: "speech", selfRating: null, speechAttemptId })
          }
        />
      )}
      {recorder.state === "denied" && (
        <p className="text-muted-foreground text-sm" role="status">
          O microfone não foi liberado. Você ainda pode falar em voz alta e se avaliar.
        </p>
      )}
      {recorder.state === "unsupported" && (
        <p className="text-muted-foreground text-sm" role="status">
          Este navegador não grava áudio. Fale em voz alta e se avalie.
        </p>
      )}

      {!assessed && (
        <fieldset className="space-y-2.5">
          <legend className="mb-2 font-semibold">
            {canAssess ? "Ou compare com o modelo e se avalie:" : "Compare com o modelo. Como foi?"}
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {SELF_RATINGS.map((option, index) => (
              <OptionRow
                key={option.value}
                type="radio"
                name={`${activity.id}-rating`}
                index={index}
                label={option.label}
                lang="pt"
                disabled={locked}
                state={rating === option.value ? "selected" : "idle"}
                onSelect={() => onDraft({ kind: "speech", selfRating: option.value })}
              />
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            {canAssess
              ? "Para avaliar, a gravação é enviada ao serviço de fala e descartada logo depois; guardamos só as notas."
              : "Sua gravação fica só no seu navegador."}{" "}
            A autoavaliação conta como evidência mais fraca do que a avaliação automática.
          </p>
        </fieldset>
      )}
      {feedback?.diff && <DiffView diff={feedback.diff} />}
    </div>
  );
}
