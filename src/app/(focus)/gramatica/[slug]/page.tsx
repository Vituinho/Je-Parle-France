import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GrammarTopic } from "@/components/library/grammar-topic";
import { Skeleton } from "@/components/ui/skeleton";
import { getLearnerLevel, supportFor, today } from "@/server/services/learner";
import { getGrammarTopic } from "@/server/services/library";
import { prepareReviewItems, type PreparedReviewItem } from "@/server/services/review";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Gramática" };

const DRILL_ROUNDS = 6;
const CANDIDATES = 12;

async function Topic({ params }: { params: Promise<{ slug: string }> }) {
  const { user, profile } = await requireLearner();
  const { slug } = await params;
  const topic = await getGrammarTopic(user.id, slug);
  if (!topic) notFound();
  const date = today(profile);
  const level = await getLearnerLevel(user.id);

  // Written dimensions only: the drill must work without a microphone.
  const dimensions = topic.dimensions
    .map((d) => d.dimension)
    .filter((dimension) => dimension === "recognition" || dimension === "writing");
  const candidates = Array.from({ length: CANDIDATES }, (_, i) => ({
    conceptId: topic.concept.id,
    dimension: dimensions[i % dimensions.length] ?? "recognition",
    variant: i + 1,
  }));
  const prepared = await prepareReviewItems(user.id, candidates, date);
  // Variants can land on the same authored exercise; keep each exercise once.
  const seen = new Set<string>();
  const drill: PreparedReviewItem[] = [];
  for (const item of prepared) {
    if (seen.has(item.activity.id) || drill.length >= DRILL_ROUNDS) continue;
    seen.add(item.activity.id);
    drill.push(item);
  }

  return (
    <GrammarTopic
      concept={topic.concept}
      dimensions={topic.dimensions}
      lessons={topic.lessons}
      related={topic.related}
      drill={drill}
      date={date}
      support={supportFor(level.level, profile)}
    />
  );
}

export default function GrammarTopicPage(props: PageProps<"/gramatica/[slug]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-24 h-96 w-full max-w-2xl rounded-2xl" />}>
      <Topic params={props.params} />
    </Suspense>
  );
}
