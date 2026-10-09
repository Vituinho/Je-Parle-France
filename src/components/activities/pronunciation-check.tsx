"use client";

import { Gauge } from "lucide-react";
import { useState } from "react";
import { Fr } from "@/components/fr";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toWav16k } from "./wav";
import { withStudyWait } from "@/components/lesson/use-active-study-time";

interface AssessmentResponse {
  status: "ok" | "no_speech" | "not_understood" | "error";
  transcript: string | null;
  scores: {
    accuracy: number;
    fluency: number;
    completeness: number;
    prosody: number | null;
    overall: number;
  } | null;
  words: {
    word: string;
    accuracy: number | null;
    error: "none" | "omission" | "insertion" | "mispronunciation";
  }[];
  /** What the provider can measure for this accent; the copy never claims more. */
  features?: { phonemeNames: boolean; prosody: boolean };
  attemptId?: string;
  error?: string;
}

const STATUS_MESSAGE: Record<Exclude<AssessmentResponse["status"], "ok">, string> = {
  no_speech: "Não ouvimos sua voz. Grave de novo, mais perto do microfone.",
  not_understood: "Não conseguimos reconhecer francês na gravação. Tente de novo, com calma.",
  error: "O serviço de fala não conseguiu avaliar agora. Tente de novo ou se autoavalie.",
};

function wordClass(word: AssessmentResponse["words"][number]) {
  if (word.error === "omission") return "text-muted-foreground line-through";
  if (word.error === "mispronunciation" || (word.accuracy ?? 100) < 60) return "correction";
  if ((word.accuracy ?? 100) < 80) return "highlight";
  return "";
}

/**
 * Sends a recording for pronunciation assessment. Results are shown at word
 * level: for French the provider scores phonemes without naming them, so it
 * cannot say which sound to fix, and we do not pretend it can.
 */
export function PronunciationCheck({
  recording,
  referenceText,
  locale,
  activityId,
  disabled,
  onAssessed,
}: {
  recording: Blob;
  referenceText: string;
  locale: "fr-FR" | "fr-CA";
  activityId: string;
  disabled: boolean;
  onAssessed: (attemptId: string) => void;
}) {
  const [state, setState] = useState<"idle" | "working" | "done">("idle");
  const [result, setResult] = useState<AssessmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function assess() {
    setState("working");
    setError(null);
    try {
      const wav = await toWav16k(recording);
      const form = new FormData();
      form.set("audio", wav, "recording.wav");
      form.set("referenceText", referenceText);
      form.set("locale", locale);
      form.set("activityId", activityId);
      const response = await withStudyWait(() =>
        fetch("/api/speech/assess", { method: "POST", body: form }),
      );
      const body = (await response.json()) as AssessmentResponse;
      if (!response.ok) throw new Error(body.error ?? "Falha na avaliação.");
      setResult(body);
      if (body.status === "ok" && body.attemptId) onAssessed(body.attemptId);
      setState("done");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha na avaliação.");
      setState("idle");
    }
  }

  return (
    <div className="space-y-3">
      {state !== "done" && (
        <Button
          type="button"
          variant="secondary"
          onClick={assess}
          disabled={disabled || state === "working"}
          className="h-11 rounded-xl"
        >
          <Gauge /> {state === "working" ? "Avaliando…" : "Avaliar minha pronúncia"}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      {result && result.status !== "ok" && <p role="status">{STATUS_MESSAGE[result.status]}</p>}
      {result?.status === "ok" && result.scores && (
        <div className="border-border bg-card space-y-3 rounded-2xl border p-4" role="status">
          <p className="text-sm font-semibold">
            Pronúncia:{" "}
            <span className="text-2xl tabular-nums">{Math.round(result.scores.overall)}</span>
            <span className="text-muted-foreground font-normal"> / 100</span>
          </p>
          {result.features?.prosody && result.scores.prosody !== null && (
            <p className="text-sm">
              Entonação e ritmo:{" "}
              <span className="font-semibold tabular-nums">
                {Math.round(result.scores.prosody)}
              </span>
              <span className="text-muted-foreground"> / 100</span>
            </p>
          )}
          <Fr as="p" className="text-xl leading-relaxed">
            {result.words.map((word, index) => (
              <span key={`${word.word}-${index}`}>
                {index > 0 && " "}
                <span
                  className={cn(wordClass(word))}
                  title={word.accuracy === null ? undefined : `${Math.round(word.accuracy)}/100`}
                >
                  {word.word}
                </span>
              </span>
            ))}
          </Fr>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Sublinhado em vermelho: palavra que precisa de atenção · marca-texto: quase lá ·
            riscado: palavra que não apareceu. A avaliação é por palavra
            {result.features?.phonemeNames
              ? "."
              : ": para o francês, o serviço não identifica qual som saiu diferente."}
            {!result.features?.prosody && " Entonação e ritmo não são avaliados."}
          </p>
        </div>
      )}
    </div>
  );
}
