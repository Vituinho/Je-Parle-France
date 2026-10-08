import type { Metadata } from "next";
import { Suspense } from "react";
import { ShadowingPlayer } from "@/components/pronunciation/shadowing-player";
import { Skeleton } from "@/components/ui/skeleton";
import { getLearnerLevel } from "@/server/services/learner";
import { getShadowingLines } from "@/server/services/shadowing";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Shadowing" };

async function Shadowing() {
  const { user, profile } = await requireLearner();
  const level = await getLearnerLevel(user.id);
  const lines = await getShadowingLines(user.id, profile, level.level);
  return <ShadowingPlayer lines={lines} />;
}

export default function ShadowingPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-24 h-96 w-full max-w-2xl rounded-2xl" />}>
      <Shadowing />
    </Suspense>
  );
}
