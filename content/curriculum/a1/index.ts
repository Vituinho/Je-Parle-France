import type { ModuleInput } from "@/lib/content/schema";
import { unitEtreAvoir } from "./unit-1-etre-avoir";
import { unitFamille } from "./unit-2-famille";
import { unitJournee } from "./unit-3-journee";
import { unitVille } from "./unit-4-ville";
import { unitProjets } from "./unit-5-projets";
import { unitCourses } from "./unit-6-courses";
import { unitSante } from "./unit-7-sante";
import { unitMeteo } from "./unit-8-meteo";
import { unitRoutine } from "./unit-9-routine";
import { unitVerbes } from "./unit-10-verbes";

export const a1Modules: ModuleInput[] = [
  {
    id: "a1-m1",
    level: "A1",
    title: { pt: "O essencial do A1", fr: "L'essentiel du A1" },
    description: {
      pt: "Os verbos e estruturas de base para falar de você, da sua rotina e da cidade.",
      fr: "Les verbes et structures de base pour parler de soi, de son quotidien et de la ville.",
    },
    units: [unitEtreAvoir, unitFamille, unitJournee, unitVille, unitProjets],
  },
  {
    id: "a1-m2",
    level: "A1",
    title: { pt: "O dia a dia no A1", fr: "Le quotidien au A1" },
    description: {
      pt: "Compras, saúde, o tempo, a rotina e os verbos irregulares mais usados.",
      fr: "Les courses, la santé, la météo, la routine et les verbes irréguliers les plus courants.",
    },
    units: [unitCourses, unitSante, unitMeteo, unitRoutine, unitVerbes],
  },
];
