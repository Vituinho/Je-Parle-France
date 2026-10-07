"use client";

import { Check, X } from "lucide-react";
import type { Prompt } from "@/lib/content/schema";
import type { ClientActivity, ClientFeedback } from "@/lib/learning/activities/client";
import type { SupportMode } from "@/lib/learning/language-support";
import { cn } from "@/lib/utils";
import { AudioButton } from "../audio-button";
import type { Draft } from "../draft";

export interface RendererProps<T extends ClientActivity["type"]> {
  activity: Extract<ClientActivity, { type: T }>;
  draft: Draft;
  onDraft: (draft: Draft) => void;
  /** True once the answer was checked (or in placement after submit). */
  locked: boolean;
  feedback?: ClientFeedback;
  support: SupportMode;
}

/** The prompt of an activity: French (serif), Portuguese, and/or audio. */
export function PromptView({
  prompt,
  revealed,
  className,
}: {
  prompt: Prompt;
  revealed: boolean;
  className?: string;
}) {
  const showFr = prompt.fr && (!prompt.hideText || revealed);
  return (
    <div className={cn("space-y-3", className)}>
      {prompt.audio && (
        <AudioButton
          size={prompt.fr && showFr ? "sm" : "lg"}
          lines={[{ text: prompt.audio.text, region: prompt.audio.region }]}
        />
      )}
      {showFr && (
        <p lang="fr" className="font-fr text-[1.65rem] leading-snug">
          {prompt.fr}
        </p>
      )}
      {prompt.pt && (
        <p className={cn(prompt.fr ? "text-muted-foreground text-base" : "text-xl font-semibold")}>
          {prompt.pt}
        </p>
      )}
    </div>
  );
}

export type OptionState = "idle" | "selected" | "correct" | "wrong" | "missed";

/** A selectable option backed by a native input. */
export function OptionRow({
  type,
  name,
  index,
  label,
  lang,
  state,
  disabled,
  onSelect,
  detail,
}: {
  type: "radio" | "checkbox";
  name: string;
  index: number;
  label: string;
  lang: "fr" | "pt";
  state: OptionState;
  disabled: boolean;
  onSelect: () => void;
  detail?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "border-border bg-card flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3.5 transition-colors",
        "has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
        !disabled && "hover:border-primary/40",
        state === "selected" && "border-primary bg-accent",
        state === "correct" && "border-success bg-success-soft",
        state === "wrong" && "border-destructive bg-destructive-soft",
        state === "missed" && "border-success border-dashed",
        disabled && "cursor-default",
      )}
    >
      <input
        type={type}
        name={name}
        checked={
          state === "selected" || state === "wrong" || (state === "correct" && type === "radio")
        }
        onChange={onSelect}
        disabled={disabled}
        className="sr-only"
      />
      <kbd
        aria-hidden
        className={cn(
          "border-border text-muted-foreground grid size-7 shrink-0 place-items-center rounded-lg border text-xs font-semibold",
          state === "selected" && "border-primary text-primary",
        )}
      >
        {state === "correct" || state === "missed" ? (
          <Check className="text-success size-4" strokeWidth={3} />
        ) : state === "wrong" ? (
          <X className="text-destructive size-4" strokeWidth={3} />
        ) : (
          index + 1
        )}
      </kbd>
      <span className="min-w-0 flex-1">
        <span lang={lang} className={cn(lang === "fr" ? "font-fr text-[1.15rem]" : "text-base")}>
          {label}
        </span>
        {detail}
      </span>
    </label>
  );
}

export function optionState(params: {
  index: number;
  selected: boolean;
  feedback?: ClientFeedback;
  correctIndex?: number;
}): OptionState {
  const { index, selected, feedback, correctIndex } = params;
  if (!feedback || correctIndex === undefined) return selected ? "selected" : "idle";
  if (index === correctIndex) return selected ? "correct" : "missed";
  return selected ? "wrong" : "idle";
}
