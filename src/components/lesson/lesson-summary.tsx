"use client";

import Link from "next/link";
import { Fr } from "@/components/fr";
import { Button } from "@/components/ui/button";
import type { ConceptLabel } from "@/lib/content/repository";
import { MASTERY_LABELS, MASTERY_VALUE } from "@/lib/learning/memory/memory";
import { DIMENSION_LABELS } from "@/lib/learning/skills";
import type { MasteryChange } from "@/server/services/practice";

function Label({ label }: { label: ConceptLabel }) {
  return label.lang === "fr" ? (
    <Fr className="text-lg">{label.text}</Fr>
  ) : (
    <span className="font-semibold">{label.text}</span>
  );
}

/**
 * End of a lesson. Honest about what happened: a first practice puts items in
 * "learning" — that is not mastery yet, so it is reported as practice, and only
 * items that reached "familiar" or better are called firmer.
 */
export function LessonSummary({
  title,
  score,
  changes,
  conceptLabels,
  next,
  exitHref,
}: {
  title: string;
  score: number;
  changes: MasteryChange[];
  conceptLabels: Record<string, ConceptLabel>;
  next: { id: string; title: string } | null;
  exitHref: string;
}) {
  const latest = new Map<string, MasteryChange>();
  for (const change of changes) {
    const key = `${change.conceptId}#${change.dimension}`;
    const first = latest.get(key);
    latest.set(key, { ...change, before: first?.before ?? change.before });
  }
  const practisedConcepts = new Set(changes.map((change) => change.conceptId));
  const firmer = [...latest.values()].filter(
    (change) =>
      MASTERY_VALUE[change.after] >= MASTERY_VALUE.familiar &&
      MASTERY_VALUE[change.after] > MASTERY_VALUE[change.before],
  );
  const percent = Math.round(score * 100);
  const message =
    percent >= 90
      ? "Très bien !"
      : percent >= 70
        ? "Bien joué !"
        : percent >= 50
          ? "Ça avance !"
          : "On continue !";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-12 sm:px-8">
      <Fr as="p" className="text-primary text-2xl">
        {message}
      </Fr>
      <h1 className="mt-1 text-[2rem] leading-tight font-bold">Lição concluída</h1>
      <p className="text-muted-foreground mt-2">{title}</p>

      <dl className="border-border mt-8 grid grid-cols-2 gap-4 border-y py-6">
        <div>
          <dt className="text-muted-foreground text-sm">Acertos na primeira tentativa</dt>
          <dd className="mt-1 text-3xl font-bold">{percent}%</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">Itens praticados</dt>
          <dd className="mt-1 text-3xl font-bold">{practisedConcepts.size}</dd>
        </div>
      </dl>

      {firmer.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">Ficou mais firme</h2>
          <ul className="mt-3 space-y-2">
            {firmer.slice(0, 8).map((change) => (
              <li
                key={`${change.conceptId}-${change.dimension}`}
                className="flex flex-wrap items-baseline gap-x-2"
              >
                <Label
                  label={conceptLabels[change.conceptId] ?? { text: change.conceptId, lang: "pt" }}
                />
                <span className="text-muted-foreground text-sm">
                  {DIMENSION_LABELS[change.dimension].toLowerCase()}:{" "}
                  {MASTERY_LABELS[change.after].toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {practisedConcepts.size > 0 && (
        <p className="text-muted-foreground mt-8 leading-relaxed">
          O que você praticou entrou na sua revisão. Cada item volta quando estiver prestes a ser
          esquecido — é assim que ele passa de “aprendendo” para “firme”.
        </p>
      )}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {next && (
          <Button asChild className="h-12 rounded-xl px-6 text-base">
            <Link href={`/licao/${next.id}`}>Próxima lição: {next.title}</Link>
          </Button>
        )}
        <Button
          asChild
          variant={next ? "outline" : "default"}
          className="h-12 rounded-xl px-6 text-base"
        >
          <Link href={exitHref}>Voltar para hoje</Link>
        </Button>
      </div>
    </div>
  );
}
