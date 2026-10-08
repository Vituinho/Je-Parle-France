"use client";

import { ArrowLeft, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AudioButton, VoiceNotice } from "@/components/activities/audio-button";
import { Inline, RichText } from "@/components/activities/rich-text";
import { NoteBox } from "@/components/activities/renderers/teach";
import { Fr } from "@/components/fr";
import { ReviewPlayer, type ReviewSummary } from "@/components/lesson/review-player";
import { Button } from "@/components/ui/button";
import { distinctFrench } from "@/lib/content/localized";
import type { GrammarConcept } from "@/lib/content/schema";
import type { SupportMode } from "@/lib/learning/language-support";
import { MASTERY_LABELS } from "@/lib/learning/memory/memory";
import { DIMENSION_LABELS } from "@/lib/learning/skills";
import type { DimensionState } from "@/server/services/library";
import type { PreparedReviewItem } from "@/server/services/review";

/**
 * A grammar topic as a reference page: explanation in the learner's support
 * language, the Brazilian contrast, typical mistakes, examples with audio, and
 * a short drill that counts as practice.
 */
export function GrammarTopic({
  concept,
  dimensions,
  lessons,
  related,
  drill,
  date,
  support,
}: {
  concept: GrammarConcept;
  dimensions: DimensionState[];
  lessons: { id: string; title: string; unit: string }[];
  related: { slug: string; title: string }[];
  drill: PreparedReviewItem[];
  date: string;
  support: SupportMode;
}) {
  const [drilling, setDrilling] = useState(false);
  const [last, setLast] = useState<ReviewSummary | null>(null);
  const french = concept.explanation.fr;
  const [showPt, setShowPt] = useState(!french || support === "pt" || support === "pt-fr");

  if (drilling) {
    return (
      <ReviewPlayer
        items={drill}
        date={date}
        support={support}
        lab
        title={`Treino · ${concept.title.pt}`}
        exitHref={`/gramatica/${concept.id.replace("gram:", "")}`}
        onFinished={(summary) => {
          setLast(summary);
          setDrilling(false);
        }}
      />
    );
  }

  const paragraphs = showPt || !french ? concept.explanation.pt : french;

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-5 pb-12 sm:px-8">
      <Button asChild variant="ghost" size="icon-lg" aria-label="Voltar para a gramática">
        <Link href="/gramatica">
          <ArrowLeft />
        </Link>
      </Button>

      <header className="mt-4">
        {distinctFrench(concept.title) && (
          <Fr as="p" className="text-primary text-xl">
            {distinctFrench(concept.title)}
          </Fr>
        )}
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">{concept.title.pt}</h1>
        <p className="text-muted-foreground mt-2 text-lg leading-relaxed">
          <Inline text={concept.summary.pt} />
        </p>
        <p className="text-muted-foreground mt-3 text-sm">
          {concept.level} ·{" "}
          {dimensions
            .map(
              (d) => `${DIMENSION_LABELS[d.dimension]}: ${MASTERY_LABELS[d.state].toLowerCase()}`,
            )
            .join(" · ")}
        </p>
      </header>

      {last && (
        <p role="status" className="bg-success-soft mt-6 rounded-xl px-4 py-3">
          Treino concluído:{" "}
          <strong>
            {last.correct} de {last.answered}
          </strong>{" "}
          certos de primeira.
        </p>
      )}

      <section aria-labelledby="explanation" className="mt-10">
        <h2 id="explanation" className="text-xl font-bold">
          Como funciona
        </h2>
        <div
          lang={showPt || !french ? "pt-BR" : "fr"}
          className={showPt || !french ? "" : "font-fr text-[1.08rem]"}
        >
          {paragraphs.map((paragraph) => (
            <RichText key={paragraph} text={paragraph} className="mt-4 leading-relaxed" />
          ))}
        </div>
        {french && (
          <button
            type="button"
            onClick={() => setShowPt((value) => !value)}
            className="text-primary mt-3 text-sm font-medium underline-offset-4 hover:underline"
          >
            {showPt ? "Ler em francês" : "Explicar em português"}
          </button>
        )}
        {concept.brazilianNote && (
          <aside className="border-chart-2 bg-success-soft/60 mt-6 rounded-2xl border-l-[3px] px-4 py-3">
            <p className="mb-1 text-sm font-semibold">Para brasileiros</p>
            <RichText text={concept.brazilianNote} className="leading-relaxed" />
          </aside>
        )}
      </section>

      <section aria-labelledby="examples" className="mt-10">
        <h2 id="examples" className="text-xl font-bold">
          Exemplos
        </h2>
        <VoiceNotice className="mt-3" />
        <ul className="border-border bg-card divide-border mt-4 divide-y rounded-2xl border">
          {concept.examples.map((example) => (
            <li key={example.fr} className="flex items-center gap-4 px-4 py-3.5">
              <AudioButton
                size="sm"
                showSlow={false}
                lines={[
                  { text: example.fr, region: concept.region === "fr-CA" ? "fr-CA" : "fr-FR" },
                ]}
                label={`Ouvir: ${example.fr}`}
              />
              <div className="min-w-0">
                <Fr as="p" className="text-[1.25rem] leading-snug">
                  {example.fr}
                </Fr>
                <p className="text-muted-foreground text-sm">{example.pt}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {concept.commonMistakes.length > 0 && (
        <section aria-labelledby="mistakes" className="mt-10">
          <h2 id="mistakes" className="text-xl font-bold">
            Erros comuns
          </h2>
          <ul className="mt-4 space-y-5">
            {concept.commonMistakes.map((mistake) => (
              <li key={mistake.wrong} className="border-destructive border-l-[3px] pl-4">
                <p className="text-lg">
                  <Fr className="correction">{mistake.wrong}</Fr>
                  <span className="text-muted-foreground mx-2" aria-hidden>
                    →
                  </span>
                  <span className="sr-only">, o certo é </span>
                  <Fr className="highlight">{mistake.right}</Fr>
                </p>
                <RichText
                  text={mistake.why}
                  className="text-muted-foreground mt-1 leading-relaxed"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {concept.notes.length > 0 && (
        <div className="mt-10 space-y-4">
          {concept.notes.map((note, index) => (
            <NoteBox key={index} note={note} support={support} />
          ))}
        </div>
      )}

      <section aria-labelledby="train" className="border-border mt-12 border-t pt-8">
        <h2 id="train" className="text-xl font-bold">
          Praticar
        </h2>
        {drill.length > 0 ? (
          <>
            <p className="text-muted-foreground mt-1">
              {drill.length} exercícios. Contam como prática, mas não substituem a revisão espaçada.
            </p>
            <Button
              type="button"
              onClick={() => setDrilling(true)}
              className="mt-4 h-12 rounded-xl px-6 text-base"
            >
              <Dumbbell /> Começar o treino
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground mt-1">Ainda não há exercícios para este tema.</p>
        )}
        {lessons.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold">Onde aparece no curso</h3>
            <ul className="mt-2 space-y-1">
              {lessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    href={`/licao/${lesson.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {lesson.title}
                  </Link>
                  <span className="text-muted-foreground text-sm"> · {lesson.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {related.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold">Temas relacionados</h3>
            <ul className="mt-2 space-y-1">
              {related.map((topic) => (
                <li key={topic.slug}>
                  <Link
                    href={`/gramatica/${topic.slug}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {topic.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
