"use client";

import { useMemo, useRef, useState } from "react";
import { Fr } from "@/components/fr";
import type { DiffToken } from "@/lib/learning/grading/text";
import { cn } from "@/lib/utils";
import { AudioButton } from "../audio-button";
import { PromptView, type RendererProps } from "./shared";

const ACCENTS = ["é", "è", "ê", "à", "â", "ç", "ù", "û", "î", "ï", "ô", "ë", "œ", "’"];

/** Brazilian keyboards make some French characters awkward; one tap inserts them. */
export function AccentBar({
  target,
  onInsert,
  disabled,
}: {
  target: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onInsert: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Inserir caractere francês">
      {ACCENTS.map((char) => (
        <button
          key={char}
          type="button"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const element = target.current;
            if (!element) return;
            const start = element.selectionStart ?? element.value.length;
            const end = element.selectionEnd ?? element.value.length;
            const insert = char === "’" ? "'" : char;
            const next = element.value.slice(0, start) + insert + element.value.slice(end);
            onInsert(next);
            requestAnimationFrame(() => {
              element.focus();
              element.setSelectionRange(start + insert.length, start + insert.length);
            });
          }}
          className="border-border bg-card hover:border-primary/50 font-fr h-9 min-w-9 rounded-lg border px-2 text-lg disabled:opacity-40"
        >
          {char}
        </button>
      ))}
    </div>
  );
}

/** The learner's answer with the teacher's red pen on what differs. */
export function DiffView({ diff }: { diff: DiffToken[] }) {
  return (
    <Fr as="p" className="text-xl leading-relaxed">
      {diff.map((token, i) => {
        const space = i > 0 && !diff[i - 1]?.text.endsWith("'") ? " " : "";
        if (token.status === "missing") {
          return (
            <span key={i}>
              {space}
              <span className="text-success border-success rounded border border-dashed px-1">
                {token.text}
              </span>
            </span>
          );
        }
        return (
          <span key={i}>
            {space}
            <span
              className={cn(token.status !== "ok" && "correction")}
              title={token.expected ? `Esperado: ${token.expected}` : undefined}
            >
              {token.text}
            </span>
          </span>
        );
      })}
    </Fr>
  );
}

function TextAnswer({
  value,
  onChange,
  locked,
  multiline,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  locked: boolean;
  multiline?: boolean;
  placeholder?: string;
  label: string;
}) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const shared = {
    ref,
    lang: "fr",
    value,
    disabled: locked,
    spellCheck: false,
    autoCapitalize: "off",
    autoComplete: "off",
    autoCorrect: "off",
    "aria-label": label,
    placeholder,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    className:
      "border-input bg-card focus-visible:border-primary w-full rounded-2xl border-[1.5px] px-4 py-3 font-fr text-xl outline-none disabled:opacity-80",
  };
  return (
    <div className="space-y-3">
      {multiline ? <textarea rows={5} {...shared} /> : <input type="text" {...shared} />}
      <AccentBar target={ref} onInsert={onChange} disabled={locked} />
    </div>
  );
}

export function TypeRenderer({
  activity,
  draft,
  onDraft,
  locked,
  feedback,
}: RendererProps<"type">) {
  const text = draft.kind === "text" ? draft.text : "";
  return (
    <div className="space-y-6">
      <PromptView prompt={activity.prompt} revealed={locked} />
      <TextAnswer
        label="Sua resposta em francês"
        placeholder="Escreva em francês…"
        value={text}
        onChange={(value) => onDraft({ kind: "text", text: value })}
        locked={locked}
      />
      {feedback?.diff && !feedback.correct && <DiffView diff={feedback.diff} />}
    </div>
  );
}

export function DictationRenderer({
  activity,
  draft,
  onDraft,
  locked,
  feedback,
}: RendererProps<"dictation">) {
  const text = draft.kind === "text" ? draft.text : "";
  return (
    <div className="space-y-6">
      <div className="flex justify-center py-2">
        <AudioButton
          size="lg"
          lines={[{ text: activity.audio.text, region: activity.audio.region }]}
        />
      </div>
      <TextAnswer
        label="Escreva o que você ouviu"
        placeholder="Escreva o que ouviu…"
        value={text}
        onChange={(value) => onDraft({ kind: "text", text: value })}
        locked={locked}
      />
      {feedback?.diff && feedback.verdict !== "correct" && <DiffView diff={feedback.diff} />}
      {locked && activity.translation && (
        <p className="text-muted-foreground">{activity.translation}</p>
      )}
    </div>
  );
}

