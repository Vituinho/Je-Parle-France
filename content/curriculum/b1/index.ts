import type { ModuleInput } from "@/lib/content/schema";
import { unitConditionnel } from "./unit-1-conditionnel";
import { unitHypotheses } from "./unit-2-hypotheses";
import { unitSubjonctif } from "./unit-3-subjonctif";
import { unitDiscours } from "./unit-4-discours";
import { unitOpinion } from "./unit-5-opinion";

export const b1Modules: ModuleInput[] = [
  {
    id: "b1-m1",
    level: "B1",
    title: { pt: "Nuance e argumentação", fr: "Nuancer et argumenter" },
    description: {
      pt: "O condicional, as hipóteses, o subjuntivo, o discurso indireto e a argumentação.",
      fr: "Le conditionnel, l'hypothèse, le subjonctif, le discours indirect et l'argumentation.",
    },
    units: [unitConditionnel, unitHypotheses, unitSubjonctif, unitDiscours, unitOpinion],
  },
];
