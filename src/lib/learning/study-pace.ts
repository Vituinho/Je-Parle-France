import { z } from "zod";

export const STUDY_PACES = ["light", "balanced", "accelerated", "immersion"] as const;
export type StudyPace = (typeof STUDY_PACES)[number];
export const dailyMinutesSchema = z.number().int().min(5).max(240);
export const STUDY_PACE_OPTIONS: { value: StudyPace; label: string; description: string }[] = [
  {
    value: "light",
    label: "Sem pressa",
    description: "Quero criar o hábito e aprender aos poucos.",
  },
  { value: "balanced", label: "Equilibrado", description: "Quero evoluir com consistência." },
  {
    value: "accelerated",
    label: "Acelerado",
    description: "Quero aprender o mais rápido possível, com um ritmo sustentável.",
  },
  {
    value: "immersion",
    label: "Imersão",
    description: "Francês é uma prioridade importante para mim.",
  },
];

/** Legacy profiles keep their time and progress; no onboarding/reset is required. */
export function studyPace(pace: StudyPace | null | undefined, minutes: number): StudyPace {
  return (
    pace ??
    (minutes <= 15
      ? "light"
      : minutes <= 60
        ? "balanced"
        : minutes <= 120
          ? "accelerated"
          : "immersion")
  );
}
