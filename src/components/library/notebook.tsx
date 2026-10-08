"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AudioButton } from "@/components/activities/audio-button";
import { Inline } from "@/components/activities/rich-text";
import { Fr } from "@/components/fr";
import { Input } from "@/components/ui/input";
import { foldText } from "@/lib/content/localized";
import { MASTERY_LABELS, MASTERY_VALUE, type MasteryState } from "@/lib/learning/memory/memory";
import type { Dimension } from "@/lib/learning/skills";
import { cn } from "@/lib/utils";
import type { NotebookCorrection, NotebookWord } from "@/server/services/library";

const DIMENSION_SHORT: Record<Dimension, string> = {
  recognition: "Lê",
  recall: "Escreve",
  listening: "Ouve",
  speaking: "Fala",
  writing: "Usa",
  pronunciation: "Pronuncia",
};

const POS: Record<NotebookWord["pos"], string> = {
  noun: "subst.",
  verb: "verbo",
  adjective: "adj.",
  adverb: "adv.",
  pronoun: "pron.",
  preposition: "prep.",
  determiner: "det.",
  conjunction: "conj.",
  number: "números",
  interjection: "interj.",
  expression: "expressão",
};

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "review", label: "Para revisar" },
  { id: "learning", label: "Aprendendo" },
  { id: "strong", label: "Firmes" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

function dotClass(state: MasteryState) {
  switch (state) {
    case "unseen":
      return "border-border bg-background";
    case "introduced":
      return "border-primary/50 bg-background";
    case "learning":
      return "border-primary/40 bg-primary/25";
    case "decaying":
      return "border-destructive bg-destructive/60";
    case "familiar":
      return "border-primary/70 bg-primary/60";
    case "strong":
      return "border-primary bg-primary";
    case "mastered":
      return "border-success bg-success";
  }
}

const relative = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

function reviewLabel(iso: string | null, now: number): string | null {
  if (!iso) return null;
  const days = Math.round((new Date(iso).getTime() - now) / 86_400_000);
  if (days <= 0) return "revisão: agora";
  return `revisão: ${relative.format(days, "day")}`;
}

function matches(filter: Filter, state: MasteryState, due: string | null, now: number) {
  if (filter === "all") return true;
  if (filter === "review")
    return state === "decaying" || (due !== null && new Date(due).getTime() <= now);
  if (filter === "learning") return MASTERY_VALUE[state] < MASTERY_VALUE.familiar;
  return MASTERY_VALUE[state] >= MASTERY_VALUE.strong;
}

export function Notebook({
  words,
  corrections,
  now,
}: {
  words: NotebookWord[];
  corrections: NotebookCorrection[];
  now: number;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const normalizedQuery = foldText(query.trim());
  const visible = useMemo(
    () =>
      words.filter((word) => {
        const haystack = foldText(`${word.french} ${word.meaning} ${word.tags.join(" ")}`);
        return (
          haystack.includes(normalizedQuery) && matches(filter, word.overall, word.nextReview, now)
        );
      }),
    [words, normalizedQuery, filter, now],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Buscar no caderno</span>
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar em francês ou português…"
            className="h-11 rounded-xl pl-9"
          />
        </label>
        <div role="group" aria-label="Filtrar" className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                filter === option.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/40",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground">
          {words.length === 0
            ? "Seu caderno ainda está vazio. As palavras aparecem aqui assim que você as estuda numa lição."
            : "Nada encontrado com esse filtro."}
        </p>
      ) : (
        <ul className="divide-border border-border divide-y border-y">
          {visible.map((word) => (
            <li key={word.conceptId} className="py-4">
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <Fr className="text-[1.35rem]">{word.french}</Fr>
                      <span className="text-muted-foreground text-xs">
                        {POS[word.pos]}
                        {word.gender && ` · ${word.gender === "mf" ? "m./f." : `${word.gender}.`}`}
                      </span>
                    </span>
                    <span className="text-muted-foreground block">{word.meaning}</span>
                  </span>
                  <span
                    className="flex items-center gap-3"
                    aria-label={`Domínio: ${MASTERY_LABELS[word.overall]}`}
                  >
                    {word.dimensions.map((dimension) => (
                      <span
                        key={dimension.dimension}
                        className="flex flex-col items-center gap-1"
                        title={`${DIMENSION_SHORT[dimension.dimension]}: ${MASTERY_LABELS[dimension.state]}`}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "size-3 rounded-full border-[1.5px]",
                            dotClass(dimension.state),
                          )}
                        />
                        <span className="text-muted-foreground text-[0.65rem]">
                          {DIMENSION_SHORT[dimension.dimension]}
                        </span>
                      </span>
                    ))}
                  </span>
                </summary>
                <div className="mt-3 space-y-2 pl-0.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <AudioButton
                      size="sm"
                      showSlow
                      lines={[{ text: word.french }]}
                      label={`Ouvir: ${word.french}`}
                    />
                    {word.ipa && (
                      <span className="text-muted-foreground font-mono text-sm">{word.ipa}</span>
                    )}
                    {word.plural && (
                      <span className="text-muted-foreground text-sm">
                        plural: <Fr>{word.plural}</Fr>
                      </span>
                    )}
                    <span className="text-muted-foreground text-sm">{word.level}</span>
                  </div>
                  {word.example && (
                    <p>
                      <Fr className="text-lg">{word.example.fr}</Fr>
                      <span className="text-muted-foreground ml-2 text-sm">{word.example.pt}</span>
                    </p>
                  )}
                  {word.verb && (
                    <p className="text-sm">
                      Auxiliar <Fr>{word.verb.auxiliary}</Fr> · particípio{" "}
                      <Fr>{word.verb.participle}</Fr>
                    </p>
                  )}
                  {word.falseFriend && (
                    <p className="bg-destructive-soft rounded-lg px-3 py-2 text-sm">
                      Falso cognato: parece “{word.falseFriend.looksLike}”.{" "}
                      <Inline text={word.falseFriend.warning} />
                    </p>
                  )}
                  <p className="text-muted-foreground text-sm">
                    {word.dimensions
                      .map(
                        (d) =>
                          `${DIMENSION_SHORT[d.dimension]}: ${MASTERY_LABELS[d.state].toLowerCase()}`,
                      )
                      .join(" · ")}
                    {reviewLabel(word.nextReview, now) && ` · ${reviewLabel(word.nextReview, now)}`}
                  </p>
                  {word.lesson && (
                    <Link
                      href={`/licao/${word.lesson.id}`}
                      className="text-primary text-sm underline-offset-4 hover:underline"
                    >
                      Lição: {word.lesson.title}
                    </Link>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      {corrections.length > 0 && (
        <section aria-labelledby="corrections" className="pt-4">
          <h2 id="corrections" className="text-xl font-bold">
            Correções das suas conversas
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Erros importantes que você cometeu com o tutor. Eles voltam na revisão até ficarem
            firmes.
          </p>
          <ul className="mt-4 space-y-4">
            {corrections.map((correction) => (
              <li key={correction.id} className="border-border border-l-[3px] pl-4">
                <p className="text-lg">
                  {correction.wrong && (
                    <>
                      <Fr className="correction">{correction.wrong}</Fr>
                      <span className="text-muted-foreground mx-2" aria-hidden>
                        →
                      </span>
                    </>
                  )}
                  <Fr className="highlight">{correction.right}</Fr>
                </p>
                {correction.explanation && (
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    <Inline text={correction.explanation} />
                  </p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">
                  {MASTERY_LABELS[correction.state]}
                  {reviewLabel(correction.nextReview, now) &&
                    ` · ${reviewLabel(correction.nextReview, now)}`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
