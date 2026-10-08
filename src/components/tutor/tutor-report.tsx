import Link from "next/link";
import { Inline } from "@/components/activities/rich-text";
import { Fr } from "@/components/fr";
import { Button } from "@/components/ui/button";
import type { StoredReport } from "@/lib/learning/tutor/tutor";

const SCORES = [
  { key: "fluency", label: "Fluência" },
  { key: "vocabulary", label: "Vocabulário" },
  { key: "grammar", label: "Gramática" },
  { key: "comprehension", label: "Compreensão" },
] as const;

/** End-of-conversation report. Scores are shown as numbers with bars, never color alone. */
export function TutorReport({
  report,
  backHref,
  backLabel,
}: {
  report: StoredReport;
  backHref: string;
  backLabel: string;
}) {
  return (
    <section aria-labelledby="report" className="space-y-8">
      <div>
        <Fr as="p" className="text-primary text-xl">
          Le bilan
        </Fr>
        <h2 id="report" className="mt-1 text-2xl font-bold">
          Relatório da conversa
        </h2>
        {report.simulated && (
          <p className="text-muted-foreground mt-2 text-sm">
            Relatório simulado — nenhum provedor de IA configurado.
          </p>
        )}
        <p className="mt-3 leading-relaxed">{report.summaryPt}</p>
      </div>

      {report.learnerTurns > 0 && (
        <dl className="grid gap-4 sm:grid-cols-2">
          {SCORES.map((score) => (
            <div key={score.key}>
              <div className="flex items-baseline justify-between">
                <dt className="font-medium">{score.label}</dt>
                <dd className="text-xl font-bold tabular-nums">{report.scores[score.key]}</dd>
              </div>
              <div className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full" aria-hidden>
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${report.scores[score.key]}%` }}
                />
              </div>
            </div>
          ))}
          <div>
            <div className="flex items-baseline justify-between">
              <dt className="font-medium">Pronúncia</dt>
              <dd className="text-muted-foreground text-sm">
                {report.pronunciation === null
                  ? "não avaliada (conversa por texto)"
                  : report.pronunciation}
              </dd>
            </div>
          </div>
        </dl>
      )}

      {report.strengths.length > 0 && (
        <div>
          <h3 className="text-lg font-bold">O que foi bem</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {report.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        </div>
      )}

      {report.corrections.length > 0 && (
        <div>
          <h3 className="text-lg font-bold">Correções importantes</h3>
          <ul className="mt-3 space-y-4">
            {report.corrections.map((correction) => (
              <li
                key={`${correction.wrong}-${correction.right}`}
                className="border-border border-l-[3px] pl-4"
              >
                <p className="text-lg">
                  <Fr className="correction">{correction.wrong}</Fr>
                  <span className="text-muted-foreground mx-2" aria-hidden>
                    →
                  </span>
                  <span className="sr-only">forma correta: </span>
                  <Fr className="highlight font-medium">{correction.right}</Fr>
                </p>
                <p className="text-muted-foreground mt-1 leading-relaxed">
                  <Inline text={correction.explanationPt} />
                </p>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-4 text-sm">
            Essas correções entraram na sua revisão.
          </p>
        </div>
      )}

      {report.nextSteps.length > 0 && (
        <div>
          <h3 className="text-lg font-bold">Próximos passos</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {report.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="h-12 rounded-xl px-6 text-base">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-xl px-6 text-base">
          <Link href="/tutor">Nova conversa</Link>
        </Button>
      </div>
    </section>
  );
}
