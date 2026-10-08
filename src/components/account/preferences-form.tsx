"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { savePreferencesAction } from "@/app/(app)/conta/actions";
import { ChoiceTile } from "@/components/choice-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DAILY_MINUTES, type DailyMinutes, type Destination } from "@/lib/learning/onboarding";
import {
  DESTINATION_OPTIONS,
  SESSION_DESCRIPTIONS,
  SUPPORT_PREFERENCE_LABELS,
  SUPPORT_PREFERENCES,
  TARGET_LEVEL_OPTIONS,
  TIMEZONE_OPTIONS,
  WEEKLY_GOAL_DAYS,
} from "@/lib/learning/preferences";
import type { SupportPreference } from "@/lib/learning/language-support";
import {
  CORRECTION_MODE_LABELS,
  CORRECTION_MODES,
  type CorrectionMode,
} from "@/lib/learning/tutor/tutor";
import { cn } from "@/lib/utils";

export interface PreferencesValues {
  name: string;
  dailyMinutes: DailyMinutes;
  weeklyGoalDays: number;
  destination: Destination;
  targetLevel: string;
  targetMonth: string;
  correctionMode: CorrectionMode;
  supportPreference: SupportPreference;
  timezone: string;
}

const selectClass =
  "border-input bg-background h-11 w-full rounded-xl border px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

function Fieldset({
  legend,
  hint,
  error,
  children,
}: {
  legend: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-semibold">{legend}</legend>
      {hint && <p className="text-muted-foreground -mt-1 text-sm">{hint}</p>}
      {children}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </fieldset>
  );
}

export function PreferencesForm({ initial }: { initial: PreferencesValues }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof PreferencesValues>(key: K, value: PreferencesValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const timezones = TIMEZONE_OPTIONS.some((option) => option.value === values.timezone)
    ? TIMEZONE_OPTIONS
    : [{ value: values.timezone, label: values.timezone }, ...TIMEZONE_OPTIONS];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await savePreferencesAction(values);
      if (result.ok) {
        setErrors({});
        toast.success("Preferências salvas");
      } else {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-10" aria-label="Preferências de estudo">
      <div className="max-w-sm space-y-2">
        <Label htmlFor="name">Como quer ser chamado?</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
          maxLength={60}
          aria-invalid={Boolean(errors.name)}
          className="h-11 rounded-xl"
        />
        {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
      </div>

      <Fieldset
        legend="Tempo por dia"
        hint="A sessão de hoje já planejada não muda; a de amanhã usa o novo tempo."
        error={errors.dailyMinutes}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {DAILY_MINUTES.map((minutes) => (
            <ChoiceTile
              key={minutes}
              type="radio"
              name="dailyMinutes"
              value={String(minutes)}
              checked={values.dailyMinutes === minutes}
              onChange={() => set("dailyMinutes", minutes)}
              title={`${minutes} minutos`}
              description={SESSION_DESCRIPTIONS[minutes]}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset
        legend="Meta semanal"
        hint="Quantos dias por semana você quer estudar. Um dia de descanso por semana não quebra a sequência."
        error={errors.weeklyGoalDays}
      >
        <div className="flex flex-wrap gap-2">
          {WEEKLY_GOAL_DAYS.map((days) => (
            <label
              key={days}
              className={cn(
                "grid h-11 min-w-20 cursor-pointer place-items-center rounded-xl border-[1.5px] px-4 font-medium transition-colors",
                "has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
                values.weeklyGoalDays === days
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                name="weeklyGoalDays"
                value={days}
                checked={values.weeklyGoalDays === days}
                onChange={() => set("weeklyGoalDays", days)}
                className="sr-only"
              />
              {days} dias
            </label>
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="Destino" error={errors.destination}>
        <div className="grid gap-3 sm:grid-cols-2">
          {DESTINATION_OPTIONS.map((option) => (
            <ChoiceTile
              key={option.value}
              type="radio"
              name="destination"
              value={option.value}
              checked={values.destination === option.value}
              onChange={() => set("destination", option.value)}
              title={option.label}
              description={option.description}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="Objetivo" hint="Usado para estimar prazos. Não é uma promessa.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="targetLevel">Nível que quer alcançar</Label>
            <select
              id="targetLevel"
              value={values.targetLevel}
              onChange={(event) => set("targetLevel", event.target.value)}
              className={selectClass}
            >
              <option value="">Ainda não sei</option>
              {TARGET_LEVEL_OPTIONS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.value}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-sm">
              {TARGET_LEVEL_OPTIONS.find((level) => level.value === values.targetLevel)
                ?.description ?? "Você pode definir depois."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetMonth">Até quando (opcional)</Label>
            <Input
              id="targetMonth"
              type="month"
              value={values.targetMonth}
              onChange={(event) => set("targetMonth", event.target.value)}
              aria-invalid={Boolean(errors.targetMonth)}
              className="h-11 rounded-xl"
            />
            {errors.targetMonth && <p className="text-destructive text-sm">{errors.targetMonth}</p>}
          </div>
        </div>
      </Fieldset>

      <Fieldset
        legend="Português nas explicações"
        hint="O botão “Explicar em português” continua sempre disponível."
        error={errors.supportPreference}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {SUPPORT_PREFERENCES.map((preference) => (
            <ChoiceTile
              key={preference}
              type="radio"
              name="supportPreference"
              value={preference}
              checked={values.supportPreference === preference}
              onChange={() => set("supportPreference", preference)}
              title={SUPPORT_PREFERENCE_LABELS[preference].title}
              description={SUPPORT_PREFERENCE_LABELS[preference].description}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset
        legend="Correções do tutor"
        hint="O padrão para novas conversas. Você pode mudar em cada conversa."
        error={errors.correctionMode}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {CORRECTION_MODES.map((mode) => (
            <ChoiceTile
              key={mode}
              type="radio"
              name="correctionMode"
              value={mode}
              checked={values.correctionMode === mode}
              onChange={() => set("correctionMode", mode)}
              title={CORRECTION_MODE_LABELS[mode].title}
              description={CORRECTION_MODE_LABELS[mode].description}
            />
          ))}
        </div>
      </Fieldset>

      <div className="max-w-sm space-y-2">
        <Label htmlFor="timezone">Fuso horário</Label>
        <select
          id="timezone"
          value={values.timezone}
          onChange={(event) => set("timezone", event.target.value)}
          className={selectClass}
        >
          {timezones.map((zone) => (
            <option key={zone.value} value={zone.value}>
              {zone.label}
            </option>
          ))}
        </select>
        <p className="text-muted-foreground text-sm">Define quando o seu dia de estudo começa.</p>
        {errors.timezone && <p className="text-destructive text-sm">{errors.timezone}</p>}
      </div>

      <Button type="submit" disabled={pending} className="h-12 rounded-xl px-8 text-base">
        {pending ? "Salvando…" : "Salvar preferências"}
      </Button>
    </form>
  );
}
