import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PilotCalibration } from "@/components/progress/pilot-calibration";
import { activeMinutes } from "@/components/progress/weekly-learning";
import { CEFR_LEVELS } from "@/lib/learning/cefr";
import { SKILLS, SKILL_LABELS } from "@/lib/learning/skills";
import { STUDY_PACE_OPTIONS } from "@/lib/learning/study-pace";
import { addDays } from "@/lib/learning/time";
import { getPilotReport, PilotAuthorizationError } from "@/server/services/pilot";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Piloto de aprendizagem" };
async function Pilot({ searchParams }: Pick<PageProps<"/admin/piloto">, "searchParams">) {
  const admin = await requireAdmin();
  const params = await searchParams,
    now = new Date(),
    date = now.toISOString().slice(0, 10);
  const read = (key: string) =>
    typeof params[key] === "string" && params[key] !== "" ? (params[key] as string) : undefined;
  const filters = {
    from: read("from") ?? addDays(date, -14),
    through: read("through") ?? date,
    pace: read("pace"),
    level: read("level"),
    skill: read("skill"),
    learner: read("learner"),
  };
  let report;
  try {
    report = await getPilotReport(admin.id, filters, now);
  } catch (error) {
    if (error instanceof PilotAuthorizationError) notFound();
    // Neither Zod payloads nor database errors are reflected into this page.
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Piloto de aprendizagem</h1>
        <p role="alert">
          Não foi possível ler o relatório. Use datas válidas nos últimos 90 dias e filtros
          disponíveis.
        </p>
        <Link href="/admin/piloto" className="text-primary underline">
          Limpar filtros
        </Link>
      </div>
    );
  }
  const field = "border-border bg-background rounded-lg border p-2 text-sm";
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Link href="/admin" className="text-primary text-sm underline">
          Administração
        </Link>
        <h1 className="text-3xl font-bold">Piloto de aprendizagem</h1>
        <p className="text-muted-foreground max-w-3xl">
          Diagnósticos educacionais para revisão humana. Identificadores pseudônimos; nenhum texto
          de resposta, conversa ou áudio é exibido. Minutos e estimativas não demonstram
          causalidade.
        </p>
      </header>
      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="space-y-1">
          <span className="block text-sm">De</span>
          <input className={field} type="date" name="from" defaultValue={filters.from} required />
        </label>
        <label className="space-y-1">
          <span className="block text-sm">Até</span>
          <input
            className={field}
            type="date"
            name="through"
            defaultValue={filters.through}
            required
          />
        </label>
        <label className="space-y-1">
          <span className="block text-sm">Ritmo</span>
          <select className={field} name="pace" defaultValue={filters.pace ?? ""}>
            <option value="">Todos</option>
            {STUDY_PACE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-sm">CEFR da atividade</span>
          <select className={field} name="level" defaultValue={filters.level ?? ""}>
            <option value="">Todos</option>
            {CEFR_LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-sm">Habilidade observada</span>
          <select className={field} name="skill" defaultValue={filters.skill ?? ""}>
            <option value="">Todas</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                {SKILL_LABELS[s].pt}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-sm">Aluno (ID opcional)</span>
          <input className={field} name="learner" defaultValue={filters.learner} maxLength={100} />
        </label>
        <Button type="submit">Filtrar</Button>
        <Link href="/admin/piloto" className="text-primary text-sm underline">
          Limpar
        </Link>
      </form>
      <p className="text-muted-foreground text-sm">
        Ritmo e tarefas observadas filtram as sessões; CEFR filtra a distribuição de atividades e
        habilidade filtra as evidências. Retenção e provedores cobrem todo o período do aluno
        selecionado, independentemente desses filtros. Datas das sessões e métricas seguem o dia
        local do aluno; a linha do tempo usa UTC.
      </p>
      {report.truncated && (
        <p role="status" className="bg-accent rounded-xl p-3">
          A consulta atingiu um limite (200 sessões, 10 alunos ou 5.000 observações por aluno).
          Reduza o período; resultados parciais não devem orientar mudanças.
        </p>
      )}
      {report.learners.length === 0 && (
        <p>
          Nenhuma sessão corresponde aos filtros. O piloto usa dados reais; não criamos medições de
          demonstração.
        </p>
      )}
      {report.learners.map((learner) => (
        <section key={learner.id} className="border-border space-y-4 rounded-2xl border p-4 sm:p-6">
          <h2 className="text-xl font-semibold">
            <Link
              className="text-primary underline"
              href={`/admin/piloto?${new URLSearchParams({ from: filters.from, through: filters.through, learner: learner.id })}`}
            >
              {learner.label}
            </Link>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Sessões de {learner.label}</caption>
              <thead>
                <tr className="border-border border-b">
                  {[
                    "Dia",
                    "Ritmo",
                    "Meta",
                    "Plano disponível",
                    "Tempo ativo",
                    "Etapas",
                    "Sinal conservador",
                  ].map((h) => (
                    <th key={h} className="p-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {learner.sessions.map((s) => (
                  <tr
                    key={s.id}
                    data-pilot-session={s.id}
                    data-pilot-active-seconds={s.activeSeconds}
                    className="border-border border-b"
                  >
                    <td className="p-2 whitespace-nowrap">{s.date}</td>
                    <td className="p-2">
                      {STUDY_PACE_OPTIONS.find((p) => p.value === s.pace)?.label}
                    </td>
                    <td className="p-2">{s.goalMinutes} min</td>
                    <td className="p-2">{activeMinutes(s.plannedSeconds)}</td>
                    <td className="p-2">
                      {s.observed ? activeMinutes(s.activeSeconds) : "Sem tempo observado"}
                    </td>
                    <td className="p-2">
                      {s.completed}/{s.blocks}
                    </td>
                    <td className="p-2">
                      {s.possibleFatigue ? "Possível queda no fim" : "Sem sinal suficiente"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details>
            <summary className="cursor-pointer font-medium">Atividades e evidências</summary>
            <ul className="mt-3 space-y-1 text-sm">
              {learner.activity.map((a) => (
                <li key={`${a.type}:${a.level}`}>
                  {a.type} · {a.level ?? "dificuldade desconhecida"}: {a.completed} primeiras
                  tentativas, {a.correct}/{a.unassisted} acertos sem ajuda, {a.usefulEvidence}{" "}
                  evidências úteis associadas ao tipo de tarefa.
                </li>
              ))}
              {learner.skills.map((s) => (
                <li key={s.skill}>
                  {SKILL_LABELS[s.skill].pt}: {s.samples} evidências úteis, {s.tasks} tarefas,{" "}
                  {s.days} dias.
                </li>
              ))}
            </ul>
          </details>
          <details>
            <summary className="cursor-pointer font-medium">Retenção no período</summary>
            <ul className="mt-3 space-y-1 text-sm">
              {learner.retention.intervals.map((r) => (
                <li key={r.interval}>
                  {r.interval}: {r.successes}/{r.samples} lembrados sem ajuda ·{" "}
                  {r.percent === null ? "amostra insuficiente para percentual" : `${r.percent}%`} ·{" "}
                  {r.days} dias, {r.concepts} conceitos.
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-2 text-xs">
              Intervalo FSRS desde a revisão anterior, não necessariamente desde a primeira
              aprendizagem. Sem atribuição causal ao tipo da lição de origem.
            </p>
          </details>
          <details>
            <summary className="cursor-pointer font-medium">Provedores e falhas no período</summary>
            <ul className="mt-3 space-y-1 text-sm">
              {learner.provider.map((p) => (
                <li key={`${p.provider}:${p.operation}:${p.simulated}`}>
                  {p.provider} · {p.operation}
                  {p.simulated ? " · simulado" : ""}: {p.requests} chamadas, {p.failures} falhas;
                  tokens {p.inputTokens} entrada / {p.outputTokens} saída; áudio{" "}
                  {(p.audioMs / 1000).toFixed(1)} s; {p.textCharacters} caracteres TTS;{" "}
                  {p.unknownUnits} chamadas com unidades desconhecidas.
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-2 text-xs">
              Unidades para estimativa futura de custo. Chamadas ao mock ficam separadas. Quotas
              recusadas e respostas de cache não são novas chamadas pagas; unidades ausentes não são
              custo zero.
            </p>
          </details>
          <details>
            <summary className="cursor-pointer font-medium">Variações da estimativa</summary>
            <ul className="mt-3 space-y-1 text-sm">
              {learner.skillChanges.map((c, i) => (
                <li key={i}>
                  {c.at.toISOString().slice(0, 10)} · {c.skill}: {c.before.toFixed(2)} →{" "}
                  {c.after.toFixed(2)} (escala interna, sem prova causal).
                </li>
              ))}
            </ul>
          </details>
        </section>
      ))}
      {filters.learner && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Linha do tempo educacional</h2>
          <ol className="space-y-2 text-sm">
            {report.timeline.map((e, i) => (
              <li key={i} className="border-border rounded-lg border p-3">
                <time>{e.at.toISOString()}</time> · <strong>{e.type}</strong>
                {e.metadata && (
                  <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(e.metadata)}</pre>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
      <PilotCalibration />
    </div>
  );
}
export default function PilotPage(props: PageProps<"/admin/piloto">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Pilot searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
