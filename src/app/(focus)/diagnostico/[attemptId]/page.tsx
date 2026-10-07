import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PlacementRunner } from "@/components/placement/placement-runner";
import { Skeleton } from "@/components/ui/skeleton";
import { loadPlacement, PlacementError, type PlacementView } from "@/server/services/placement";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Diagnóstico" };

async function Runner({ params }: { params: Promise<{ attemptId: string }> }) {
  const { user } = await requireLearner();
  const { attemptId } = await params;
  let view: PlacementView;
  try {
    view = await loadPlacement(user.id, attemptId);
  } catch (error) {
    if (error instanceof PlacementError) notFound();
    throw error;
  }
  if (view.status === "completed") redirect(`/diagnostico/${attemptId}/resultado`);
  return <PlacementRunner initialView={view} />;
}

export default function PlacementRunnerPage(props: PageProps<"/diagnostico/[attemptId]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-24 h-96 w-full max-w-2xl rounded-2xl" />}>
      <Runner params={props.params} />
    </Suspense>
  );
}
