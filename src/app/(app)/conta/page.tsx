import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PreferencesForm, type PreferencesValues } from "@/components/account/preferences-form";
import { DeleteAccount, DeletePrivateData, ExportData } from "@/components/account/privacy-section";
import { PasswordForm } from "@/components/account/security-section";
import { Fr } from "@/components/fr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyMinutes } from "@/lib/learning/onboarding";
import { studyPace } from "@/lib/learning/study-pace";
import { getCapabilities } from "@/lib/ai/capabilities";
import { getAccount } from "@/server/services/account";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Conta e privacidade" };

const PLACEMENT_STATUS: Record<string, string> = {
  not_started: "Você ainda não fez o diagnóstico.",
  in_progress: "Você tem um diagnóstico em andamento.",
  completed: "Seu nível foi estimado por um diagnóstico.",
  skipped: "Você começou do zero, sem diagnóstico.",
};

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-border border-t pt-8">
      <h2 id={id} className="text-2xl font-bold">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-2xl leading-relaxed">{description}</p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

async function Account() {
  const { user } = await requireLearner();
  const { user: account, profile, counts } = await getAccount(user.id);
  if (!profile) return null;
  const { llm, pronunciationAssessment } = getCapabilities();
  const initial: PreferencesValues = {
    name: account.name,
    dailyMinutes: profile.dailyMinutes as DailyMinutes,
    studyPace: studyPace(profile.studyPace, profile.dailyMinutes),
    weeklyGoalDays: profile.weeklyGoalDays,
    destination: profile.destination,
    targetLevel: profile.targetLevel ?? "",
    targetMonth: profile.targetDate ? profile.targetDate.toISOString().slice(0, 7) : "",
    correctionMode: profile.correctionMode,
    supportPreference: profile.supportPreference,
    timezone: profile.timezone,
  };

  return (
    <div className="space-y-12">
      <header>
        <Fr as="p" className="text-primary text-xl">
          Mon compte
        </Fr>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">Conta e privacidade</h1>
        <p className="text-muted-foreground mt-2">{account.email}</p>
      </header>

      <Section
        id="study"
        title="Seu estudo"
        description="Ajuste o plano quando a sua rotina mudar. Nada aqui apaga o seu progresso."
      >
        <PreferencesForm initial={initial} />
      </Section>

      <Section id="placement" title="Diagnóstico">
        <p className="leading-relaxed">{PLACEMENT_STATUS[profile.placementStatus]}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Refazer o diagnóstico atualiza a estimativa do seu nível. É uma estimativa interna, não
          uma certificação oficial.
        </p>
        <Button asChild variant="outline" className="mt-4 h-11 rounded-xl px-5">
          <Link href="/diagnostico">Fazer o diagnóstico</Link>
        </Button>
      </Section>

      <Section id="security" title="Senha">
        <PasswordForm />
      </Section>

      <Section
        id="privacy"
        title="Privacidade e dados"
        description="Seus dados servem para adaptar o estudo a você. Não vendemos nem compartilhamos dados para publicidade. Pela LGPD, você pode baixar ou apagar o que está guardado a qualquer momento."
      >
        <div className="space-y-10">
          <div>
            <h3 className="text-lg font-semibold">O que guardamos</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
              <li>Seu perfil e preferências, as respostas dos diagnósticos e dos exercícios.</li>
              <li>O histórico de memória de cada palavra e estrutura, para agendar as revisões.</li>
              <li>As conversas com o tutor, para você reler e revisar as correções.</li>
              <li>
                Das gravações de voz, apenas a transcrição e as notas. O áudio é avaliado e
                descartado na hora.
              </li>
            </ul>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {llm || pronunciationAssessment
                ? [
                    llm &&
                      "As mensagens para o tutor são enviadas à Anthropic (Claude) apenas para gerar a resposta e as correções.",
                    pronunciationAssessment &&
                      "O áudio das gravações é enviado à Microsoft Azure apenas para a avaliação da pronúncia.",
                  ]
                    .filter(Boolean)
                    .join(" ")
                : "Neste ambiente, nenhum dado é enviado a provedores de IA externos."}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Baixar meus dados</h3>
            <div className="mt-2">
              <ExportData />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Apagar dados específicos</h3>
            <div className="mt-3">
              <DeletePrivateData counts={counts} />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Excluir a conta</h3>
            <p className="text-muted-foreground mt-1 mb-4 leading-relaxed">
              Apaga a conta e todos os dados associados, imediatamente e para sempre.
            </p>
            <DeleteAccount />
          </div>
        </div>
      </Section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <Account />
      </Suspense>
    </div>
  );
}
