import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Fr } from "@/components/fr";
import { Skeleton } from "@/components/ui/skeleton";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/learning/cefr";
import {
  EXAMS,
  readiness,
  TEF_NCLC_TABLE_URL,
  type ExamInfo,
  type ReadinessBand,
} from "@/lib/learning/exams";
import { cn } from "@/lib/utils";
import { getLearnerLevel } from "@/server/services/learner";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Provas oficiais" };

const TARGETS = CEFR_LEVELS.filter((level) => level !== "A0");

const SKILL_ROWS = [
  { skill: "listening", title: "Compreensão oral" },
  { skill: "reading", title: "Compreensão escrita" },
  { skill: "speaking", title: "Expressão oral" },
  { skill: "writing", title: "Expressão escrita" },
] as const;

const BAND: Record<ReadinessBand, { label: string; className: string }> = {
  likely: { label: "Provavelmente no nível", className: "bg-success-soft text-foreground" },
  close: { label: "Chegando perto", className: "bg-highlight/30 text-foreground" },
  far: { label: "Ainda distante", className: "bg-muted text-foreground" },
  self_assessed: { label: "Só autoavaliação", className: "border-border border" },
  unmeasured: { label: "Ainda não medido", className: "border-border border border-dashed" },
};

function ExamCard({ exam }: { exam: ExamInfo }) {
  return (
    <article className="border-border bg-card rounded-2xl border px-5 py-4">
      <h3 className="text-lg font-semibold">{exam.name}</h3>
      <p className="text-muted-foreground text-sm">{exam.organizer}</p>
      <p className="mt-2 leading-relaxed">{exam.purpose}</p>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {exam.sections.map((section) => (
          <li key={section.id}>
            {section.title}
            {section.minutes ? (
              <span className="text-muted-foreground whitespace-nowrap">
                {" "}
                · {section.minutes} min
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        {exam.results} Validade: {exam.validity.toLowerCase()}.
      </p>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
        <a
          href={exam.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
        >
          Site oficial
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(abre em outra aba)</span>
        </a>
        {exam.id === "tef-canada" && (
          <a
            href={TEF_NCLC_TABLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
          >
            Tabela oficial TEF → NCLC
            <ExternalLink className="size-3.5" aria-hidden />
            <span className="sr-only">(abre em outra aba)</span>
          </a>
        )}
      </p>
    </article>
  );
}

async function Exams({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, profile } = await requireLearner();
  const params = await searchParams;
  const requested = typeof params.nivel === "string" ? params.nivel : undefined;
  const target: CefrLevel = TARGETS.includes(requested as (typeof TARGETS)[number])
    ? (requested as CefrLevel)
    : ((profile.targetLevel as CefrLevel | null) ?? "B2");
  const level = await getLearnerLevel(user.id);
  const rows = SKILL_ROWS.map((row) => ({
    ...row,
    readiness: readiness(level.skills[row.skill], target),
  }));
  const unmeasured = rows.some(
    (row) => row.readiness.band === "unmeasured" || row.readiness.band === "self_assessed",
  );
  const first = profile.destination === "france" ? "france" : "canada";
  const exams = [...EXAMS].sort(
    (a, b) => Number(b.destination === first) - Number(a.destination === first),
  );

  return (
    <div className="space-y-12">
      <header className="max-w-2xl">
        <Fr as="p" className="text-primary text-xl">
          Les examens officiels
        </Fr>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">Provas oficiais</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          TEF Canada e TCF Canada para a imigração no Canadá; DELF e DALF, os diplomas franceses.
          Veja como cada prova é e quão perto você está do nível que precisa.
        </p>
        <p className="border-destructive/40 bg-destructive-soft mt-4 rounded-xl border px-4 py-3 text-sm leading-relaxed">
          <strong>Estimativa interna, não resultado oficial.</strong> Nenhum número deste app
          equivale a uma nota de TEF, TCF, DELF ou DALF. Exigências de imigração e de universidades
          mudam: confirme sempre nos sites oficiais.
        </p>
      </header>

      <section aria-labelledby="readiness">
        <h2 id="readiness" className="text-xl font-bold">
          Sua prontidão para o {target}
        </h2>
        <nav aria-label="Nível-alvo" className="mt-3 flex flex-wrap gap-2">
          {TARGETS.map((option) => (
            <Link
              key={option}
              href={`/provas?nivel=${option}`}
              aria-current={option === target ? "true" : undefined}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                option === target
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/40",
              )}
            >
              {option}
            </Link>
          ))}
        </nav>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <li
              key={row.skill}
              className={cn("rounded-2xl px-4 py-3", BAND[row.readiness.band].className)}
            >
              <p className="font-semibold">{row.title}</p>
              <p className="text-sm">
                {BAND[row.readiness.band].label}
                {row.readiness.estimate && (
                  <span className="text-muted-foreground">
                    {" "}
                    ·{" "}
                    {row.readiness.band === "self_assessed"
                      ? "você se avaliou em"
                      : "estimativa atual:"}{" "}
                    {row.readiness.estimate}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Calculado a partir do seu diagnóstico, levando em conta a incerteza de cada estimativa.
          {unmeasured &&
            " O que não foi medido (ou só foi autoavaliado) fica de fora do cálculo — não chutamos."}
        </p>
        {unmeasured && (
          <Link
            href="/diagnostico?modo=complete"
            className="text-primary mt-2 inline-block text-sm font-medium underline-offset-4 hover:underline"
          >
            Fazer o diagnóstico completo (inclui fala e escrita)
          </Link>
        )}
      </section>

      <section aria-labelledby="exams" className="border-border border-t pt-8">
        <h2 id="exams" className="text-xl font-bold">
          As provas
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {exams.map((exam) => (
            <li key={exam.id}>
              <ExamCard exam={exam} />
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          Treinos no formato de cada prova (tipos de tarefa e tempo cronometrado) estão em produção.
          Até lá, o curso trabalha as quatro habilidades que todas elas avaliam.
        </p>
      </section>
    </div>
  );
}

export default function ExamsPage(props: PageProps<"/provas">) {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <Exams searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
