"use client";

import { Lightbulb } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { ActivityRenderer } from "@/components/activities/activity-renderer";
import { emptyDraft, isAnswerable, toResponse, type Draft } from "@/components/activities/draft";
import { LocalizedText } from "@/components/activities/localized-text";
import { Button } from "@/components/ui/button";
import type { ClientActivity, ClientFeedback } from "@/lib/learning/activities/client";
import type { ActivityResponse } from "@/lib/learning/grading/grade";
import type { SupportMode } from "@/lib/learning/language-support";
import type { SubmitResult } from "@/server/services/practice";
import { FeedbackPanel } from "./feedback-panel";

export type CheckFn = (input: {
  response: ActivityResponse;
  hinted: boolean;
  durationMs: number;
}) => Promise<{ ok: true; result: SubmitResult } | { ok: false; error: string }>;

/** Activity types whose renderer already shows the right answer inline. */
const SHOWS_ANSWER_INLINE = new Set([
  "choice",
  "multi_select",
  "minimal_pair",
  "reading",
  "listening",
  "match",
  "fill",
  "order",
]);

/**
 * One activity: answer → check on the server → feedback → continue.
 * Teaching cards only need "Continuar".
 */
export function PracticeStep({
  activity,
  support,
  onCheck,
  onSeen,
  onContinue,
}: {
  activity: ClientActivity;
  support: SupportMode;
  onCheck: CheckFn;
  onSeen?: (durationMs: number) => Promise<void>;
  onContinue: (result: SubmitResult | null) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(activity));
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [hinted, setHinted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(0);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    top.current?.focus({ preventScroll: false });
  }, []);

  const teach = activity.type === "teach";
  const feedback: ClientFeedback | undefined = result?.feedback;
  const instruction = !teach ? activity.instruction : undefined;
  const hint = !teach ? activity.hint : undefined;

  function primary() {
    if (pending) return;
    if (teach) {
      const elapsed = Date.now() - startedAt.current;
      startTransition(async () => {
        await onSeen?.(elapsed);
        onContinue(null);
      });
      return;
    }
    if (result) {
      onContinue(result);
      return;
    }
    if (!isAnswerable(activity, draft)) return;
    setError(null);
    startTransition(async () => {
      const response = await onCheck({
        response: toResponse(activity, draft),
        hinted,
        durationMs: Date.now() - startedAt.current,
      });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setResult(response.result);
    });
  }

  const label = teach ? "Continuar" : result ? "Continuar" : pending ? "Verificando…" : "Verificar";
  const disabled = pending || (!teach && !result && !isAnswerable(activity, draft));

  return (
    <form
      data-step={activity.id}
      data-checked={result ? "true" : "false"}
      className="flex flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        primary();
      }}
    >
      <div ref={top} tabIndex={-1} className="flex-1 outline-none">
        {instruction && (
          <p className="text-muted-foreground mb-5 text-base font-medium">
            <LocalizedText value={instruction} support={support} />
          </p>
        )}
        <ActivityRenderer
          activity={activity}
          draft={draft}
          onDraft={setDraft}
          locked={Boolean(result) || pending}
          feedback={feedback}
          support={support}
        />
        {hint && !result && (
          <div className="mt-6">
            {hinted ? (
              <p className="bg-highlight/20 rounded-xl px-4 py-3">
                <LocalizedText value={hint} support={support} />
              </p>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setHinted(true)}>
                <Lightbulb /> Ver dica
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="bg-background/95 sticky bottom-0 mt-8 space-y-3 py-4 backdrop-blur">
        {feedback && (
          <FeedbackPanel
            feedback={feedback}
            support={support}
            showExpected={!SHOWS_ANSWER_INLINE.has(activity.type)}
          />
        )}
        {error && (
          <p
            role="alert"
            className="text-destructive bg-destructive-soft rounded-lg px-3 py-2 text-sm"
          >
            {error}
          </p>
        )}
        <Button type="submit" disabled={disabled} className="h-12 w-full rounded-xl text-base">
          {label}
        </Button>
      </div>
    </form>
  );
}
