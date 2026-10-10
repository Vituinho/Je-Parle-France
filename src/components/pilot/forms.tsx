"use client";
import { useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { pilotLearnerAction, type PilotFormState } from "@/app/(app)/piloto/actions";
import { DIFFICULTY_LABELS } from "@/lib/pilot/schema";

export function PilotMutationForm({
  action,
  children,
  label,
  hideAfterSuccess = false,
}: {
  action: (state: PilotFormState, form: FormData) => Promise<PilotFormState>;
  children: ReactNode;
  label: string;
  hideAfterSuccess?: boolean;
}) {
  const [state, submit, pending] = useActionState(action, { ok: false, message: "" });
  return (
    <form action={submit} className="space-y-3">
      {!(hideAfterSuccess && state.ok) && (
        <>
          {children}
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : label}
          </Button>
        </>
      )}
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className="text-sm">
          {state.message}
        </p>
      )}
    </form>
  );
}
export function PilotFeedbackForm({
  context,
  sourceId,
}: {
  context: "session" | "weekly";
  sourceId: string;
}) {
  return (
    <details className="border-border mt-6 rounded-xl border p-4">
      <summary className="cursor-pointer font-semibold">Deixar feedback opcional do piloto</summary>
      <div className="mt-4">
        <PilotMutationForm action={pilotLearnerAction} label="Enviar feedback" hideAfterSuccess>
          <input type="hidden" name="operation" value="feedback" />
          <input type="hidden" name="context" value={context} />
          <input type="hidden" name="sourceId" value={sourceId} />
          <fieldset>
            <legend className="mb-2">
              Como foi {context === "session" ? "esta sessão" : "esta semana"}?
            </legend>
            <div className="flex flex-wrap gap-4">
              {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2">
                  <input type="radio" name="difficulty" value={value} required />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block space-y-1">
            <span>Teve algum problema? (opcional)</span>
            <textarea
              name="text"
              maxLength={500}
              rows={3}
              className="border-border bg-background w-full rounded-lg border p-2"
            />
          </label>
          <p className="text-muted-foreground text-sm">
            Não inclua dados pessoais. Sua percepção não muda suas notas. Até um feedback por dia.
          </p>
        </PilotMutationForm>
      </div>
    </details>
  );
}
