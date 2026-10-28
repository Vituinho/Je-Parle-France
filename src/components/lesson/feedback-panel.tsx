"use client";

import { Check, CircleDot, X } from "lucide-react";
import { Fr } from "@/components/fr";
import { LocalizedText } from "@/components/activities/localized-text";
import { AudioButton } from "@/components/activities/audio-button";
import type { ClientFeedback } from "@/lib/learning/activities/client";
import type { SupportMode } from "@/lib/learning/language-support";
import { cn } from "@/lib/utils";

const HEADINGS = {
  correct: { fr: "C'est ça !", pt: "Isso!" },
  alternative: { fr: "Bonne alternative !", pt: "Boa alternativa!" },
  almost: { fr: "Presque !", pt: "Quase!" },
  wrong: { fr: "Pas tout à fait.", pt: "Ainda não." },
  recorded: { fr: "C'est noté.", pt: "Registrado." },
} as const;

/**
 * Feedback after checking an answer. Errors are framed as information — what
 * was expected, what differed and why — never as a scolding.
 */
export function FeedbackPanel({
  feedback,
  support,
  showExpected,
}: {
  feedback: ClientFeedback;
  support: SupportMode;
  /** Whether to show the model answer (not needed when the renderer already marks it). */
  showExpected: boolean;
}) {
  const heading = HEADINGS[feedback.verdict];
  const Icon =
    feedback.verdict === "correct" || feedback.verdict === "alternative"
      ? Check
      : feedback.verdict === "wrong"
        ? X
        : CircleDot;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 rounded-2xl border-[1.5px] p-4 sm:p-5",
        (feedback.verdict === "correct" || feedback.verdict === "alternative") &&
          "border-success bg-success-soft",
        feedback.verdict === "almost" && "border-highlight bg-highlight/20",
        feedback.verdict === "wrong" && "border-destructive bg-destructive-soft",
        feedback.verdict === "recorded" && "border-border bg-muted",
      )}
    >
      <p className="flex items-center gap-2 text-lg font-bold">
        <Icon
          aria-hidden
          className={cn(
            "size-5",
            (feedback.verdict === "correct" || feedback.verdict === "alternative") &&
              "text-success",
            feedback.verdict === "wrong" && "text-destructive",
          )}
          strokeWidth={3}
        />
        <Fr>{heading.fr}</Fr>
        {support !== "fr" && (
          <span className="text-muted-foreground text-base font-medium">{heading.pt}</span>
        )}
      </p>
      {!showExpected &&
        !feedback.correct &&
        (feedback.modelAnswers?.length || feedback.expected) && (
          <div className="sr-only">
            <p>Resposta certa:</p>
            <ul>
              {(feedback.modelAnswers ?? [{ text: feedback.expected!, lang: "fr" as const }]).map(
                (answer, index) => (
                  <li key={index} lang={answer.lang === "pt" ? "pt-BR" : "fr"}>
                    {answer.text}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      {showExpected && feedback.expected && feedback.verdict !== "correct" && (
        <div className="mt-3 flex items-center gap-3">
          <AudioButton
            size="sm"
            showSlow={false}
            lines={[{ text: feedback.expected }]}
            label="Ouvir a resposta"
          />
          <p>
            <span className="text-muted-foreground block text-sm">Resposta</span>
            <Fr className="text-xl">{feedback.expected}</Fr>
          </p>
        </div>
      )}
      {feedback.note && (
        <p className="mt-3 leading-relaxed">
          <LocalizedText value={feedback.note} support={support === "fr" ? "fr" : "pt"} />
        </p>
      )}
      {feedback.explanation && (
        <p className="mt-2 leading-relaxed">
          <LocalizedText value={feedback.explanation} support={support} />
        </p>
      )}
    </div>
  );
}
