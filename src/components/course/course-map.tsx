import { Check, Lock, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { Fr } from "@/components/fr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Track } from "@/lib/content/schema";
import { cn } from "@/lib/utils";
import type { LessonState, MapTrack } from "@/server/services/course";

const TRACKS: Record<Track, { pt: string; fr: string; description: string }> = {
  core: {
    pt: "Percurso principal",
    fr: "Le parcours",
    description:
      "A base da língua, em ordem: sons, estruturas e vocabulário que servem em qualquer lugar.",
  },
  canada: {
    pt: "Vivre au Canada",
    fr: "Vivre au Canada",
    description:
      "O francês do Québec e as situações de quem chega: imigração, banco, moradia — com vozes canadenses.",
  },
  france: {
    pt: "Vivre en France",
    fr: "Vivre en France",
    description:
      "O dia a dia francês e as situações de quem se instala: boulangerie, metrô, préfecture, aluguel.",
  },
};

const STATE_LABEL: Record<LessonState, string> = {
  completed: "Concluída",
  in_progress: "Em andamento",
  skipped: "Coberta pelo diagnóstico",
  new: "Nova",
  locked: "Depois de outras lições",
};

function Station({ state }: { state: LessonState }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative z-10 grid size-[21px] shrink-0 place-items-center rounded-full border-[3px]",
        state === "completed" && "border-primary bg-primary text-primary-foreground",
        state === "skipped" && "border-primary/50 bg-primary/40 text-primary-foreground",
        state === "in_progress" && "border-primary bg-background ring-primary/20 ring-4",
        (state === "new" || state === "locked") && "border-border bg-background",
      )}
    >
      {state === "completed" && <Check className="size-3" strokeWidth={3.5} />}
      {state === "in_progress" && <span className="bg-primary size-[7px] rounded-full" />}
    </span>
  );
}

function TrackPath({ data }: { data: MapTrack }) {
  return (
    <div className="space-y-10">
      {data.units.map((unit) => (
        <section key={unit.id} aria-labelledby={`unit-${unit.id}`}>
          <p className="text-muted-foreground text-sm font-semibold">Nível {unit.level}</p>
          <h3 id={`unit-${unit.id}`} className="mt-0.5 text-xl font-bold">
            {unit.title.pt}
          </h3>
          {unit.title.fr && unit.title.fr !== unit.title.pt && (
            <Fr as="p" className="text-primary">
              {unit.title.fr}
            </Fr>
          )}
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
            {unit.canDo}
          </p>
          <ol className="mt-5">
            {unit.lessons.map((lesson, position) => {
              const last = position === unit.lessons.length - 1;
              return (
                <li key={lesson.id} className="relative flex gap-4 pb-1">
                  {!last && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-5 bottom-0 left-[9px] w-[3px] rounded-full",
                        lesson.state === "completed" ? "bg-primary" : "bg-border",
                      )}
                    />
                  )}
                  <span className="pt-3">
                    <Station state={lesson.state} />
                  </span>
                  <Link
                    href={`/licao/${lesson.id}`}
                    className="hover:bg-muted/60 -mx-2 min-w-0 flex-1 rounded-xl px-2 py-2.5 transition-colors"
                  >
                    <span className="flex flex-wrap items-baseline gap-x-3">
                      <span
                        className={cn(
                          "font-semibold",
                          (lesson.state === "new" || lesson.state === "locked") &&
                            "text-foreground/80",
                        )}
                      >
                        {lesson.title}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {lesson.minutes} min · {STATE_LABEL[lesson.state]}
                        {lesson.state === "locked" && (
                          <Lock className="ml-1 inline size-3 align-[-1px]" aria-hidden />
                        )}
                      </span>
                    </span>
                    <span className="text-muted-foreground block text-sm">{lesson.objective}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
          {unit.mission && (
            <Link
              href={`/tutor?cenario=${unit.mission.id}`}
              className="text-primary mt-2 ml-9 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
            >
              <MessagesSquare className="size-4" aria-hidden />
              Missão com o tutor: {unit.mission.title}
            </Link>
          )}
        </section>
      ))}
    </div>
  );
}

export function CourseMap({
  tracks,
  destinationTracks,
}: {
  tracks: MapTrack[];
  destinationTracks: Track[];
}) {
  return (
    <Tabs defaultValue="core" className="gap-8">
      <TabsList className="h-auto flex-wrap justify-start">
        {tracks.map((data) => (
          <TabsTrigger key={data.track} value={data.track} className="px-3 py-1.5">
            {TRACKS[data.track].pt}
            {destinationTracks.includes(data.track) && (
              <span className="text-primary ml-1 text-xs font-normal">· seu destino</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {tracks.map((data) => (
        <TabsContent key={data.track} value={data.track} className="space-y-8">
          <div className="max-w-2xl">
            <Fr as="p" className="text-primary text-lg">
              {TRACKS[data.track].fr}
            </Fr>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              {TRACKS[data.track].description}
            </p>
            <p className="mt-2 text-sm">
              {data.completed} de {data.total} lições concluídas
            </p>
          </div>
          <TrackPath data={data} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
