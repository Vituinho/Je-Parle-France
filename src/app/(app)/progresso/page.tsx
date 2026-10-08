import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Fr } from "@/components/fr";
import { AchievementList } from "@/components/progress/achievement-list";
import { ActivityChart } from "@/components/progress/activity-chart";
import { MasteryBars } from "@/components/progress/mastery-bars";
import { Skeleton } from "@/components/ui/skeleton";
import { getProgressReport } from "@/server/services/progress";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Progresso" };

async function Progress() {
  const { user, profile } = await requireLearner();
  const report = await getProgressReport(user.id, profile);
  const earned = report.achievements.filter((achievement) => achievement.earned).length;
  const stats = [
    { label: "dias de estudo", value: report.totals.activeDays },
    { label: "minutos no total", value: report.totals.minutes },
    { label: "revisões", value: report.totals.reviews },
    { label: "lições concluídas", value: report.totals.lessons },
    { label: "conversas com o tutor", value: report.totals.conversations },
  ];

  return (
    <div className="space-y-12">
      <header className="max-w-2xl">
        <Fr as="p" className="text-primary text-xl">
          Vos progrès
        </Fr>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">Seu progresso</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Tudo aqui vem do que você realmente pratica: o domínio é medido pela memória de cada item,
          não pelas lições abertas.
        </p>
        <p className="mt-3 text-sm">
          <Link
            href="/provas"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Prontidão para as provas oficiais (TEF, TCF, DELF, DALF)
          </Link>
        </p>
      </header>

      <section aria-labelledby="totals">
        <h2 id="totals" className="sr-only">
          Números gerais
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-muted-foreground text-sm">{stat.label}</dt>
              <dd className="text-3xl font-bold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="activity" className="border-border border-t pt-8">
        <h2 id="activity" className="text-xl font-bold">
          Últimas quatro semanas
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Sequência atual:{" "}
          <strong className="text-foreground">
            {report.habits.streakDays} {report.habits.streakDays === 1 ? "dia" : "dias"}
          </strong>{" "}
          · Meta semanal cumprida{" "}
          <strong className="text-foreground">
            {report.habits.weeksInARow} {report.habits.weeksInARow === 1 ? "semana" : "semanas"}
          </strong>{" "}
          seguidas
        </p>
        <div className="mt-6">
          <ActivityChart days={report.recent} goalMinutes={profile.dailyMinutes} />
        </div>
      </section>

      <section aria-labelledby="mastery" className="border-border border-t pt-8">
        <h2 id="mastery" className="text-xl font-bold">
          O que você já domina
        </h2>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
          Cada item conta pela habilidade mais fraca que você praticou: uma palavra que você lê mas
          ainda não escreve aparece como “aprendendo”.
        </p>
        <div className="mt-6">
          <MasteryBars rows={report.mastery} />
        </div>
      </section>

      <section aria-labelledby="achievements" className="border-border border-t pt-8">
        <h2 id="achievements" className="text-xl font-bold">
          Conquistas
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {earned} de {report.achievements.length}. Marcos de aprendizado — nunca de tempo de tela.
        </p>
        <div className="mt-6">
          <AchievementList achievements={report.achievements} />
        </div>
      </section>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <Progress />
      </Suspense>
    </div>
  );
}
