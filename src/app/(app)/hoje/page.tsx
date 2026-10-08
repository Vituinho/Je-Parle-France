import type { Metadata } from "next";
import { Award } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Fr } from "@/components/fr";
import { AuthenticCard } from "@/components/authentic/authentic-card";
import { LineProgress } from "@/components/line-progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getContent } from "@/lib/content";
import { dailyAuthentic, regionsFor } from "@/lib/learning/authentic";
import { SKILL_LABELS, SKILLS } from "@/lib/learning/skills";
import { cn } from "@/lib/utils";
import { getDashboard, type Dashboard } from "@/server/services/dashboard";
import { recentAchievements } from "@/server/services/progress";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Hoje" };

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
const WEEKDAY_NAMES = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

function TodayCard({ session }: { session: Dashboard["session"] }) {
  const done = session.status === "completed";
  const started = session.cursor > 0 && !done;
  return (
    <section
      aria-labelledby="today-session"
      className="border-primary bg-card rounded-3xl border-[1.5px] p-6 shadow-[0_24px_48px_-36px_rgb(42_68_184/0.45)] sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="today-session" className="text-2xl font-bold">
          {done ? "Sessão de hoje concluída" : "Sessão de hoje"}
        </h2>
        <span className="text-muted-foreground">~{session.plannedMinutes} min</span>
      </div>
      {session.plannedMinutes < session.minutes * 0.75 && !done && (
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Hoje fica abaixo dos seus {session.minutes} min: limitamos o conteúdo novo para não
          sobrecarregar a memória. Conforme você avança, a revisão ocupa esse espaço.
        </p>
      )}
      <LineProgress
        orientation="vertical"
        className="mt-6"
        ariaLabel="Etapas da sessão de hoje"
        stations={session.blocks.map((block, index) => ({
          id: `${index}`,
          label: block.title,
          detail: `${block.minutes} min`,
          state:
            index < session.cursor ? "done" : index === session.cursor ? "current" : "upcoming",
        }))}
      />
      <Button asChild className="mt-6 h-12 w-full rounded-xl text-base">
        <Link href="/sessao">
          {done ? "Ver a sessão" : started ? "Continuar a sessão" : "Começar a sessão de hoje"}
        </Link>
      </Button>
      {done && (
        <p className="text-muted-foreground mt-3 text-center text-sm">
          Feito por hoje. Se quiser mais, abra a sessão e escolha praticar mais um pouco.
        </p>
      )}
    </section>
  );
}

function WeekPanel({ habits }: { habits: Dashboard["habits"] }) {
  return (
    <section aria-labelledby="week" className="space-y-4">
      <h2 id="week" className="text-lg font-bold">
        Esta semana
      </h2>
      <ol className="flex gap-2" aria-label="Dias estudados nesta semana">
        {habits.week.map((day, index) => (
          <li
            key={day.date}
            className="flex flex-1 flex-col items-center gap-1.5"
            aria-label={`${WEEKDAY_NAMES[index]}: ${day.active ? "estudou" : "sem estudo"}`}
          >
            <span
              className={cn(
                "grid size-9 place-items-center rounded-full border-[1.5px] text-xs font-semibold",
                day.active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                day.today && !day.active && "border-primary",
              )}
            >
              {WEEKDAYS[index]}
            </span>
          </li>
        ))}
      </ol>
      <p>
        <strong>
          {habits.activeThisWeek} de {habits.weeklyGoal}
        </strong>{" "}
        dias da sua meta semanal{habits.weeklyGoalMet && " — meta cumprida"}.
      </p>
      {habits.streakDays > 1 && (
        <p className="text-muted-foreground text-sm">
          {habits.streakDays} dias de constância
          {habits.restDayUsedThisWeek &&
            " (um dia de descanso nesta semana não quebra a sequência)"}
          .
        </p>
      )}
    </section>
  );
}

