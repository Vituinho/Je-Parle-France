import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { Fr } from "@/components/fr";
import { LevelScale } from "@/components/placement/level-scale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getContent } from "@/lib/content";
import type { AssessmentMethod, Confidence } from "@/lib/learning/placement/report";
import { SKILL_LABELS } from "@/lib/learning/skills";
import { getPlacementReport } from "@/server/services/placement";
import { requireLearner } from "@/server/session";
import { chooseStartAction, startPlacementAction } from "../../actions";

export const metadata: Metadata = { title: "Seu diagnóstico" };

const CONFIDENCE: Record<Confidence, string> = {
  high: "confiança alta",
  medium: "confiança média",
  low: "confiança baixa",
};

const METHOD: Record<AssessmentMethod, string | null> = {
  objective: null,
  perception: "medida pela percepção dos sons",
  self_assessment: "autoavaliação",
  not_assessed: "não avaliada neste diagnóstico",
};

async function Report({ params }: { params: Promise<{ attemptId: string }> }) {
  const { user } = await requireLearner();
  const { attemptId } = await params;
  const result = await getPlacementReport(user.id, attemptId);
  if (!result) notFound();
  const { report, attempt } = result;
  const content = getContent();
  const firstLesson = content.paths.core[0]?.lesson.id;
  const units = [...new Map(content.paths.core.map((ref) => [ref.unit.id, ref])).values()];
  const recommendation = report.recommendation;
  const partial = report.mode === "skill";

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Fr as="p" className="text-primary text-xl">
        Voilà votre point de départ.
      </Fr>
      <h1 className="mt-1 text-[2rem] leading-tight font-bold">
        {partial ? "Resultado da habilidade refeita" : "Seu diagnóstico"}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {attempt.completedAt?.toLocaleDateString("pt-BR", { dateStyle: "long" })} ·{" "}
        {report.mode === "quick"
          ? "diagnóstico rápido"
          : report.mode === "complete"
            ? "diagnóstico completo"
            : "habilidade refeita"}
      </p>

      {!partial && (
        <section aria-labelledby="overall" className="mt-10">
          <h2 id="overall" className="text-muted-foreground text-base font-semibold">
            Nível geral estimado
          </h2>
          <p className="mt-2 text-4xl font-bold sm:text-5xl">{report.overall.label}</p>
          <LevelScale
            theta={report.overall.theta}
            sd={report.overall.sd}
            className="mt-5 max-w-md"
          />
        </section>
      )}

      <section aria-labelledby="skills" className="mt-12">
        <h2 id="skills" className="text-2xl font-bold">
          Por habilidade
        </h2>
        <p className="text-muted-foreground mt-1">
          Ninguém tem um nível só. A faixa mostra a incerteza de cada estimativa.
        </p>
        <ul className="divide-border mt-6 divide-y">
          {report.skills.map((skill) => {
            const method = METHOD[skill.method];
            const muted = skill.method === "not_assessed" || skill.method === "self_assessment";
            return (
              <li
                key={skill.skill}
                className="grid gap-3 py-4 sm:grid-cols-[11rem_1fr] sm:items-center sm:gap-6"
              >
                <div>
                  <p className="font-semibold">{SKILL_LABELS[skill.skill].pt}</p>
                  <p className="text-muted-foreground text-sm">
                    {skill.method === "not_assessed" ? (
                      method
                    ) : (
                      <>
                        <span className="text-foreground font-semibold">{skill.short}</span> ·{" "}
                        {method ?? CONFIDENCE[skill.confidence]}
                      </>
                    )}
                  </p>
                </div>
                {skill.method !== "not_assessed" && (
                  <LevelScale theta={skill.theta} sd={skill.sd} muted={muted} />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {(report.strengths.length > 0 || report.weaknesses.length > 0) && (
        <section className="mt-12 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <ArrowUp className="text-success size-5" aria-hidden /> Pontos fortes
            </h2>
            {report.strengths.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {report.strengths.map((finding) => (
                  <li key={finding.text} className="leading-relaxed">
                    {finding.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mt-3">
                Nada se destacou acima do seu nível geral.
              </p>
            )}
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <ArrowDown className="text-destructive size-5" aria-hidden /> Para trabalhar
            </h2>
            {report.weaknesses.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {report.weaknesses.map((finding) => (
                  <li key={finding.text} className="leading-relaxed">
                    {finding.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mt-3">Nenhum ponto fraco claro apareceu.</p>
            )}
          </div>
        </section>
      )}

      {report.gaps.length > 0 && (
        <section aria-labelledby="gaps" className="mt-12">
          <h2 id="gaps" className="text-xl font-bold">
            Lacunas de níveis anteriores
          </h2>
          <p className="text-muted-foreground mt-1">
            Já entraram na sua revisão — você vai vê-las nas próximas sessões.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {report.gaps.map((gap) => (
              <li key={gap.conceptId}>
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  <Fr>{gap.title}</Fr>
                  <span className="text-muted-foreground ml-1">{gap.level}</span>
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!partial && (
        <section
          aria-labelledby="start"
          className="border-primary bg-accent mt-12 rounded-3xl border-[1.5px] p-6 sm:p-8"
        >
          <h2 id="start" className="text-2xl font-bold">
            Por onde começar
          </h2>
          {recommendation.contentAvailable && recommendation.lessonId ? (
            <>
              <p className="mt-2 text-lg">
                Recomendamos começar em <strong>{recommendation.level}</strong> —{" "}
                {recommendation.unitTitle}.
              </p>
              <p className="text-muted-foreground mt-1">
                Começamos um pouco abaixo da estimativa: consolidar é mais barato do que tapar
                buracos depois.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <form action={chooseStartAction}>
                  <input type="hidden" name="lessonId" value={recommendation.lessonId} />
                  <Button type="submit" className="h-12 rounded-xl px-6 text-base">
                    Começar por aqui
                  </Button>
                </form>
                {firstLesson && firstLesson !== recommendation.lessonId && (
                  <form action={chooseStartAction}>
                    <input type="hidden" name="lessonId" value={firstLesson} />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-12 rounded-xl px-6 text-base"
                    >
                      Começar do início
                    </Button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg">
                Seu nível de partida é <strong>{recommendation.level}</strong>.
              </p>
              {recommendation.note && (
                <p className="text-muted-foreground mt-1">{recommendation.note}</p>
              )}
              <Button asChild className="mt-6 h-12 rounded-xl px-6 text-base">
                <Link href="/hoje">Ir para a sessão de hoje</Link>
              </Button>
            </>
          )}

          {units.length > 1 && (
            <form action={chooseStartAction} className="mt-6 flex flex-wrap items-end gap-3">
              <label className="grid gap-1.5 text-sm font-medium">
                Ou escolha outro ponto de partida
                <select
                  name="lessonId"
                  defaultValue={recommendation.lessonId ?? undefined}
                  className="border-input bg-card h-11 rounded-xl border px-3 text-base"
                >
                  {units.map((ref) => (
                    <option key={ref.unit.id} value={ref.lesson.id}>
                      {ref.unit.level} — {ref.unit.title.pt}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" variant="outline" className="h-11 rounded-xl">
                Usar este
              </Button>
            </form>
          )}
        </section>
      )}

      <section aria-labelledby="retake" className="mt-12">
        <h2 id="retake" className="text-xl font-bold">
          Refazer
        </h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <form action={startPlacementAction}>
            <input type="hidden" name="mode" value="complete" />
            <Button type="submit" variant="outline" className="h-11 rounded-xl">
              <RotateCcw /> Diagnóstico completo
            </Button>
          </form>
          <form action={startPlacementAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="mode" value="skill" />
            <label className="grid gap-1.5 text-sm font-medium">
              Só uma habilidade
              <select
                name="skill"
                className="border-input bg-card h-11 rounded-xl border px-3 text-base"
              >
                {(
                  [
                    "listening",
                    "reading",
                    "vocabulary",
                    "grammar",
                    "writing",
                    "pronunciation",
                  ] as const
                ).map((skill) => (
                  <option key={skill} value={skill}>
                    {SKILL_LABELS[skill].pt}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="outline" className="h-11 rounded-xl">
              Refazer habilidade
            </Button>
          </form>
        </div>
      </section>

      <p className="text-muted-foreground mt-12 text-sm leading-relaxed">
        Esta é uma avaliação interna de aprendizagem, não uma certificação oficial. Para fins de
        imigração, estudo ou trabalho, apenas resultados de provas oficiais (TEF, TCF, DELF, DALF)
        são válidos.
      </p>
    </div>
  );
}

export default function PlacementReportPage(
  props: PageProps<"/diagnostico/[attemptId]/resultado">,
) {
  return (
    <Suspense
      fallback={<Skeleton className="mx-auto mt-24 h-[32rem] w-full max-w-3xl rounded-2xl" />}
    >
      <Report params={props.params} />
    </Suspense>
  );
}
