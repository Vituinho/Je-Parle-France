import Link from "next/link";
import { notFound } from "next/navigation";
import { getControlledPilotReport } from "@/server/services/controlled-pilot";
import {
  listPilotAssessments,
  getPilotCalibrationDetail,
} from "@/server/services/pilot-assessments";
import { getPilotFeedbackComments } from "@/server/services/pilot-participation";
import { PilotAuthorizationError } from "@/server/services/pilot";
import { pilotAdminAction } from "@/app/(app)/admin/piloto/actions";
import { PilotMutationForm } from "./forms";
import { DIFFICULTY_LABELS, PILOT_STATUS_LABELS } from "@/lib/pilot/schema";
import { WRITING_CRITERIA } from "@/lib/learning/writing/assessment";
import { SKILL_LABELS } from "@/lib/learning/skills";
import { activeMinutes } from "@/components/progress/weekly-learning";

const field = "border-border bg-background max-w-full rounded-lg border p-2";
function bandInput(name: string, value?: number) {
  return (
    <select
      className={field}
      name={name}
      aria-label={
        name === "pronunciationBand"
          ? "Pronúncia humana"
          : name === "intelligibilityBand"
            ? "Inteligibilidade humana"
            : `Nota humana: ${name}`
      }
      defaultValue={value ?? ""}
      required
    >
      <option value="">Selecionar</option>
      {[0, 1, 2, 3, 4].map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );
}
export async function ControlledPilotPanel({
  adminId,
  from,
  through,
  learner,
  sample,
}: {
  adminId: string;
  from: string;
  through: string;
  learner?: string;
  sample?: string;
}) {
  let report;
  try {
    report = await getControlledPilotReport(adminId, { from, through, learner });
  } catch (error) {
    if (error instanceof PilotAuthorizationError) notFound();
    return <p role="alert">Não foi possível ler o piloto controlado.</p>;
  }
  if (!report.enabled)
    return (
      <section>
        <h2 className="text-xl font-bold">Piloto controlado</h2>
        <p>Coleta opcional pausada neste ambiente.</p>
      </section>
    );
  const selected = report.participants.find((p) => p.id === learner && p.observation);
  const href = (id: string, sampleId?: string) =>
    `/admin/piloto?${new URLSearchParams({ from, through, learner: id, ...(sampleId ? { sample: sampleId } : {}) })}`;
  let sources, detail, comments;
  if (selected) {
    try {
      sources = await listPilotAssessments(adminId, selected.id);
      comments = await getPilotFeedbackComments(adminId, selected.id);
      if (sample && /^[a-zA-Z0-9_-]{1,100}$/.test(sample))
        detail = await getPilotCalibrationDetail(adminId, selected.id, sample);
    } catch {
      /* Withdrawal or source deletion during a read must not reveal private errors. */
    }
  }
  return (
    <section className="space-y-5 border-t pt-6" aria-label="Piloto controlado">
      <h2 className="text-2xl font-bold">Piloto controlado · relatório do período</h2>
      <p>
        {from} até {through}. Até 10 participantes; objetivo operacional: 3–5 por aproximadamente 14
        dias.
      </p>
      <p className="text-muted-foreground text-sm">
        Observações após o aceite atual. Datas educacionais seguem o aluno; datas das amostras de
        calibração seguem UTC. Tempo é estimado. Sessões encerradas fora da coleta são excluídas.
        Não há custo em moeda sem preços configurados.
      </p>
      <PilotMutationForm action={pilotAdminAction} label="Convidar para o piloto">
        <input type="hidden" name="operation" value="invite" />
        <label className="block space-y-1">
          <span>ID do aluno com onboarding concluído</span>
          <input className={field} name="userId" required maxLength={100} />
        </label>
      </PilotMutationForm>
      {report.truncated && (
        <p role="status">Resultado parcial: reduza o período. Não use esta amostra para ajustes.</p>
      )}
      {report.participants.length === 0 && <p>Nenhum participante corresponde à seleção.</p>}
      {report.participants.map((p) => {
        const o = p.observation;
        return (
          <article
            key={p.id}
            data-pilot-participant={p.id}
            data-pilot-status={p.status}
            className="border-border space-y-3 rounded-xl border p-4"
          >
            <h3 className="text-lg font-semibold">
              <Link className="text-primary underline" href={href(p.id)}>
                {p.label}
              </Link>{" "}
              · {PILOT_STATUS_LABELS[p.status]}
            </h3>
            <p className="text-sm break-all">
              ID: {p.id} · Aceite: {p.consentedAt?.toISOString() ?? "pendente"} ·{" "}
              {p.consentVersion ?? "sem versão"}
            </p>
            {o && (
              <>
                <h4 className="font-semibold">Observação</h4>
                <p>
                  {o.activeDays} dias com tempo observado · {activeMinutes(o.activeSeconds)} ativos
                  no período. Sessões iniciadas: {o.sessionTotals.completed}/{o.sessionTotals.count}{" "}
                  concluídas; meta somada {o.sessionTotals.goalMinutes} min, plano disponível{" "}
                  {activeMinutes(o.sessionTotals.plannedSeconds)}, tempo nas sessões{" "}
                  {activeMinutes(o.sessionTotals.activeSeconds)}. Tempo das sessões já faz parte do
                  total observado.
                </p>
                <p>
                  {o.introduced} conceitos introduzidos, {o.strengthened} fortalecidos;{" "}
                  {o.sessionTotals.fatigueSessions} sessões com possível queda no fim.
                </p>
                <p>
                  Escrita: {o.writing.practice} primeiras tentativas no curso; {o.writing.placement}{" "}
                  respostas no placement ({o.writing.scoredPlacement} pontuadas). Fala:{" "}
                  {o.speech.map((s) => `${s.locale}: ${s.attempts}`).join(" · ")}.
                </p>
                <p>
                  Percepção:{" "}
                  {o.difficulty
                    .map((d) => `${DIFFICULTY_LABELS[d.difficulty]}: ${d.samples}`)
                    .join(" · ")}
                  .
                </p>
                <p>
                  Habilidades atuais de menor estimativa medida:{" "}
                  {o.weakSkills
                    .map((s) => `${SKILL_LABELS[s.skill].pt} (${s.theta.toFixed(2)}, ${s.method})`)
                    .join(" · ") || "sem medição objetiva suficiente"}
                  . Estado atual, não ganho causado pelo piloto.
                </p>
                <details>
                  <summary>Retenção, ritmo e variações de habilidade</summary>
                  <ul className="mt-2 space-y-1 text-sm">
                    {o.metrics.retention.intervals.map((r) => (
                      <li key={r.interval}>
                        {r.interval}: {r.successes}/{r.samples} lembrados;{" "}
                        {r.percent === null
                          ? "amostra insuficiente para percentual"
                          : `${r.percent}%`}
                        .
                      </li>
                    ))}
                    {o.metrics.pace
                      .filter((r) => r.sessions > 0)
                      .map((r) => (
                        <li key={r.pace}>
                          {r.pace}: {r.sessions} sessões, {r.days} dias,{" "}
                          {Math.round(r.completion * 100)}% de etapas;{" "}
                          {r.comparable
                            ? "mínimo descritivo alcançado"
                            : "sem amostra para comparar ritmos"}
                          .
                        </li>
                      ))}
                    {o.metrics.skillChanges.map((c, i) => (
                      <li key={i}>
                        {c.at.toISOString()}: {c.skill} {c.before.toFixed(2)} → {c.after.toFixed(2)}{" "}
                        (escala interna).
                      </li>
                    ))}
                  </ul>
                </details>
                <details>
                  <summary>Unidades de uso e confiabilidade</summary>
                  <ul className="mt-2 space-y-1 text-sm">
                    {o.metrics.provider.map((u) => (
                      <li key={`${u.provider}:${u.operation}:${u.simulated}`}>
                        {u.provider} · {u.operation}
                        {u.simulated ? " · simulado" : " · real"}: {u.requests} chamadas,{" "}
                        {u.failures} falhas; {u.inputTokens}/{u.outputTokens} tokens entrada/saída;{" "}
                        {(u.audioMs / 1000).toFixed(1)} s áudio; {u.textCharacters} caracteres TTS;{" "}
                        {u.unknownUnits} com unidades desconhecidas.
                      </li>
                    ))}
                  </ul>
                </details>
                <p data-pilot-calibration-summary>
                  {o.calibration.report.compared} de {o.calibration.report.samples} amostras
                  comparadas. Nenhum critério foi alterado.
                </p>
                <details>
                  <summary>Comparações humanas</summary>
                  <ul className="mt-2 text-sm">
                    {o.calibration.report.speech.map((r) => (
                      <li key={r.locale}>
                        {r.locale}: {r.agreements}/{r.samples} acordos humanos.
                      </li>
                    ))}
                    {o.calibration.report.writing.map((r) => (
                      <li key={r.criterion}>
                        {r.criterion}: {r.samples} amostras; diferença média sistema − humano{" "}
                        {r.meanDifference?.toFixed(2) ?? "indisponível"}; {r.largeDisagreements}{" "}
                        diferenças de pelo menos 2 bandas.
                      </li>
                    ))}
                  </ul>
                </details>
                <h4 className="font-semibold">Interpretação</h4>
                <p className="text-sm">{o.interpretation}</p>
                {p.status === "active" && (
                  <PilotMutationForm
                    action={pilotAdminAction}
                    label="Encerrar coleta deste participante"
                  >
                    <input type="hidden" name="operation" value="finish" />
                    <input type="hidden" name="userId" value={p.id} />
                  </PilotMutationForm>
                )}
              </>
            )}
          </article>
        );
      })}
      {selected?.observation && (
        <section className="space-y-4" aria-label="Revisão do participante selecionado">
          <h3 className="text-xl font-bold">Revisão do participante selecionado</h3>
          {sources && (
            <PilotMutationForm action={pilotAdminAction} label="Selecionar amostra para revisão">
              <input type="hidden" name="operation" value="add" />
              <input type="hidden" name="userId" value={selected.id} />
              <label className="block space-y-1">
                <span>Avaliação consentida</span>
                <select className={field} name="source" required defaultValue="">
                  <option value="">Selecionar avaliação real</option>
                  {sources.sources.map((s) => (
                    <option key={`${s.kind}:${s.id}`} value={`${s.kind}:${s.id}`}>
                      {s.kind} · {s.locale ?? "escrita"} · {s.activityId} · {s.at.toISOString()}
                    </option>
                  ))}
                </select>
              </label>
              {sources.truncated && (
                <p>Inventário limitado às 25 avaliações recentes de cada tipo.</p>
              )}
            </PilotMutationForm>
          )}
          <ul>
            {selected.observation.calibration.samples.map((s) => (
              <li key={s.id}>
                <Link href={href(selected.id, s.id)} className="text-primary underline">
                  Revisar {s.kind} · {s.reviewedAt ? "comparada" : "pendente"} · {s.id.slice(-8)}
                </Link>
              </li>
            ))}
          </ul>
          {sample && !detail && <p role="alert">Amostra indisponível para este participante.</p>}
          {detail && (
            <div className="border-border space-y-4 rounded-xl border p-4">
              <h4 className="text-lg font-bold">Amostra selecionada para revisão humana</h4>
              <p className="break-words whitespace-pre-wrap">{detail.sourceText}</p>
              {detail.record.kind === "speech" && (
                <p>
                  O aplicativo não guardou o áudio. Julgue apenas após ouvir a mesma amostra com
                  autorização adicional do participante. A transcrição não basta para avaliar
                  pronúncia. Bandas 0–4 de inteligibilidade e pronúncia são ordinais; não equivalem
                  a CEFR ou percentuais Azure.
                </p>
              )}
              {detail.record.kind === "writing" && (
                <p>
                  Rubrica: {detail.record.rubric.expectedLevel}; requisitos:{" "}
                  {detail.record.rubric.taskRequirements.join("; ")}. Bandas 0–4: 0 sem evidência
                  utilizável; 1 falhas frequentes; 2 atende parcialmente; 3 atende ao nível
                  esperado; 4 atende com segurança ao nível esperado.
                </p>
              )}
              <PilotMutationForm action={pilotAdminAction} label="Salvar revisão humana">
                <input type="hidden" name="operation" value="review" />
                <input type="hidden" name="userId" value={selected.id} />
                <input type="hidden" name="sampleId" value={detail.id} />
                <input type="hidden" name="kind" value={detail.record.kind} />
                {detail.record.kind === "writing" ? (
                  WRITING_CRITERIA.map((c) => (
                    <label className="flex flex-wrap items-center gap-3" key={c}>
                      <span>Nota humana: {c}</span>
                      {bandInput(
                        c,
                        detail.record.kind === "writing"
                          ? detail.record.humanScores?.[c]
                          : undefined,
                      )}
                    </label>
                  ))
                ) : (
                  <>
                    <label className="flex items-center gap-3">
                      Pronúncia humana{" "}
                      {bandInput("pronunciationBand", detail.record.human?.pronunciationBand)}
                    </label>
                    <label className="flex items-center gap-3">
                      Inteligibilidade humana{" "}
                      {bandInput("intelligibilityBand", detail.record.human?.intelligibilityBand)}
                    </label>
                    <label className="flex items-start gap-2">
                      <input type="checkbox" name="heardConsentedSample" required />
                      Ouvi esta amostra com autorização do participante.
                    </label>
                    <label className="block">
                      Concorda com a interpretação do sistema?{" "}
                      <select name="agreesWithSystem" className={field} required defaultValue="">
                        <option value="">Selecionar</option>
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                      </select>
                    </label>
                  </>
                )}
                <label className="block">
                  Nota curta do revisor (sem dados pessoais)
                  <textarea
                    name="notes"
                    maxLength={500}
                    rows={3}
                    defaultValue={detail.record.notes}
                    className={`${field} mt-1 w-full`}
                  />
                </label>
              </PilotMutationForm>
              <details>
                <summary>Valores do sistema (consulte após seu julgamento inicial)</summary>
                <pre className="overflow-x-auto text-xs">
                  {JSON.stringify(
                    detail.record.kind === "writing"
                      ? detail.record.modelScores
                      : {
                          scores: detail.record.providerScores,
                          interpretation: detail.record.systemInterpretation,
                        },
                    null,
                    2,
                  )}
                </pre>
              </details>
              <p className="text-muted-foreground text-sm">
                Uma revisão por amostra. Salvar novamente substitui a revisão anterior; este fluxo
                não mede concordância entre dois revisores independentes.
              </p>
            </div>
          )}
          <details>
            <summary>Comentários privados recentes (até 14; retenção de 90 dias)</summary>
            <ul className="mt-3 space-y-2">
              {comments?.map((c, i) => (
                <li key={i} className="break-words whitespace-pre-wrap">
                  {c.createdAt.toISOString()} · {c.context} · {DIFFICULTY_LABELS[c.difficulty]}:{" "}
                  {c.text ?? "sem comentário"}
                </li>
              ))}
            </ul>
          </details>
          <h4 className="font-semibold">Linha do tempo do piloto (sem textos privados)</h4>
          <ol className="space-y-2 text-sm">
            {selected.observation.timeline.map((e, i) => (
              <li key={i}>
                <time>{e.at.toISOString()}</time> · {e.type}
                <pre className="overflow-x-auto text-xs">{JSON.stringify(e.metadata)}</pre>
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}
