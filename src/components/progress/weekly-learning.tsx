import { SKILL_LABELS } from "@/lib/learning/skills";
import type { learningMetrics } from "@/lib/learning/telemetry/metrics";

export function activeMinutes(seconds: number) {
  if (seconds > 0 && seconds < 60) return "menos de 1 min";
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}min` : `${minutes} min`;
}
export function WeeklyLearning({ metrics }: { metrics: ReturnType<typeof learningMetrics> }) {
  const week = metrics.weekly;
  const useful = metrics.skills.filter((s) => s.weekSamples > 0);
  return (
    <section
      aria-labelledby="weekly-learning"
      data-weekly-active-seconds={week.activeSeconds}
      className="border-border bg-card space-y-4 rounded-2xl border p-5"
    >
      <h2 id="weekly-learning" className="text-lg font-bold">
        Aprendizagem na semana
      </h2>
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-muted-foreground text-sm">Tempo ativo aproximado</dt>
          <dd className="text-xl font-semibold">{activeMinutes(week.activeSeconds)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">Referência semanal</dt>
          <dd className="text-xl font-semibold">{activeMinutes(week.referenceMinutes * 60)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">Conceitos fortalecidos</dt>
          <dd>{week.strengthened}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">Recordação posterior</dt>
          <dd>
            {week.retention.delayed.percent === null
              ? "Coletando evidências"
              : `${week.retention.delayed.percent}%`}
          </dd>
        </div>
      </dl>
      <p className="text-muted-foreground text-sm">
        {week.retention.delayed.samples} observações sem dica, após ao menos um dia. Acertos logo
        após estudar são contados separadamente.
      </p>
      {useful.length > 0 ? (
        <ul className="space-y-1 text-sm" aria-label="Evidências da semana">
          {useful.map((s) => (
            <li key={s.skill}>
              {SKILL_LABELS[s.skill].pt}: {s.weekSamples}{" "}
              {s.weekSamples === 1 ? "evidência útil" : "evidências úteis"}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          As evidências por habilidade aparecem conforme você pratica. Tempo de estudo, sozinho, não
          comprova avanço de nível.
        </p>
      )}
      <p className="text-muted-foreground text-xs">
        Contamos janelas de interação nas atividades e conversas. Pausas, espera por avaliação e
        inatividade ficam fora. A referência ajuda a organizar sua rotina.
      </p>
      {metrics.recommendation.map((r) => (
        <p key={r.kind} className="bg-accent rounded-xl p-3 text-sm">
          {r.message}
          <span className="text-muted-foreground mt-1 block">
            Base: {r.sessions} sessões em {r.days} dias. Sua meta continua sob seu controle.
          </span>
        </p>
      ))}
      {metrics.truncated && (
        <p className="text-muted-foreground text-xs">
          Este resumo cobre uma parte do histórico. As sugestões de rotina ficam suspensas.
        </p>
      )}
    </section>
  );
}
