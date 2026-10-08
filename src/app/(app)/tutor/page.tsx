import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Fr } from "@/components/fr";
import { TutorStartForm } from "@/components/tutor/tutor-start-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getLLM } from "@/lib/ai/llm";
import { getContent } from "@/lib/content";
import { levelIndex } from "@/lib/learning/cefr";
import { getLearnerLevel } from "@/server/services/learner";
import { listConversations } from "@/server/services/tutor";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Tutor" };

const TRACK_LABEL = { core: "Geral", canada: "Canadá / Québec", france: "França" } as const;

async function Tutor({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, profile } = await requireLearner();
  const params = await searchParams;
  const preselected = typeof params.cenario === "string" ? params.cenario : undefined;
  const sessionId = typeof params.sessao === "string" ? params.sessao : undefined;
  const [level, conversations] = await Promise.all([
    getLearnerLevel(user.id),
    listConversations(user.id, 10),
  ]);
  const content = getContent();
  const preferredTracks =
    profile.destination === "canada_quebec"
      ? ["canada"]
      : profile.destination === "france"
        ? ["france"]
        : ["canada", "france"];
  const scenarios = [...content.scenarios.values()]
    .map((scenario) => ({
      id: scenario.id,
      title: scenario.title.pt,
      goal: scenario.learnerGoal.pt,
      track: scenario.track,
      minLevel: scenario.minLevel,
      fits: levelIndex(scenario.minLevel) <= levelIndex(level.level) + 1,
      preferred: scenario.track === "core" || preferredTracks.includes(scenario.track),
    }))
    .sort((a, b) => Number(b.preferred) - Number(a.preferred) || Number(b.fits) - Number(a.fits));
  const simulated = getLLM().simulated;

  return (
    <div className="space-y-10">
      <header>
        <Fr as="p" className="text-primary text-xl">
          On discute ?
        </Fr>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">Conversar com o tutor</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Escolha uma situação real ou converse livremente. O tutor fala no seu nível, usa o que
          você já sabe e, no fim, monta um relatório — os erros importantes entram na sua revisão.
        </p>
      </header>

      {simulated && (
        <p role="status" className="bg-highlight/20 rounded-xl px-4 py-3 text-sm leading-relaxed">
          <strong>Modo simulado.</strong> Nenhum provedor de IA está configurado neste ambiente: as
          respostas do tutor são roteirizadas e as correções vêm só das regras automáticas.
          Configure <code>LLM_PROVIDER=anthropic</code> para conversar de verdade.
        </p>
      )}

      <TutorStartForm
        scenarios={scenarios}
        trackLabels={TRACK_LABEL}
        defaultScenario={preselected}
        defaultMode={profile.correctionMode}
        sessionId={sessionId}
      />

      {conversations.length > 0 && (
        <section aria-labelledby="history" className="border-border border-t pt-8">
          <h2 id="history" className="text-xl font-bold">
            Conversas anteriores
          </h2>
          <ul className="divide-border mt-4 divide-y">
            {conversations.map((conversation) => (
              <li
                key={conversation.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <Link
                    href={`/conversa/${conversation.id}`}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    {conversation.scenarioId
                      ? (content.scenarios.get(conversation.scenarioId)?.title.pt ?? "Conversa")
                      : "Conversa livre"}
                  </Link>
                  <p className="text-muted-foreground text-sm">
                    {conversation.createdAt.toLocaleDateString("pt-BR", { dateStyle: "medium" })} ·{" "}
                    {Math.max(0, conversation._count.turns - 1)} mensagens ·{" "}
                    {conversation.status === "ended" ? "com relatório" : "em andamento"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function TutorPage(props: PageProps<"/tutor">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <Tutor searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
