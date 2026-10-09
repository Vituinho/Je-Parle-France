"use client";
import { useActionState } from "react";
import { compareCalibrationAction } from "@/app/(app)/admin/piloto/actions";
import { Button } from "@/components/ui/button";

export function PilotCalibration() {
  const [result, action, pending] = useActionState(compareCalibrationAction, null);
  return (
    <section className="border-border space-y-4 border-t pt-6" aria-labelledby="human-calibration">
      <h2 id="human-calibration" className="text-xl font-bold">
        Calibração humana
      </h2>
      <p className="text-muted-foreground text-sm">
        Registre avaliações, concordância e notas no arquivo privado do kit existente (npm run
        calibration -- init). Envie o JSON para comparar as sete dimensões de escrita e a
        concordância de fala por fr-FR/fr-CA. O arquivo é processado em memória; o relatório não
        inclui notas, textos, áudios ou identificação do avaliador. Os critérios de avaliação
        continuam iguais.
      </p>
      <form action={action} className="flex flex-wrap items-end gap-3">
        <label className="block space-y-2">
          <span className="block font-medium">Arquivo do kit de calibração</span>
          <input
            required
            type="file"
            name="records"
            accept="application/json,.json"
            className="border-border block max-w-full rounded-lg border p-2 text-sm"
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Comparando…" : "Comparar avaliações"}
        </Button>
      </form>
      {result && !result.ok && <p role="alert">{result.error}</p>}
      {result?.ok && (
        <div role="status" className="space-y-3">
          <p>
            {result.report.compared} de {result.report.samples} amostras comparadas. Nenhum critério
            foi alterado.
          </p>
          <ul className="space-y-1 text-sm">
            {result.report.speech.map((s) => (
              <li key={s.locale}>
                {s.locale}: {s.agreements} concordâncias em {s.samples} comparações de fala.
              </li>
            ))}
            {result.report.writing.map((w) => (
              <li key={w.criterion}>
                {w.criterion}: {w.samples} amostras, {w.largeDisagreements} diferenças de pelo menos
                2 pontos (escala 0–4).
              </li>
            ))}
          </ul>
          <details>
            <summary className="cursor-pointer text-sm">
              Comparações por amostra e diferenças de escrita
            </summary>
            <pre className="bg-muted mt-2 max-h-96 overflow-auto rounded-xl p-3 text-xs">
              {JSON.stringify(result.report.comparisons, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}
