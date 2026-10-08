"use client";

import { Mic, Square } from "lucide-react";
import { useState } from "react";
import { useRecorder } from "@/components/activities/recorder";
import { toWav16k } from "@/components/activities/wav";
import { useCapabilities } from "@/components/capabilities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TranscriptionResponse {
  status?: "ok" | "no_speech" | "not_understood" | "error";
  transcript?: string | null;
  error?: string;
}

const STATUS_MESSAGE = {
  no_speech: "Não ouvimos sua voz. Tente de novo, mais perto do microfone.",
  not_understood: "Não reconhecemos francês na gravação. Tente de novo, com calma.",
  error: "O serviço de fala não conseguiu transcrever agora. Tente de novo ou escreva.",
} as const;

/**
 * Speak instead of typing: the recording is transcribed on the server and the
 * transcript goes into the message box, where the learner can check and fix
 * it before sending. Rendered only when speech recognition is configured.
 */
export function VoiceInput({
  locale,
  disabled,
  onTranscript,
}: {
  locale: "fr-FR" | "fr-CA";
  disabled: boolean;
  onTranscript: (text: string) => void;
}) {
  const { speechRecognition } = useCapabilities();
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function transcribe(recording: Blob) {
    setWorking(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("audio", await toWav16k(recording), "turn.wav");
      form.set("locale", locale);
      const response = await fetch("/api/speech/transcribe", { method: "POST", body: form });
      const body = (await response.json()) as TranscriptionResponse;
      if (!response.ok) throw new Error(body.error ?? STATUS_MESSAGE.error);
      if (body.status === "ok" && body.transcript) {
        onTranscript(body.transcript);
        setMessage("Confira o que entendemos e corrija se precisar antes de enviar.");
      } else {
        setMessage(
          STATUS_MESSAGE[body.status === "ok" ? "not_understood" : (body.status ?? "error")],
        );
      }
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : STATUS_MESSAGE.error);
    } finally {
      setWorking(false);
      recorder.reset();
    }
  }

  const recorder = useRecorder(15_000, (blob) => void transcribe(blob));

  if (!speechRecognition) return null;
  if (recorder.state === "unsupported") return null;

  const recording = recorder.state === "recording";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Button
        type="button"
        variant={recording ? "destructive" : "outline"}
        size="icon-lg"
        disabled={disabled || working}
        onClick={() => (recording ? recorder.stop() : void recorder.start())}
        aria-label={recording ? "Parar e transcrever" : "Responder falando"}
        className={cn("size-12 shrink-0 rounded-2xl", recording && "animate-pulse")}
      >
        {recording ? <Square /> : <Mic />}
      </Button>
      <p className="text-muted-foreground text-xs leading-snug" role="status">
        {recorder.state === "denied"
          ? "Sem acesso ao microfone. Libere nas configurações do navegador."
          : recording
            ? "Ouvindo… toque de novo para terminar (até 15 s)."
            : working
              ? "Transcrevendo…"
              : message}
      </p>
    </div>
  );
}