function ProgressPanel({ data, examGoal }: { data: Dashboard; examGoal: boolean }) {
  return (
    <section aria-labelledby="level" className="border-border border-t pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="level" className="text-muted-foreground text-base font-semibold">
            Seu nível
          </h2>
          <p className="mt-1 text-3xl font-bold">{data.level.label}</p>
        </div>
        <p className="text-muted-foreground text-sm">
          Domínio do {data.progress.level}:{" "}
          <strong className="text-foreground">{data.progress.percent}%</strong>
        </p>
      </div>
      <div
        className="bg-muted mt-4 h-2.5 overflow-hidden rounded-full"
        role="progressbar"
        aria-label={`Domínio do ${data.progress.level}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={data.progress.percent}
      >
        <div
          className="bg-primary h-full rounded-full"
          style={{ width: `${data.progress.percent}%` }}
        />
      </div>
      <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
        {SKILLS.map((skill) => {
          const value = data.progress.bySkill[skill];
          return (
            <li
              key={skill}
              className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-sm"
            >
              <span>{SKILL_LABELS[skill].pt}</span>
              <span className="bg-muted h-1.5 overflow-hidden rounded-full" aria-hidden>
                <span
                  className="bg-primary/80 block h-full rounded-full"
                  style={{ width: `${value ?? 0}%` }}
                />
              </span>
              <span className="text-muted-foreground text-right tabular-nums">
                {value === null ? "—" : `${value}%`}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-muted-foreground mt-4 text-sm">
        Medido pelo que você domina em cada habilidade, não pelas lições que já viu.
      </p>
      <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
        <Link href="/progresso" className="text-primary underline-offset-4 hover:underline">
          Ver seu progresso
        </Link>
        <Link href="/curso" className="text-primary underline-offset-4 hover:underline">
          Ver o curso completo
        </Link>
        <Link href="/caderno" className="text-primary underline-offset-4 hover:underline">
          Meu caderno
        </Link>
        <Link href="/gramatica" className="text-primary underline-offset-4 hover:underline">
          Gramática
        </Link>
        {examGoal && (
          <Link href="/provas" className="text-primary underline-offset-4 hover:underline">
            Provas oficiais
          </Link>
        )}
      </p>
    </section>
  );
}

function StatsPanel({ data }: { data: Dashboard }) {
  const stats = [
    { label: "Tempo de estudo na semana", value: `${data.week.studyMinutes} min` },
    { label: "Palavras e expressões que você reconhece", value: `${data.vocabulary.learned}` },
    { label: "Minutos de escuta na semana", value: `${data.week.listeningMinutes}` },
    { label: "Minutos de fala na semana", value: `${data.week.speakingMinutes}` },
  ];
  return (
    <section aria-labelledby="numbers" className="border-border border-t pt-8">
      <h2 id="numbers" className="sr-only">
        Números
      </h2>
      <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-muted-foreground text-sm leading-snug">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

async function Today() {
  const { user, profile } = await requireLearner();
  const [data, achievements] = await Promise.all([
    getDashboard(user.id, profile),
    recentAchievements(user.id, profile),
  ]);
  const firstName = user.name.split(" ")[0] ?? user.name;
  const authentic = dailyAuthentic(getContent().course.authentic, {
    level: data.level.level,
    regions: regionsFor(profile.destination),
    date: data.date,
  });
  const needsPlacement =
    profile.placementStatus === "not_started" || profile.placementStatus === "in_progress";
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[2rem] leading-tight font-bold">
          <Fr className="font-medium">Bonjour</Fr>, {firstName}.
        </h1>
        <p className="text-muted-foreground mt-1 first-letter:uppercase">
          {new Date(`${data.date}T12:00:00`).toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </header>

      {needsPlacement && (
        <div className="bg-accent flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4">
          <p>
            <strong>Descubra seu nível</strong> para a sessão começar no ponto certo para você.
          </p>
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <Link href="/diagnostico">
              {profile.placementStatus === "in_progress"
                ? "Continuar diagnóstico"
                : "Fazer diagnóstico"}
            </Link>
          </Button>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <TodayCard session={data.session} />
        <div className="space-y-8">
          <WeekPanel habits={data.habits} />
          {data.due > 0 && (
            <div className="border-border border-t pt-6">
              <p className="font-semibold">
                {data.due} {data.due === 1 ? "item para revisar" : "itens para revisar"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Eles já entram na sessão de hoje. Quer adiantar?
              </p>
              <Button asChild variant="link" className="mt-1 px-0">
                <Link href="/revisar">Revisar agora</Link>
              </Button>
            </div>
          )}
          {authentic && (
            <section aria-labelledby="authentic" className="border-border border-t pt-6">
              <h2 id="authentic" className="font-semibold">
                Para ouvir ou ler hoje
              </h2>
              <p className="text-muted-foreground mt-1 mb-3 text-sm">
                Francês de verdade, no seu nível.{" "}
                <Link href="/conteudo" className="text-primary underline-offset-4 hover:underline">
                  Ver mais
                </Link>
              </p>
              <AuthenticCard item={authentic} compact />
            </section>
          )}
        </div>
      </div>

      {achievements.length > 0 && (
        <section
          aria-labelledby="achievements"
          className="border-primary/30 bg-accent flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border px-5 py-4"
        >
          <h2 id="achievements" className="font-semibold">
            {achievements.length === 1 ? "Nova conquista" : "Novas conquistas"}
          </h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {achievements.map((achievement) => (
              <li key={achievement.id} className="flex items-start gap-2">
                <Award className="text-primary mt-1 size-4 shrink-0" aria-hidden />
                <span>
                  <strong>{achievement.title}</strong>
                  <span className="text-muted-foreground"> — {achievement.description}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/progresso"
            className="text-primary ml-auto text-sm font-medium underline-offset-4 hover:underline"
          >
            Ver todas
          </Link>
        </section>
      )}

      <ProgressPanel data={data} examGoal={profile.goals.includes("exam")} />
      <StatsPanel data={data} />
    </div>
  );
}

export default function TodayPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-80 w-full rounded-3xl" />
          </div>
        }
      >
        <Today />
      </Suspense>
    </div>
  );
}
