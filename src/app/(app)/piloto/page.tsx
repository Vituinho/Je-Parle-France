import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PilotMutationForm, PilotFeedbackForm } from "@/components/pilot/forms";
import { PILOT_NOTICE, PILOT_CONSENT_VERSION, PILOT_STATUS_LABELS } from "@/lib/pilot/schema";
import { serverEnv } from "@/lib/env";
import { localDate, weekStart } from "@/lib/learning/time";
import {
  getPilotParticipation,
  canOfferPilotFeedback,
} from "@/server/services/pilot-participation";
import { requireLearner } from "@/server/session";
import { pilotLearnerAction } from "./actions";
export const metadata: Metadata = { title: "Participação no piloto" };
async function Participation() {
  const { user, profile } = await requireLearner();
  const member = await getPilotParticipation(user.id),
    enabled = serverEnv().PILOT_ENABLED;
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8">
      <Link href="/hoje" className="text-primary underline">
        Voltar para hoje
      </Link>
      <h1 className="text-3xl font-bold">Participação no piloto</h1>
      <p className="text-muted-foreground">
        Teste opcional de cerca de 14 dias. Não altera seu acesso às lições.
      </p>
      <p className="text-sm break-all">
        Seu ID para o convite: <code>{user.id}</code>
      </p>
      <p>
        Estado: <strong>{member ? PILOT_STATUS_LABELS[member.status] : "Sem convite"}</strong>
      </p>
      {member?.status === "active" && (
        <p role="status">Aceite registrado. Obrigado por participar!</p>
      )}
      {member?.status === "withdrawn" && (
        <p role="status">
          Aceite retirado. Feedback e revisões do piloto foram apagados; seu progresso continua
          salvo.
        </p>
      )}
      {!enabled && (
        <p role="status">O piloto está pausado neste ambiente. Você ainda pode retirar o aceite.</p>
      )}
      <section
        aria-label="Aviso do piloto"
        className="border-border space-y-3 rounded-xl border p-5"
      >
        {PILOT_NOTICE.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="text-muted-foreground text-sm">Versão do aviso: {PILOT_CONSENT_VERSION}</p>
      </section>
      {member?.consentedAt && (
        <p className="text-sm">
          Aceite {member.consentVersion}: {member.consentedAt.toISOString()}
        </p>
      )}
      {enabled && member?.status === "invited" && (
        <PilotMutationForm action={pilotLearnerAction} label="Aceitar participação no piloto">
          <input type="hidden" name="operation" value="consent" />
          <input type="hidden" name="version" value={PILOT_CONSENT_VERSION} />
          <label className="flex items-start gap-2">
            <input type="checkbox" name="accepted" required className="mt-1" />
            Li o aviso e aceito voluntariamente a participação e a revisão humana descrita.
          </label>
        </PilotMutationForm>
      )}
      {member && member.status !== "withdrawn" && (
        <PilotMutationForm action={pilotLearnerAction} label="Retirar aceite do piloto">
          <input type="hidden" name="operation" value="withdraw" />
        </PilotMutationForm>
      )}
      {(await canOfferPilotFeedback(user.id, new Date(), true)) && (
        <PilotFeedbackForm
          context="weekly"
          sourceId={weekStart(localDate(new Date(), profile.timezone))}
        />
      )}
      {member?.status === "finished" && (
        <p>
          O período de coleta terminou. A revisão das amostras existentes pode continuar dentro da
          retenção; você pode retirar o aceite.
        </p>
      )}
      <Link href="/conta" className="text-primary underline">
        Exportar meus dados na Conta
      </Link>
    </div>
  );
}
export default function PilotParticipationPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-8 h-96 max-w-3xl" />}>
      <Participation />
    </Suspense>
  );
}
