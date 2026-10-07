import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Hoje" };

async function Today() {
  const { user } = await requireLearner();
  return (
    <h1 className="text-3xl font-bold">
      <span lang="fr" className="font-fr font-medium">
        Bonjour
      </span>
      , {user.name}.
    </h1>
  );
}

export default function TodayPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<Skeleton className="h-10 w-72" />}>
        <Today />
      </Suspense>
    </div>
  );
}
