"use client";

import { useState } from "react";
import { startConversationAction } from "@/app/(app)/tutor/actions";
import { ChoiceTile } from "@/components/choice-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CORRECTION_MODES,
  CORRECTION_MODE_LABELS,
  type CorrectionMode,
} from "@/lib/learning/tutor/tutor";

interface ScenarioOption {
  id: string;
  title: string;
  goal: string;
  track: "core" | "canada" | "france";
  minLevel: string;
  fits: boolean;
}

const FREE = "__free__";

export function TutorStartForm({
  scenarios,
  trackLabels,
  defaultScenario,
  defaultMode,
  sessionId,
}: {
  scenarios: ScenarioOption[];
  trackLabels: Record<ScenarioOption["track"], string>;
  defaultScenario?: string;
  defaultMode: CorrectionMode;
  sessionId?: string;
}) {
  const [scenario, setScenario] = useState(defaultScenario ?? scenarios[0]?.id ?? FREE);
  const [mode, setMode] = useState<CorrectionMode>(defaultMode);
  const [pending, setPending] = useState(false);

  return (
    <form action={startConversationAction} onSubmit={() => setPending(true)} className="space-y-10">
      <input type="hidden" name="scenarioId" value={scenario === FREE ? "" : scenario} />
      <input type="hidden" name="correctionMode" value={mode} />
      {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}

      <fieldset>
        <legend className="text-xl font-bold">Situação</legend>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {scenarios.map((option) => (
            <ChoiceTile
              key={option.id}
              type="radio"
              name="scenario"
              value={option.id}
              checked={scenario === option.id}
              onChange={() => setScenario(option.id)}
              title={option.title}
              description={option.goal}
              badge={
                <>
                  <Badge variant="secondary">{trackLabels[option.track]}</Badge>
                  {!option.fits && <Badge variant="outline">a partir do {option.minLevel}</Badge>}
                </>
              }
            />
          ))}
          <ChoiceTile
            type="radio"
            name="scenario"
            value={FREE}
            checked={scenario === FREE}
            onChange={() => setScenario(FREE)}
            title="Conversa livre"
            description="Sem roteiro: o tutor puxa assunto e acompanha o que você quiser falar."
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xl font-bold">Correções</legend>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {CORRECTION_MODES.map((value) => (
            <ChoiceTile
              key={value}
              type="radio"
              name="mode"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
              title={CORRECTION_MODE_LABELS[value].title}
              description={CORRECTION_MODE_LABELS[value].description}
            />
          ))}
        </div>
      </fieldset>

      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl px-8 text-base sm:w-auto"
      >
        {pending ? "Abrindo…" : "Começar conversa"}
      </Button>
    </form>
  );
}
