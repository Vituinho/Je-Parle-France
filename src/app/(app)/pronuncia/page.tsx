import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Fr } from "@/components/fr";
import { Skeleton } from "@/components/ui/skeleton";
import { publicCapabilities } from "@/lib/ai/capabilities";
import { getContent } from "@/lib/content";
import type { PronunciationConcept } from "@/lib/content/schema";
import { MASTERY_LABELS, masteryOf } from "@/lib/learning/memory/memory";
import { db } from "@/server/db";
import { loadTraces } from "@/server/repositories/memory";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Pronúncia" };

async function Lab() {
  const { user } = await requireLearner();
  const content = getContent();
  const targets = [...content.concepts.values()].filter(
    (concept): concept is PronunciationConcept => concept.kind === "pronunciation",
  );
  const traces = await loadTraces(
    db,
    user.id,
    targets.map((target) => target.id),
  );
  const now = new Date();
  const state = (conceptId: string, dimension: "listening" | "pronunciation") =>
    MASTERY_LABELS[
      masteryOf(
        traces.find((t) => t.conceptId === conceptId && t.dimension === dimension),
        now,
      )
    ];
  const { pronunciation } = publicCapabilities();

  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <Fr as="p" className="text-primary text-xl">
          Le labo de prononciation
        </Fr>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">Laboratório de pronúncia</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Os sons que mais confundem brasileiros. Primeiro você treina o ouvido para perceber a
          diferença; depois, a boca para produzi-la.
        </p>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {pronunciation
            ? "Sua fala é avaliada automaticamente, palavra por palavra."
            : "A avaliação automática da fala não está configurada aqui: você grava, compara com o modelo e se avalia."}
        </p>
      </header>

      <Link
        href="/pronuncia/sombra"
        className="border-primary/30 bg-accent hover:border-primary/60 block rounded-2xl border px-5 py-4 transition-colors"
      >
        <span className="block text-lg font-semibold">Shadowing: frases dos seus diálogos</span>
        <span className="text-muted-foreground mt-0.5 block text-sm leading-relaxed">
          Ouça frases reais das lições e repita colado na voz: ritmo, ligações e entonação. Grave e
          compare com o modelo.
        </span>
      </Link>

      <ul className="divide-border border-border divide-y border-y">
        {targets.map((target) => (
          <li key={target.id}>
            <Link
              href={`/pronuncia/${target.id.replace("pron:", "")}`}
              className="hover:bg-muted/60 flex flex-wrap items-center gap-x-6 gap-y-2 px-2 py-5 transition-colors"
            >
              <span className="font-fr text-primary w-28 shrink-0 text-2xl">{target.ipa}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold">{target.title.pt}</span>
                <span className="text-muted-foreground block text-sm">
                  Percepção: {state(target.id, "listening").toLowerCase()} · Produção:{" "}
                  {state(target.id, "pronunciation").toLowerCase()}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PronunciationPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <Lab />
      </Suspense>
    </div>
  );
}
