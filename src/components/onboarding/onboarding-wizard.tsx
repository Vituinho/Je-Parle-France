"use client";

import { ArrowLeft } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { submitOnboarding } from "@/app/(focus)/comecar/actions";
import { ChoiceTile } from "@/components/choice-tile";
import { Fr } from "@/components/fr";
import { LineProgress } from "@/components/line-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CefrLevel } from "@/lib/learning/cefr";
import {
  DAILY_MINUTES,
  estimateTimeToLevel,
  experiencePrior,
  minutesPerDayForDeadline,
  monthsUntil,
  recommendedStart,
  type DailyMinutes,
  type Destination,
  type LearningGoal,
  type PriorExperience,
  type StartChoice,
} from "@/lib/learning/onboarding";

type TargetLevel = Exclude<CefrLevel, "A0">;

interface Answers {
  goals: LearningGoal[];
  goalOther: string;
  destination: Destination | null;
  priorExperience: PriorExperience | null;
  dailyMinutes: DailyMinutes | null;
  targetLevel: TargetLevel | null | "unknown";
  targetMonth: string;
  start: StartChoice | null;
}

const GOALS: { value: LearningGoal; label: string }[] = [
  { value: "move_canada", label: "Morar no Canadá" },
  { value: "move_quebec", label: "Morar no Québec" },
  { value: "move_france", label: "Morar na França" },
  { value: "immigration", label: "Processo de imigração" },
  { value: "work", label: "Trabalhar em francês" },
  { value: "study", label: "Estudar em francês" },
  { value: "exam", label: "Prova oficial (TEF, TCF, DELF…)" },
  { value: "travel", label: "Viajar" },
  { value: "culture", label: "Cultura, filmes, livros" },
  { value: "relationship", label: "Família ou relacionamento" },
  { value: "personal", label: "Interesse pessoal" },
  { value: "other", label: "Outro" },
];

const DESTINATIONS: { value: Destination; label: string; description: string }[] = [
  {
    value: "canada_quebec",
    label: "Canadá / Québec",
    description: "Damos mais atenção ao francês do Canadá: sotaque, vocabulário, situações locais.",
  },
  {
    value: "france",
    label: "França",
    description: "Foco nas situações e no vocabulário do dia a dia na França.",
  },
  { value: "both", label: "Os dois", description: "Base internacional com notas dos dois lados." },
  {
    value: "undecided",
    label: "Ainda não sei",
    description: "Começamos pelo francês internacional — serve para qualquer destino.",
  },
];

const EXPERIENCES: { value: PriorExperience; label: string }[] = [
  { value: "never", label: "Nunca estudei francês" },
  { value: "few_words", label: "Sei algumas palavras" },
  { value: "a_little", label: "Estudei um pouco" },
  { value: "simple_conversations", label: "Consigo ter conversas simples" },
  { value: "intermediate", label: "Tenho francês intermediário" },
  { value: "advanced", label: "Já tenho francês avançado" },
  { value: "unknown", label: "Não sei meu nível" },
];

const DURATIONS: Record<DailyMinutes, string> = {
  5: "Revisão do essencial, uma ideia nova e uma frase em voz alta.",
  15: "Revisão, uma microlição, um pouco de escuta e prática ativa.",
  30: "Sessão equilibrada: revisão, lição, escuta, pronúncia e fala.",
  60: "Sessão completa, com leitura, escrita e conversa com o tutor.",
};

const LEVELS: { value: TargetLevel; description: string }[] = [
  { value: "A1", description: "Se apresentar e resolver o básico do dia a dia." },
  { value: "A2", description: "Conversas simples sobre rotina, compras e trabalho." },
  { value: "B1", description: "Se virar sozinho na maioria das situações do dia a dia." },
  { value: "B2", description: "Trabalhar e estudar em francês com desenvoltura." },
  { value: "C1", description: "Francês preciso e natural, inclusive em contextos profissionais." },
];

const STARTS: { value: StartChoice; label: string; description: string }[] = [
  {
    value: "quick",
    label: "Diagnóstico rápido",
    description: "8 a 12 minutos. Vocabulário, gramática, leitura e escuta, com perguntas que se adaptam a você.",
  },
  {
    value: "complete",
    label: "Diagnóstico completo",
    description: "25 a 40 minutos. Inclui escrita, fala e pronúncia para um retrato mais detalhado.",
  },
  {
    value: "from_zero",
    label: "Começar do zero",
    description: "Vamos direto para a primeira lição do A0. Você pode fazer o diagnóstico depois.",
  },
];

const STEPS = [
  { id: "goals", fr: "Pourquoi le français ?", pt: "Por que você quer aprender francês?" },
  { id: "destination", fr: "Où ça ?", pt: "Para onde você pensa em ir?" },
  { id: "experience", fr: "Et votre français ?", pt: "Você já estudou francês?" },
  { id: "time", fr: "Combien de temps par jour ?", pt: "Quanto tempo você tem por dia?" },
  { id: "target", fr: "Votre objectif ?", pt: "Até onde você quer chegar?" },
  { id: "start", fr: "On commence ?", pt: "Como você quer começar?" },
] as const;

