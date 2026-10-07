import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Fr } from "@/components/fr";
import { ReviewPlayer } from "@/components/lesson/review-player";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getLearnerLevel, supportFor, today } from "@/server/services/learner";
import { dueReviewItems, prepareReviewItems } from "@/server/services/review";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Revisão" };

async function Review() {
  const { user, profile } = await requireLearner();
  const date = today(profile);
  const [due, level] = await Promise.all([dueReviewItems(user.id, 20), getLearnerLevel(user.id)]);
  const items = await prepareReviewItems(user.id, due, date);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-16 sm:px-8">
        <Fr as="p" className="text-primary text-2xl">
          Tout est à jour.
        </Fr>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">Nada para revisar agora</h1>
        <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
          Cada item volta quando estiver perto de ser esquecido. Enquanto isso, a sessão de hoje tem
          conteúdo novo para você.
        </p>
        <Button asChild className="mt-8 h-12 w-full rounded-xl text-base sm:w-auto sm:px-8">
          <Link href="/hoje">Voltar para hoje</Link>
        </Button>
      </div>
    );
  }

  return (
    <ReviewPlayer
      items={items}
      date={date}
      support={supportFor(level.level, profile)}
      title="Revisão"
      exitHref="/hoje"
    />
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-24 h-96 w-full max-w-2xl rounded-2xl" />}>
      <Review />
    </Suspense>
  );
}
