"use client";

import { ArrowLeft, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { endConversationAction, sendMessageAction } from "@/app/(app)/tutor/actions";
import { AudioButton, VoiceNotice } from "@/components/activities/audio-button";
import { AccentBar } from "@/components/activities/renderers/text";
import { Inline } from "@/components/activities/rich-text";
import { Fr } from "@/components/fr";
import { Button } from "@/components/ui/button";
import {
  CORRECTION_MODE_LABELS,
  type CorrectionMode,
  type StoredReport,
  type TutorCorrection,
} from "@/lib/learning/tutor/tutor";
import { cn } from "@/lib/utils";
import { TutorReport } from "./tutor-report";

export interface ChatTurn {
  id: string;
  role: "learner" | "tutor";
  content: string;
  corrections: TutorCorrection[];
}

const MAX_LENGTH = 500;

function Corrections({ corrections }: { corrections: TutorCorrection[] }) {
  if (corrections.length === 0) return null;
  return (
    <ul className="mt-2 space-y-2" aria-label="Correções">
      {corrections.map((correction) => (
        <li
          key={`${correction.wrong}-${correction.right}`}
          className="bg-card border-border rounded-xl border px-3 py-2 text-left text-sm"
        >
          <p className="text-base">
            <Fr className="correction">{correction.wrong}</Fr>
            <span className="text-muted-foreground mx-1.5" aria-hidden>
              →
            </span>
            <span className="sr-only">melhor: </span>
            <Fr className="highlight">{correction.right}</Fr>
          </p>
          <p className="text-muted-foreground mt-0.5 leading-relaxed">
            <Inline text={correction.explanationPt} />
          </p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Text conversation with the tutor. Corrections appear under the learner's
 * own message according to the chosen correction mode; ending the
 * conversation produces the report in place.
 */
export function TutorChat({
  conversationId,
  title,
  goal,
  correctionMode,
  initialTurns,
  initialReport,
  simulated,
  sessionId,
  region,
}: {
  conversationId: string;
  title: string;
  goal?: string;
  correctionMode: CorrectionMode;
  initialTurns: ChatTurn[];
  initialReport: StoredReport | null;
  simulated: boolean;
  sessionId?: string;
  region: "fr-FR" | "fr-CA";
}) {
  const [turns, setTurns] = useState(initialTurns);
  const [report, setReport] = useState<StoredReport | null>(initialReport);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const [ending, startEnding] = useTransition();
  const input = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, sending]);

  const learnerTurns = turns.filter((turn) => turn.role === "learner").length;
  const backHref = sessionId ? "/sessao" : "/hoje";

  function send() {
    const message = text.trim();
    if (!message || sending || report) return;
    setError(null);
    const optimisticId = `pending-${Date.now()}`;
    setTurns((current) => [
      ...current,
      { id: optimisticId, role: "learner", content: message, corrections: [] },
    ]);
    setText("");
    startSending(async () => {
      const result = await sendMessageAction({ conversationId, text: message });
      if (!result.ok) {
        setError(result.error);
        setTurns((current) => current.filter((turn) => turn.id !== optimisticId));
        setText(message);
        return;
      }
      setTurns((current) => [
        ...current.filter((turn) => turn.id !== optimisticId),
        { ...result.turn.learner, role: "learner" },
        { ...result.turn.tutor, role: "tutor", corrections: [] },
      ]);
      input.current?.focus();
    });
  }

  function end() {
    setError(null);
    startEnding(async () => {
      const result = await endConversationAction({ conversationId, sessionId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReport(result.report);
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-5 sm:px-8">
      <header className="border-border flex items-center gap-3 border-b pb-4">
        <Button asChild variant="ghost" size="icon-lg" aria-label="Voltar">
          <Link href={sessionId ? "/sessao" : "/tutor"}>
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{title}</h1>
          <p className="text-muted-foreground truncate text-sm">
            {CORRECTION_MODE_LABELS[correctionMode].title}
            {simulated && " · modo simulado"}
          </p>
        </div>
        {!report && (
          <Button
            type="button"
            variant="outline"
            onClick={end}
            disabled={ending || sending}
            className="rounded-xl"
          >
            {ending ? "Gerando…" : "Encerrar"}
          </Button>
        )}
      </header>

      <VoiceNotice className="mt-4" />
      {goal && !report && (
        <p className="bg-accent mt-4 rounded-xl px-4 py-3 text-sm leading-relaxed">
          <strong>Sua missão:</strong> {goal}
        </p>
      )}

      <ol className="flex-1 space-y-5 py-6" aria-live="polite" aria-label="Mensagens">
        {turns.map((turn) => (
          <li
            key={turn.id}
            className={cn("flex", turn.role === "learner" ? "justify-end" : "justify-start")}
          >
            <div className={cn("max-w-[85%]", turn.role === "learner" && "text-right")}>
              <div
                className={cn(
                  "inline-flex items-start gap-3 rounded-2xl px-4 py-3 text-left",
                  turn.role === "tutor"
                    ? "bg-card border-border border"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {turn.role === "tutor" && (
                  <AudioButton
                    size="sm"
                    showSlow
                    lines={[{ text: turn.content, region }]}
                    label="Ouvir"
                  />
                )}
                <Fr as="p" className="text-[1.15rem] leading-snug whitespace-pre-wrap">
                  {turn.content}
                </Fr>
              </div>
              {turn.role === "learner" && <Corrections corrections={turn.corrections} />}
            </div>
          </li>
        ))}
        {sending && (
          <li className="text-muted-foreground text-sm" role="status">
            O tutor está escrevendo…
          </li>
        )}
      </ol>
      <div ref={bottom} />

      {error && (
        <p
          role="alert"
          className="text-destructive bg-destructive-soft mb-3 rounded-lg px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}

      {report ? (
        <div className="border-border border-t py-8">
          <TutorReport
            report={report}
            backHref={backHref}
            backLabel={sessionId ? "Voltar para a sessão" : "Voltar para hoje"}
          />
        </div>
      ) : (
        <form
          className="bg-background/95 sticky bottom-0 space-y-3 py-4 backdrop-blur"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={input}
              lang="fr"
              rows={2}
              value={text}
              maxLength={MAX_LENGTH}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="Escreva em francês…"
              aria-label="Sua mensagem em francês"
              spellCheck={false}
              className="border-input bg-card focus-visible:border-primary font-fr min-h-12 flex-1 resize-none rounded-2xl border-[1.5px] px-4 py-3 text-lg outline-none"
            />
            <Button
              type="submit"
              size="icon-lg"
              disabled={sending || !text.trim()}
              aria-label="Enviar"
              className="size-12 rounded-2xl"
            >
              <SendHorizontal />
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <AccentBar target={input} onInsert={setText} disabled={sending} />
          </div>
          <p className="text-muted-foreground text-xs">
            Enter envia · Shift+Enter quebra a linha · {text.length}/{MAX_LENGTH}
            {learnerTurns >= 6 && " · Quando quiser, encerre para ver o relatório."}
          </p>
        </form>
      )}
    </div>
  );
}
