"use client";

import { Pause, Snail, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useFrenchSpeech, useVoiceStatus, type SpeakOptions, type VoiceRegion } from "./speech";

export interface AudioLine {
  text: string;
  region?: VoiceRegion;
  /** Distinguish speakers in dialogues. */
  alternate?: boolean;
}

/**
 * Plays French audio. Normal and slow speeds; a notice explains when the
 * browser has no French voice so the learner is never left with a silent button.
 */
export function AudioButton({
  lines,
  label = "Ouvir",
  size = "md",
  className,
  showSlow = true,
}: {
  lines: AudioLine[];
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showSlow?: boolean;
}) {
  const { status, speaking, speak, stop } = useFrenchSpeech();
  const [plays, setPlays] = useState(0);

  const play = (rate: SpeakOptions["rate"]) => {
    if (speaking) {
      stop();
      return;
    }
    setPlays((count) => count + 1);
    void speak(
      lines.map((line) => ({
        text: line.text,
        options: { region: line.region, alternate: line.alternate, rate },
      })),
    );
  };

  const dimensions = { sm: "size-9", md: "size-12", lg: "size-16" }[size];
  const icon = { sm: "size-4", md: "size-5", lg: "size-7" }[size];

  if (status === "unsupported" || status === "no-french-voice") {
    return (
      <span
        title="Áudio indisponível: este navegador não tem voz em francês"
        aria-label="Áudio indisponível neste navegador"
        role="img"
        className={cn(
          "bg-muted text-muted-foreground grid shrink-0 place-items-center rounded-full",
          dimensions,
          className,
        )}
      >
        <VolumeX className={icon} />
      </span>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => play("normal")}
        aria-label={speaking ? "Parar áudio" : label}
        data-plays={plays}
        className={cn(
          "bg-primary text-primary-foreground grid shrink-0 place-items-center rounded-full transition-transform active:scale-95 disabled:opacity-50",
          dimensions,
        )}
        disabled={status === "loading"}
      >
        {speaking ? <Pause className={icon} /> : <Volume2 className={icon} />}
      </button>
      {showSlow && (
        <button
          type="button"
          onClick={() => play("slow")}
          aria-label="Ouvir devagar"
          className="border-border text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-full border"
          disabled={status === "loading"}
        >
          <Snail className="size-4" />
        </button>
      )}
    </div>
  );
}

/**
 * One explanation per screen when the browser cannot speak French, instead of
 * repeating it next to every audio button.
 */
export function VoiceNotice({ className }: { className?: string }) {
  const status = useVoiceStatus();
  if (status !== "unsupported" && status !== "no-french-voice") return null;
  return (
    <p
      role="status"
      className={cn("bg-muted text-muted-foreground rounded-xl px-4 py-3 text-sm", className)}
    >
      Este navegador não tem uma voz em francês, então o áudio não toca aqui. No Chrome ou no Edge
      funciona; também dá para instalar uma voz francesa nas configurações do sistema. Os textos
      continuam disponíveis.
    </p>
  );
}
