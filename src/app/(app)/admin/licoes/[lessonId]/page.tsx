import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActivitySpec } from "@/components/admin/activity-spec";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getContent, lessonDependencies } from "@/lib/content";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Prévia da lição" };

async function Preview({ params }: { params: Promise<{ lessonId: string }> }) {
  await requireAdmin();
  const { lessonId } = await params;
  const ref = getContent().lessons.get(lessonId);
  if (!ref) notFound();
  const dependencies = lessonDependencies(ref);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-muted-foreground text-sm">
          <Link href="/admin" className="underline-offset-4 hover:underline">
            Administração
          </Link>{" "}
          · {ref.track} · {ref.unit.level} · {ref.unit.title.pt}
        </p>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">{ref.lesson.title.pt}</h1>
        <p className="text-muted-foreground mt-1">
          {ref.lesson.objective.pt} · ~{ref.lesson.minutes} min · {ref.lesson.steps.length} passos
        </p>
        <p className="mt-2 text-sm">
          Depende de conceitos de fora da lição:{" "}
          <span className="font-mono">
            {dependencies.length > 0 ? dependencies.join(", ") : "nenhum"}
          </span>
        </p>
        <Button asChild variant="outline" className="mt-4 h-10 rounded-xl">
          <Link href={`/licao/${ref.lesson.id}`}>Fazer como aluno</Link>
        </Button>
      </header>
      <ol className="space-y-4">
        {ref.lesson.steps.map((activity, index) => (
          <li key={activity.id}>
            <ActivitySpec activity={activity} position={index + 1} />
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function LessonPreviewPage(props: PageProps<"/admin/licoes/[lessonId]">) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <Preview params={props.params} />
      </Suspense>
    </div>
  );
}
