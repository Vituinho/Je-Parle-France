import type { ModuleInput } from "@/lib/content/schema";
import { unitQuebec } from "./unit-1-quebec";
import { unitSInstaller } from "./unit-2-s-installer";
import { unitTravailSanteQc } from "./unit-3-travail-sante";

/** "Vivre au Canada": Québec French and the situations of settling in. */
export const canadaModules: ModuleInput[] = [
  {
    id: "ca-m0",
    level: "A0",
    track: "canada",
    title: {
      pt: "Vivre au Canada — primeiros contatos",
      fr: "Vivre au Canada — premiers contacts",
    },
    description: {
      pt: "O francês do dia a dia no Québec: cumprimentos, agradecimentos, refeições e fim de semana.",
      fr: "Le français de tous les jours au Québec : salutations, remerciements, repas et fin de semaine.",
    },
    units: [unitQuebec],
  },
  {
    id: "ca-m1",
    level: "A1",
    track: "canada",
    title: { pt: "Vivre au Canada — se instalar", fr: "Vivre au Canada — s'installer" },
    description: {
      pt: "Imigração no aeroporto, banco e moradia em Montréal.",
      fr: "La frontière à l'aéroport, la banque et le logement à Montréal.",
    },
    units: [unitSInstaller],
  },
  {
    id: "ca-m2",
    level: "A2",
    track: "canada",
    title: {
      pt: "Vivre au Canada — trabalhar e se cuidar",
      fr: "Vivre au Canada — travailler et se soigner",
    },
    description: {
      pt: "Procurar emprego, a entrevista e o sistema de saúde do Québec.",
      fr: "Chercher un emploi, l'entrevue et le système de santé au Québec.",
    },
    units: [unitTravailSanteQc],
  },
];
