import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TutorChat, type ChatTurn } from "@/components/tutor/tutor-chat";
import { Skeleton } from "@/components/ui/skeleton";
import { getLLM } from "@/lib/ai/llm";
import { getContent } from "@/lib/content";
import type { CorrectionMode, StoredReport } from "@/lib/learning/tutor/tutor";
import { getConversation, TutorError, type StoredCorrections } from "@/server/services/tutor";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Conversa" };

async function Conversation({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, profile } = await requireLearner();
  const { conversationId } = await params;
  const { sessao } = await searchParams;
  let conversation;
  try {
    conversation = await getConversation(user.id, conversationId);
  } catch (error) {
    if (error instanceof TutorError) notFound();
    throw error;
  }
  const scenario = conversation.scenarioId
    ? getContent().scenarios.get(conversation.scenarioId)
    : undefined;
  const turns: ChatTurn[] = conversation.turns.map((turn) => ({
    id: turn.id,
    role: turn.role,
    content: turn.content,
    corrections: (turn.corrections as unknown as StoredCorrections | null)?.visible ?? [],
  }));
  const region =
    scenario?.region === "fr-CA" || (!scenario && profile.destination === "canada_quebec")
      ? "fr-CA"
      : "fr-FR";

  return (
    <TutorChat
      conversationId={conversation.id}
      title={scenario?.title.pt ?? "Conversa livre"}
      goal={scenario?.learnerGoal.pt}
      correctionMode={conversation.correctionMode as CorrectionMode}
      initialTurns={turns}
      initialReport={(conversation.report as unknown as StoredReport | null) ?? null}
      simulated={getLLM().simulated}
      sessionId={typeof sessao === "string" ? sessao : undefined}
      region={region}
    />
  );
}

export default function ConversationPage(props: PageProps<"/conversa/[conversationId]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-24 h-96 w-full max-w-2xl rounded-2xl" />}>
      <Conversation params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
