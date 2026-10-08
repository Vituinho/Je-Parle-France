import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PronunciationLab } from "@/components/pronunciation/pronunciation-lab";
import { Skeleton } from "@/components/ui/skeleton";
import { getContent } from "@/lib/content";
import { getLearnerLevel, supportFor, today } from "@/server/services/learner";
import { prepareReviewItems } from "@/server/services/review";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Pronúncia" };

const PERCEPTION_ROUNDS = 8;
const PRODUCTION_ROUNDS = 3;

async function Target({ params }: { params: Promise<{ target: string }> }) {
  const { user, profile } = await requireLearner();
  const { target: slug } = await params;
  const concept = getContent().concepts.get(`pron:${slug}`);
  if (!concept || concept.kind !== "pronunciation") notFound();
  const date = today(profile);
  const level = await getLearnerLevel(user.id);
  const rounds = (dimension: "listening" | "pronunciation", count: number) =>
    Array.from({ length: count }, (_, i) => ({ conceptId: concept.id, dimension, variant: i + 1 }));
  const [perception, production] = await Promise.all([
    prepareReviewItems(user.id, rounds("listening", PERCEPTION_ROUNDS), date),
    prepareReviewItems(user.id, rounds("pronunciation", PRODUCTION_ROUNDS), date),
  ]);
  return (
    <PronunciationLab
      target={concept}
      perception={perception}
      production={production}
      date={date}
      support={supportFor(level.level, profile)}
    />
  );
}

export default function PronunciationTargetPage(props: PageProps<"/pronuncia/[target]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-24 h-96 w-full max-w-2xl rounded-2xl" />}>
      <Target params={props.params} />
    </Suspense>
  );
}