export function ErrorCorrectionRenderer({
  activity,
  draft,
  onDraft,
  locked,
  feedback,
}: RendererProps<"error_correction">) {
  const text = draft.kind === "text" ? draft.text : "";
  return (
    <div className="space-y-6">
      <div className="border-border bg-card rounded-2xl border p-5">
        <p className="text-muted-foreground mb-1 text-sm">Frase com erro:</p>
        <Fr as="p" className="text-2xl">
          {activity.sentence}
        </Fr>
      </div>
      <TextAnswer
        label="Frase corrigida"
        value={text}
        onChange={(value) => onDraft({ kind: "text", text: value })}
        locked={locked}
      />
      {feedback?.diff && !feedback.correct && <DiffView diff={feedback.diff} />}
    </div>
  );
}

export function OpenWritingRenderer({
  activity,
  draft,
  onDraft,
  locked,
  support,
}: RendererProps<"open_writing">) {
  const text = draft.kind === "text" ? draft.text : "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div className="space-y-5">
      <p className="text-xl leading-snug font-semibold">
        {support === "fr" && activity.prompt.fr ? (
          <Fr>{activity.prompt.fr}</Fr>
        ) : (
          activity.prompt.pt
        )}
      </p>
      <TextAnswer
        multiline
        label="Seu texto em francês"
        value={text}
        onChange={(value) => onDraft({ kind: "text", text: value })}
        locked={locked}
      />
      <p
        className={cn(
          "text-sm",
          words >= activity.minWords ? "text-success" : "text-muted-foreground",
        )}
      >
        {words} {words === 1 ? "palavra" : "palavras"} · mínimo {activity.minWords}
      </p>
    </div>
  );
}

export function FillRenderer({
  activity,
  draft,
  onDraft,
  locked,
  feedback,
}: RendererProps<"fill">) {
  const blanks = draft.kind === "blanks" ? draft.blanks : [];
  const [focused, setFocused] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const focusedRef = useMemo(
    () => ({
      get current() {
        return inputs.current[focused] ?? null;
      },
    }),
    [focused],
  );
  const set = (index: number, value: string) => {
    const next = [...blanks];
    next[index] = value;
    onDraft({ kind: "blanks", blanks: next });
  };
  return (
    <div className="space-y-6">
      <Fr as="p" className="text-[1.6rem] leading-[2.4]">
        {activity.parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < activity.parts.length - 1 && (
              <input
                ref={(element) => {
                  inputs.current[index] = element;
                }}
                type="text"
                lang="fr"
                aria-label={`Lacuna ${index + 1}`}
                value={blanks[index] ?? ""}
                disabled={locked}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                onFocus={() => setFocused(index)}
                onChange={(event) => set(index, event.target.value)}
                size={Math.max(4, (blanks[index] ?? "").length + 1)}
                className={cn(
                  "border-primary/60 bg-accent focus:border-primary font-fr mx-1 rounded-lg border-b-2 px-2 py-0.5 text-center outline-none",
                  feedback?.parts?.[index] === true && "border-success bg-success-soft",
                  feedback?.parts?.[index] === false && "border-destructive bg-destructive-soft",
                )}
              />
            )}
          </span>
        ))}
      </Fr>
      {activity.wordBank ? (
        <div className="flex flex-wrap gap-2">
          {activity.wordBank.map((word) => (
            <button
              key={word}
              type="button"
              disabled={locked}
              onClick={() => {
                const empty = blanks.findIndex((blank) => !blank.trim());
                set(empty === -1 ? focused : empty, word);
              }}
              className="border-border bg-card hover:border-primary/50 font-fr rounded-xl border px-3 py-1.5 text-lg"
            >
              {word}
            </button>
          ))}
        </div>
      ) : (
        <AccentBar
          target={focusedRef}
          onInsert={(value) => set(focused, value)}
          disabled={locked}
        />
      )}
      {activity.translation && <p className="text-muted-foreground">{activity.translation}</p>}
      {feedback?.expected && !feedback.correct && (
        <p className="text-lg">
          <span className="text-muted-foreground text-sm">Resposta: </span>
          <Fr>{feedback.expected}</Fr>
        </p>
      )}
    </div>
  );
}
