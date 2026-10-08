import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { X } from "lucide-react";
import { Fr } from "@/components/fr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { latestPlacement } from "@/server/services/placement";
import { requireLearner } from "@/server/session";
import { skipPlacementAction, startPlacementAction } from "./actions";

export const metadata: Metadata = { title: "Diagnóstico" };

const MODES = [
  {
    value: "quick",
    title: "Diagnóstico rápido",
    duration: "8 a 12 minutos",
    cta: "Começar o rápido",
    text: "Vocabulário, gramática, leitura e escuta, com perguntas que se ajustam às suas respostas. Fala e escrita entram como autoavaliação.",
  },
  {
    value: "complete",
    title: "Diagnóstico completo",
    duration: "25 a 40 minutos",
    cta: "Começar o completo",
    text: "Tudo do rápido, mais escrita com respostas curtas. Quando o serviço de fala estiver ativo, também mede percepção dos sons e leitura em voz alta. Sem ele, a fala entra como autoavaliação e a pronúncia fica não avaliada.",
  },
] as const;

async function Intro({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireLearner();
  const { modo } = await searchParams;
  const active = await latestPlacement(user.id);
  const preferred = modo === "complete" ? "complete" : "quick";

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex justify-end">
        <Button asChild variant="ghost" size="icon-lg" aria-label="Fechar">
          <Link href="/hoje">
            <X />
          </Link>
        </Button>
      </div>
      <Fr as="p" className="text-primary text-xl">
        Faisons le point.
      </Fr>
      <h1 className="mt-1 text-[2rem] leading-tight font-bold">Vamos descobrir o seu nível</h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
        As perguntas ficam mais fáceis ou mais difíceis conforme você responde, e cada habilidade é
        medida separadamente. Se não souber, toque em <strong>Não sei</strong> — chutar atrapalha
        mais do que ajuda.
      </p>

      {active?.status === "in_progress" && (
        <div className="border-primary bg-accent mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5">
          <p className="font-semibold">Você tem um diagnóstico em andamento.</p>
          <Button asChild className="h-11 rounded-xl px-5">
            <Link href={`/diagnostico/${active.id}`}>Continuar de onde parei</Link>
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-4">
        {MODES.map((mode) => (
          <form
            key={mode.value}
            action={startPlacementAction}
            className={cn(
              "bg-card rounded-2xl border-[1.5px] p-5",
              mode.value === preferred ? "border-primary" : "border-border",
            )}
          >
            <input type="hidden" name="mode" value={mode.value} />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold">{mode.title}</h2>
              <span className="text-muted-foreground text-sm">{mode.duration}</span>
            </div>
            <p className="text-muted-foreground mt-2 leading-relaxed">{mode.text}</p>
            <Button
              type="submit"
              variant={mode.value === preferred ? "default" : "outline"}
              className="mt-4 h-11 rounded-xl px-5"
            >
              {mode.cta}
            </Button>
          </form>
        ))}
      </div>

      <form action={skipPlacementAction} className="mt-8">
        <Button type="submit" variant="link" className="px-0">
          Prefiro começar do zero (A0)
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
        Este diagnóstico é uma avaliação interna de aprendizagem. Não é uma certificação oficial e
        não substitui o TEF, o TCF, o DELF ou o DALF.
      </p>
    </div>
  );
}

export default function PlacementIntroPage(props: PageProps<"/diagnostico">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-24 h-64 w-full max-w-2xl rounded-2xl" />}>
      <Intro searchParams={props.searchParams} />
    </Suspense>
  );
}