function formatMonths([low, high]: [number, number]): string {
  if (high >= 24) {
    const years = (m: number) => (Math.round((m / 12) * 2) / 2).toLocaleString("pt-BR");
    const [a, b] = [years(low), years(high)];
    return a === b ? `cerca de ${a} anos` : `entre ${a} e ${b} anos`;
  }
  return low === high ? `cerca de ${low} meses` : `entre ${low} e ${high} meses`;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function OnboardingWizard({ firstName }: { firstName: string }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<Answers>({
    goals: [],
    goalOther: "",
    destination: null,
    priorExperience: null,
    dailyMinutes: null,
    targetLevel: null,
    targetMonth: "",
    start: null,
  });
  const update = (patch: Partial<Answers>) => setAnswers((current) => ({ ...current, ...patch }));
  const current = STEPS[step] as (typeof STEPS)[number];

  const canContinue = (() => {
    switch (current.id) {
      case "goals":
        return (
          answers.goals.length > 0 &&
          (!answers.goals.includes("other") || answers.goalOther.trim().length > 0)
        );
      case "destination":
        return answers.destination !== null;
      case "experience":
        return answers.priorExperience !== null;
      case "time":
        return answers.dailyMinutes !== null;
      case "target":
        return answers.targetLevel !== null;
      case "start":
        return answers.start !== null;
    }
  })();

  const estimate = useMemo(() => {
    if (!answers.priorExperience || !answers.dailyMinutes) return null;
    if (!answers.targetLevel || answers.targetLevel === "unknown") return null;
    const result = estimateTimeToLevel({
      currentTheta: experiencePrior(answers.priorExperience).mean,
      targetLevel: answers.targetLevel,
      dailyMinutes: answers.dailyMinutes,
      daysPerWeek: 5,
    });
    const deadlineMonths = answers.targetMonth ? monthsUntil(answers.targetMonth, new Date()) : null;
    const neededMinutes =
      deadlineMonths !== null && !result.alreadyThere
        ? minutesPerDayForDeadline(result.hours[0], deadlineMonths, 5)
        : null;
    return { ...result, deadlineMonths, neededMinutes };
  }, [answers.priorExperience, answers.dailyMinutes, answers.targetLevel, answers.targetMonth]);

  function next() {
    if (!canContinue) return;
    if (current.id === "experience" && answers.priorExperience && !answers.start) {
      update({ start: recommendedStart(answers.priorExperience) });
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitOnboarding({
        goals: answers.goals,
        goalOther: answers.goalOther.trim() || undefined,
        destination: answers.destination,
        priorExperience: answers.priorExperience,
        dailyMinutes: answers.dailyMinutes,
        targetLevel: answers.targetLevel === "unknown" ? null : answers.targetLevel,
        targetMonth: answers.targetMonth || undefined,
        start: answers.start,
      });
      if (result?.error) setError(result.error);
    });
  }

  const recommended = answers.priorExperience ? recommendedStart(answers.priorExperience) : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-6 pb-10 sm:px-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0 || pending}
          aria-label="Voltar"
        >
          <ArrowLeft />
        </Button>
        <LineProgress
          ariaLabel="Etapas do cadastro"
          showLabels={false}
          stations={STEPS.map((s, index) => ({
            id: s.id,
            label: s.pt,
            state: index < step ? "done" : index === step ? "current" : "upcoming",
          }))}
        />
      </div>

      <form
        className="mt-10 flex flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          next();
        }}
      >
        {step === 0 && (
          <p className="text-muted-foreground mb-4">
            Prazer, {firstName}. Algumas perguntas rápidas para montar o seu plano.
          </p>
        )}
        <fieldset className="flex-1">
          <legend className="w-full">
            <Fr className="text-primary block text-xl">{current.fr}</Fr>
            <span className="font-heading mt-1 block text-[1.9rem] leading-tight font-bold">
              {current.pt}
            </span>
          </legend>

          <div className="mt-7">
            {current.id === "goals" && (
              <>
                <p className="text-muted-foreground mb-4 text-sm">Escolha quantos quiser.</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {GOALS.map((goal) => (
                    <ChoiceTile
                      key={goal.value}
                      type="checkbox"
                      name="goals"
                      value={goal.value}
                      title={goal.label}
                      checked={answers.goals.includes(goal.value)}
                      onChange={(checked) =>
                        update({
                          goals: checked
                            ? [...answers.goals, goal.value]
                            : answers.goals.filter((g) => g !== goal.value),
                        })
                      }
                    />
                  ))}
                </div>
                {answers.goals.includes("other") && (
                  <div className="mt-5 space-y-2">
                    <Label htmlFor="goal-other">Qual é o seu objetivo?</Label>
                    <Input
                      id="goal-other"
                      value={answers.goalOther}
                      maxLength={120}
                      onChange={(event) => update({ goalOther: event.target.value })}
                      className="h-11"
                    />
                  </div>
                )}
              </>
            )}

            {current.id === "destination" && (
              <div className="grid gap-2.5">
                {DESTINATIONS.map((option) => (
                  <ChoiceTile
                    key={option.value}
                    type="radio"
                    name="destination"
                    value={option.value}
                    title={option.label}
                    description={option.description}
                    checked={answers.destination === option.value}
                    onChange={() => update({ destination: option.value })}
                  />
                ))}
              </div>
            )}

            {current.id === "experience" && (
              <div className="grid gap-2.5">
                {EXPERIENCES.map((option) => (
                  <ChoiceTile
                    key={option.value}
                    type="radio"
                    name="experience"
                    value={option.value}
                    title={option.label}
                    checked={answers.priorExperience === option.value}
                    onChange={() => update({ priorExperience: option.value, start: null })}
                  />
                ))}
              </div>
            )}

            {current.id === "time" && (
              <>
                <div className="grid gap-2.5">
                  {DAILY_MINUTES.map((minutes) => (
                    <ChoiceTile
                      key={minutes}
                      type="radio"
                      name="dailyMinutes"
                      value={String(minutes)}
                      title={`${minutes} minutos`}
                      description={DURATIONS[minutes]}
                      checked={answers.dailyMinutes === minutes}
                      onChange={() => update({ dailyMinutes: minutes })}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mt-4 text-sm">
                  Cada duração monta uma sessão diferente — não é só mais do mesmo. Dá para mudar
                  quando quiser.
                </p>
              </>
            )}

            {current.id === "target" && (
              <>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {LEVELS.map((level) => (
                    <ChoiceTile
                      key={level.value}
                      type="radio"
                      name="targetLevel"
                      value={level.value}
                      title={level.value}
                      description={level.description}
                      checked={answers.targetLevel === level.value}
                      onChange={() => update({ targetLevel: level.value })}
                    />
                  ))}
                  <ChoiceTile
                    type="radio"
                    name="targetLevel"
                    value="unknown"
                    title="Ainda não sei"
                    description="Sem problema — o diagnóstico ajuda a decidir."
                    checked={answers.targetLevel === "unknown"}
                    onChange={() => update({ targetLevel: "unknown", targetMonth: "" })}
                  />
                </div>

                {answers.targetLevel && answers.targetLevel !== "unknown" && (
                  <div className="mt-6 space-y-2">
                    <Label htmlFor="target-month">Tem um prazo? (opcional)</Label>
                    <Input
                      id="target-month"
                      type="month"
                      min={currentMonth()}
                      value={answers.targetMonth}
                      onChange={(event) => update({ targetMonth: event.target.value })}
                      className="h-11 w-full sm:w-56"
                    />
                  </div>
                )}

                {estimate && (
                  <div
                    aria-live="polite"
                    className="border-border bg-card mt-6 rounded-2xl border p-4 text-[0.95rem] leading-relaxed"
                  >
                    {estimate.alreadyThere ? (
                      <p>
                        Pelo que você contou, talvez já esteja perto desse nível. O diagnóstico vai
                        confirmar.
                      </p>
                    ) : (
                      <>
                        <p>
                          Estudando {answers.dailyMinutes} min por dia, 5 dias por semana, chegar ao{" "}
                          {answers.targetLevel} costuma levar{" "}
                          <strong>{formatMonths(estimate.months)}</strong> ({estimate.hours[0]}–
                          {estimate.hours[1]} horas de estudo).
                        </p>
                        {estimate.deadlineMonths !== null && estimate.neededMinutes !== null && (
                          <p className="mt-2">
                            Para chegar até a data escolhida, seriam cerca de{" "}
                            <strong>{estimate.neededMinutes} min por dia</strong>
                            {estimate.neededMinutes > 120 &&
                              " — um ritmo muito intenso; vale considerar um prazo maior"}
                            .
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-muted-foreground mt-2 text-sm">
                      É uma estimativa típica, não uma promessa: varia muito de pessoa para pessoa e
                      com a exposição ao francês fora do app.
                    </p>
                  </div>
                )}
              </>
            )}

            {current.id === "start" && (
              <div className="grid gap-2.5">
                {STARTS.map((option) => (
                  <ChoiceTile
                    key={option.value}
                    type="radio"
                    name="start"
                    value={option.value}
                    title={option.label}
                    description={option.description}
                    badge={
                      recommended === option.value ? (
                        <Badge variant="secondary">Recomendado para você</Badge>
                      ) : null
                    }
                    checked={answers.start === option.value}
                    onChange={() => update({ start: option.value })}
                  />
                ))}
              </div>
            )}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-destructive bg-destructive-soft mt-6 rounded-lg px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <div className="bg-background/95 sticky bottom-0 mt-8 flex justify-end py-4 backdrop-blur">
          <Button
            type="submit"
            disabled={!canContinue || pending}
            className="h-12 w-full rounded-xl px-8 text-base sm:w-auto"
          >
            {step === STEPS.length - 1 ? (pending ? "Montando…" : "Montar meu plano") : "Continuar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
