"use client";

import { useState } from "react";
import { ChoiceTile } from "@/components/choice-tile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DAILY_MINUTES } from "@/lib/learning/onboarding";
import { SESSION_DESCRIPTIONS } from "@/lib/learning/preferences";
import { STUDY_PACE_OPTIONS, type StudyPace } from "@/lib/learning/study-pace";

export function StudyChoices({
  minutes,
  pace,
  onMinutes,
  onPace,
}: {
  minutes: number | null;
  pace: StudyPace;
  onMinutes: (minutes: number) => void;
  onPace: (pace: StudyPace) => void;
}) {
  const [custom, setCustom] = useState(
    minutes !== null && !DAILY_MINUTES.some((m) => m === minutes),
  );
  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="font-semibold">Ritmo de estudo</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {STUDY_PACE_OPTIONS.map((option) => (
            <ChoiceTile
              key={option.value}
              type="radio"
              name="studyPace"
              value={option.value}
              title={option.label}
              description={option.description}
              checked={pace === option.value}
              onChange={() => onPace(option.value)}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="font-semibold">Quanto tempo você consegue dedicar por dia?</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {DAILY_MINUTES.map((value) => (
            <ChoiceTile
              key={value}
              type="radio"
              name="dailyMinutes"
              value={String(value)}
              title={`${value} minutos`}
              description={SESSION_DESCRIPTIONS[value]}
              checked={!custom && minutes === value}
              onChange={() => {
                setCustom(false);
                onMinutes(value);
              }}
            />
          ))}
          <ChoiceTile
            type="radio"
            name="dailyMinutes"
            value="custom"
            title="Outro tempo"
            description="Escolha de 5 a 240 minutos, divididos ao longo do dia."
            checked={custom}
            onChange={() => {
              setCustom(true);
              if (minutes === null) onMinutes(30);
            }}
          />
        </div>
        {custom && (
          <div className="max-w-xs space-y-2">
            <Label htmlFor="custom-minutes">Minutos por dia</Label>
            <Input
              id="custom-minutes"
              type="number"
              min={5}
              max={240}
              step={1}
              value={minutes ?? ""}
              onChange={(event) => onMinutes(Number(event.target.value))}
            />
          </div>
        )}
      </fieldset>
      <p className="text-muted-foreground text-sm">
        Mais tempo para praticar e aplicar, com limite de conteúdo novo. Você pode fazer pausas e
        mudar o ritmo depois. O prazo do seu objetivo não é uma promessa.
      </p>
    </div>
  );
}
