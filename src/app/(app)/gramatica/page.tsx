import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Inline } from "@/components/activities/rich-text";
import { Fr } from "@/components/fr";
import { Skeleton } from "@/components/ui/skeleton";
import { MASTERY_LABELS } from "@/lib/learning/memory/memory";
import { getGrammarLibrary } from "@/server/services/library";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Gramática" };

async function Library() {
  const { user } = await requireLearner();
  const topics = await getGrammarLibrary(user.id);
  const levels = [...new Set(topics.map((topic) => topic.level))];

  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <Fr as="p" className="text-primary text-xl">
          La grammaire
        </Fr>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">Gramática</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Cada tema explicado a partir do português: o que é parecido, o que muda e os erros que
          brasileiros mais cometem. Você pode consultar e treinar quando quiser.
        </p>
        <p className="mt-3 text-sm">
          <Link
            href="/caderno"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Ver meu caderno de vocabulário
          </Link>
        </p>
      </header>

      {levels.map((level) => (
        <section key={level} aria-labelledby={`level-${level}`}>
          <h2 id={`level-${level}`} className="text-muted-foreground text-sm font-semibold">
            Nível {level}
          </h2>
          <ul className="divide-border border-border mt-3 divide-y border-y">
            {topics
              .filter((topic) => topic.level === level)
              .map((topic) => (
                <li key={topic.slug}>
                  <Link
                    href={`/gramatica/${topic.slug}`}
                    className="hover:bg-muted/60 flex flex-wrap items-baseline gap-x-6 gap-y-1 px-2 py-5 transition-colors"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold">{topic.title.pt}</span>
                      {topic.title.fr && <Fr className="text-primary block">{topic.title.fr}</Fr>}
                      <span className="text-muted-foreground mt-1 block text-sm leading-relaxed">
                        <Inline text={topic.summary} />
                      </span>
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {MASTERY_LABELS[topic.state]}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function GrammarPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <Library />
      </Suspense>
    </div>
  );
}
