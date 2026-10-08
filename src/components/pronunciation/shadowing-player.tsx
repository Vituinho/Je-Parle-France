"use client";

import { ArrowLeft, Ear, Eye, EyeOff, Headphones, Mic, Repeat, Snail, Square } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { recordShadowingAction } from "@/app/(focus)/pronuncia/sombra/actions";
import { VoiceNotice } from "@/components/activities/audio-button";
import { PronunciationCheck } from "@/components/activities/pronunciation-check";
import { useRecorder } from "@/components/activities/recorder";
import { useFrenchSpeech } from "@/components/activities/speech";
import { useCapabilities } from "@/components/capabilities";
import { Fr } from "@/components/fr";
import { LineProgress } from "@/components/line-progress";
import { Button } from "@/components/ui/button";
import type { ShadowingLine } from "@/server/services/shadowing";

/**
 * Shadowing practice: hear a real line, say it along with the voice or right
 * after it, then compare your recording with the model. It is practice, not
 * assessment: nothing is scored unless a pronunciation provider is configured.
 */
export function ShadowingPlayer({ lines }: { lines: ShadowingLine[] }) {
  const [index, setIndex] = useState(0);
  const [showText, setShowText] = useState(true);
  const [recordings, setRecordings] = useState(0);
  const [finished, setFinished] = useState<{ lines: number; recordings: number } | null>(null);
  const startedAt = useRef<number | null>(null);
  const { speak, speaking } = useFrenchSpeech();
  const { pronunciation } = useCapabilities();
  const recorder = useRecorder(15_000, () => setRecordings((count) => count + 1));
  const line = lines[index];

  const mark = () => {
    startedAt.current ??= performance.now();
  };
  const play = (rate: "normal" | "slow" = "normal") => {
    if (!line) return Promise.resolve();
    mark();
    return speak([
      { text: line.text, options: { region: line.region, gender: line.gender, rate } },
    ]);
  };
  const playMine = () =>
    new Promise<void>((resolve) => {
      if (!recorder.audioUrl) return resolve();
      const audio = new Audio(recorder.audioUrl);
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      void audio.play();
    });

  async function speakAlong() {
    mark();
    await recorder.start();
    await play();
  }

  async function compare() {
    await play();
    await playMine();
  }

  function next() {
    recorder.reset();
    if (index + 1 < lines.length) {
      setIndex(index + 1);
      return;
    }
    void finish(lines.length);
  }

  async function finish(done: number) {
    const seconds = startedAt.current ? (performance.now() - startedAt.current) / 1000 : 0;
    setFinished({ lines: done, recordings });
    if (seconds > 0) await recordShadowingAction({ seconds });
  }

  if (finished) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-8">
        <Fr as="p" className="text-primary text-2xl">
          Bien joué !
        </Fr>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">Treino de shadowing concluído</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          {finished.lines} {finished.lines === 1 ? "frase" : "frases"} · {finished.recordings}{" "}
          {finished.recordings === 1 ? "gravação" : "gravações"}. O tempo entrou na sua prática de
          fala de hoje.
        </p>
        <Button asChild className="mt-8 h-12 rounded-xl px-8 text-base">
          <Link href="/pronuncia">Voltar ao laboratório</Link>
        </Button>
      </div>
    );
  }

  if (!line) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-8">
        <h1 className="text-[2rem] leading-tight font-bold">Ainda não há frases para treinar</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          As frases vêm dos diálogos das lições. Faça uma lição e volte aqui.
        </p>
        <Button asChild className="mt-8 h-12 rounded-xl px-8 text-base">
          <Link href="/hoje">Ir para hoje</Link>
        </Button>
      </div>
    );
  }

  const recording = recorder.state === "recording";
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-5 pb-12 sm:px-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-lg" aria-label="Sair do treino">
          <Link href="/pronuncia">
            <ArrowLeft />
          </Link>
        </Button>
        <LineProgress
          className="flex-1"
          showLabels={false}
          ariaLabel="Frases do treino"
          stations={lines.map((item, i) => ({
            id: item.id,
            label: `Frase ${i + 1}`,
            state: i < index ? "done" : i === index ? "current" : "upcoming",
          }))}
        />
      </div>

      <header className="mt-6">
        <h1 className="text-xl font-bold">Shadowing</h1>
        <ol className="text-muted-foreground mt-2 list-decimal space-y-0.5 pl-5 text-sm">
          <li>Ouça a frase (devagar, se precisar).</li>
          <li>Fale junto com a voz, colado nela — com fones de ouvido — ou logo depois.</li>
          <li>Compare a sua gravação com o modelo e repita até soar natural.</li>
        </ol>
      </header>

      <VoiceNotice className="mt-4" />

      <section
        aria-label="Frase atual"
        className="border-border bg-card mt-6 rounded-2xl border px-5 py-6"
      >
        <p className="text-muted-foreground text-xs">
          {line.lessonTitle} · {line.region === "fr-CA" ? "voz do Québec" : "voz da França"}
        </p>
        {showText ? (
          <Fr as="p" className="mt-2 text-[1.6rem] leading-snug">
            {line.text}
          </Fr>
        ) : (
          <p className="text-muted-foreground mt-2 text-lg italic">Texto escondido — só ouvido.</p>
        )}
        <button
          type="button"
          onClick={() => setShowText((value) => !value)}
          className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
        >
          {showText ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
          {showText ? "Esconder o texto" : "Mostrar o texto"}
        </button>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => void play()}
          disabled={speaking || recording}
        >
          <Ear /> Ouvir
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => void play("slow")}
          disabled={speaking || recording}
        >
          <Snail /> Devagar
        </Button>
        <Button
          type="button"
          variant={recording ? "destructive" : "default"}
          className="h-12 rounded-xl"
          onClick={() => {
            if (recording) {
              recorder.stop();
              return;
            }
            mark();
            void recorder.start();
          }}
          disabled={speaking || recorder.state === "unsupported" || recorder.state === "denied"}
        >
          {recording ? <Square /> : <Mic />} {recording ? "Parar" : "Gravar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => void speakAlong()}
          disabled={
            speaking || recording || recorder.state === "unsupported" || recorder.state === "denied"
          }
        >
          <Headphones /> Falar junto
        </Button>
      </div>

      {recorder.state === "denied" && (
        <p role="alert" className="text-destructive mt-3 text-sm">
          Sem acesso ao microfone. Libere nas configurações do navegador para gravar; você ainda
          pode ouvir e repetir em voz alta.
        </p>
      )}
      {recorder.state === "unsupported" && (
        <p className="text-muted-foreground mt-3 text-sm">
          Este navegador não grava áudio. Ouça e repita em voz alta — já é um ótimo treino.
        </p>
      )}

      {recorder.state === "recorded" && recorder.audioUrl && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void compare()}
              disabled={speaking}
            >
              <Repeat /> Comparar com o modelo
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => void playMine()}
            >
              Ouvir só a minha voz
            </Button>
          </div>
          {pronunciation && recorder.blob && (
            <PronunciationCheck
              recording={recorder.blob}
              referenceText={line.text}
              locale={line.region}
              activityId={`shadow-${line.id}`}
              disabled={speaking}
              onAssessed={() => undefined}
            />
          )}
        </div>
      )}

      <div className="border-border mt-10 flex items-center justify-between gap-3 border-t pt-6">
        <Button
          type="button"
          variant="ghost"
          className="rounded-xl"
          onClick={() => void finish(index)}
        >
          Encerrar
        </Button>
        <Button
          type="button"
          className="h-12 rounded-xl px-8 text-base"
          onClick={next}
          disabled={recording}
        >
          {index + 1 < lines.length ? "Próxima frase" : "Terminar"}
        </Button>
      </div>
    </div>
  );
}
