import type { ModuleInput } from "@/lib/content/schema";
import { unitQuotidien } from "./unit-1-quotidien";
import { unitSInstallerFrance } from "./unit-2-s-installer";

/** "Vivre en France": everyday life and the situations of settling in. */
export const franceModules: ModuleInput[] = [
  {
    id: "fr-m0",
    level: "A0",
    track: "france",
    title: { pt: "Vivre en France — o dia a dia", fr: "Vivre en France — le quotidien" },
    description: {
      pt: "A boulangerie, as refeições e os horários franceses.",
      fr: "La boulangerie, les repas et les horaires français.",
    },
    units: [unitQuotidien],
  },
  {
    id: "fr-m1",
    level: "A1",
    track: "france",
    title: { pt: "Vivre en France — se instalar", fr: "Vivre en France — s'installer" },
    description: {
      pt: "Metrô, papelada na préfecture e aluguel de apartamento.",
      fr: "Le métro, les démarches à la préfecture et la location d'un logement.",
    },
    units: [unitSInstallerFrance],
  },
];
