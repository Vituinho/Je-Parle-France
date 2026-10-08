import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseMap } from "@/components/course/course-map";
import { Fr } from "@/components/fr";
import { Skeleton } from "@/components/ui/skeleton";
import type { Track } from "@/lib/content/schema";
import { getCourseMap } from "@/server/services/course";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Curso" };

const DESTINATION_TRACKS: Record<string, Track[]> = {
  canada_quebec: ["canada"],
  france: ["france"],
  both: ["canada", "france"],
  undecided: [],
};

async function Course() {
  const { user, profile } = await requireLearner();
  const tracks = await getCourseMap(user.id, profile);
  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <Fr as="p" className="text-primary text-xl">
          Le parcours
        </Fr>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">O curso</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          A sessão de hoje já escolhe as próximas lições por você. Aqui você vê o caminho inteiro e
          pode abrir qualquer lição — inclusive para rever.
        </p>
      </header>
      <CourseMap
        tracks={tracks}
        destinationTracks={DESTINATION_TRACKS[profile.destination] ?? []}
      />
    </div>
  );
}

export default function CoursePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <Course />
      </Suspense>
    </div>
  );
}
