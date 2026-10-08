import type { ModuleInput } from "@/lib/content/schema";
import { unitEtreAvoir } from "./unit-1-etre-avoir";
import { unitFamille } from "./unit-2-famille";
import { unitJournee } from "./unit-3-journee";

export const a1Modules: ModuleInput[] = [
  {
    id: "a1-m1",
    level: "A1",
    title: { pt: "O essencial do A1", fr: "L'essentiel du A1" },
    description: {
      pt: "Os verbos e estruturas de base para falar de você, da sua rotina e da cidade.",
      fr: "Les verbes et structures de base pour parler de soi, de son quotidien et de la ville.",
    },
    units: [unitEtreAvoir, unitFamille, unitJournee],
  },
];
