"use client";

import { ArrowLeft, Ear, Mic } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AudioButton, VoiceNotice } from "@/components/activities/audio-button";
import { RichText } from "@/components/activities/rich-text";
import { Fr } from "@/components/fr";
import { ReviewPlayer, type ReviewSummary } from "@/components/lesson/review-player";
import { Button } from "@/components/ui/button";
import type { PronunciationConcept } from "@/lib/content/schema";
import type { SupportMode } from "@/lib/learning/language-support";
import type { PreparedReviewItem } from "@/server/services/review";

type Mode = "overview" | "perception" | "production";

/**
 * One sound, end to end: understand the articulation, hear the contrast,
 * then produce it. Drills are practice (they update memory) but do not
 * replace spaced review.
 */
export function PronunciationLab({
  target,
  perception,
  production,
  date,
  support,
}: {
  target: PronunciationConcept;
  perception: PreparedReviewItem[];
  production: PreparedReviewItem[];
  date: string;
  support: SupportMode;
}) {
  const [mode, setMode] = useState<Mode>("overview");
  const [last, setLast] = useState<{ mode: Mode; summary: ReviewSummary } | null>(null);

  if (mode !== "overview") {
    const items = mode === "perception" ? perception : production;
    return (
      <ReviewPlayer
        items={items}
        date={date}
        support={support}
        lab
        title={mode === "perception" ? `Ouvido · ${target.title.pt}` : `Fala · ${target.title.pt}`}
        exitHref="/pronuncia"
        onFinished={(summary) => {
          setLast({ mode, summary });
          setMode("overview");
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-5 pb-12 sm:px-8">
      <Button asChild variant="ghost" size="icon-lg" aria-label="Voltar ao laboratório">
        <Link href="/pronuncia">
          <ArrowLeft />
        </Link>
      </Button>

      <header className="mt-4">
        <p className="font-fr text-primary text-3xl">{target.ipa}</p>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">{target.title.pt}</h1>
        <RichText
          text={target.description.pt}
          className="text-muted-foreground mt-3 text-lg leading-relaxed"
        />
      </header>

      <VoiceNotice className="mt-6" />

      {last && (
        <p role="status" className="bg-success-soft mt-6 rounded-xl px-4 py-3">
          {last.mode === "perception" ? "Treino de percepção" : "Treino de fala"} concluído:{" "}
          <strong>
            {last.summary.correct} de {last.summary.answered}
          </strong>{" "}
          certos de primeira.
        </p>
      )}

      <section aria-labelledby="mouth" className="mt-10">
        <h2 id="mouth" className="text-xl font-bold">
          Como fazer
        </h2>
        <ol className="mt-4 space-y-3">
          {target.articulation.map((step, index) => (
            <li key={step} className="flex gap-3 leading-relaxed">
              <span className="bg-secondary text-secondary-foreground grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold">
                {index + 1}
              </span>
              <RichText text={step} />
            </li>
          ))}
        </ol>
        <aside className="border-chart-2 bg-success-soft/60 mt-6 rounded-2xl border-l-[3px] px-4 py-3">
          <p className="mb-1 text-sm font-semibold">Para brasileiros</p>
          <RichText text={target.brazilianNote} className="leading-relaxed" />
        </aside>
      </section>

      <section aria-labelledby="examples" className="mt-10">
        <h2 id="examples" className="text-xl font-bold">
          Exemplos
        </h2>
        <ul className="border-border bg-card divide-border mt-4 divide-y rounded-2xl border">
          {target.examples.map((example) => (
            <li key={example.word} className="flex items-center gap-4 px-4 py-3">
              <AudioButton
                size="sm"
                lines={[{ text: example.word }]}
                label={`Ouvir: ${example.word}`}
              />
              <Fr className="text-xl">{example.word}</Fr>
              <span className="text-muted-foreground font-mono text-sm">{example.ipa}</span>
              {example.pt && (
                <span className="text-muted-foreground ml-auto text-sm">{example.pt}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {target.minimalPairs.length > 0 && (
        <section aria-labelledby="pairs" className="mt-10">
          <h2 id="pairs" className="text-xl font-bold">
            Pares mínimos
          </h2>
          <p className="text-muted-foreground mt-1">
            Palavras que só mudam por esse som. Ouça uma, depois a outra.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {target.minimalPairs.map(([a, b]) => (
              <li
                key={`${a.word}-${b.word}`}
                className="border-border bg-card flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
              >
                {[a, b].map((word) => (
                  <span key={word.word} className="flex items-center gap-2">
                    <AudioButton
                      size="sm"
                      showSlow={false}
                      lines={[{ text: word.word }]}
                      label={`Ouvir: ${word.word}`}
                    />
                    <span>
                      <Fr className="block text-lg leading-tight">{word.word}</Fr>
                      <span className="text-muted-foreground font-mono text-xs">{word.ipa}</span>
                    </span>
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="train" className="border-border mt-12 border-t pt-8">
        <h2 id="train" className="text-xl font-bold">
          Treinar
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            onClick={() => setMode("perception")}
            disabled={perception.length === 0}
            className="h-auto flex-col items-start gap-1 rounded-2xl px-5 py-4 text-left"
          >
            <span className="flex items-center gap-2 text-base font-semibold">
              <Ear /> Ouvido · {perception.length} rodadas
            </span>
            <span className="text-primary-foreground/80 text-sm font-normal whitespace-normal">
              Ouça e diga qual palavra foi dita.
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMode("production")}
            disabled={production.length === 0}
            className="h-auto flex-col items-start gap-1 rounded-2xl px-5 py-4 text-left"
          >
            <span className="flex items-center gap-2 text-base font-semibold">
              <Mic /> Fala · {production.length} rodadas
            </span>
            <span className="text-muted-foreground text-sm font-normal whitespace-normal">
              Grave as palavras-chave e compare com o modelo.
            </span>
          </Button>
        </div>
      </section>
    </div>
  );
}
