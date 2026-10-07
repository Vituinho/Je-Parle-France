import type { ModuleInput } from "@/lib/content/schema";
import { unitBonjour } from "./unit-1-bonjour";
import { unitSons } from "./unit-2-sons";
import { unitNombres } from "./unit-3-nombres";
import { unitCafe } from "./unit-4-cafe";

export const a0Modules: ModuleInput[] = [
  {
    id: "a0-m1",
    level: "A0",
    title: { pt: "Primeiros passos", fr: "Premiers pas" },
    description: {
      pt: "Cumprimentar, se apresentar, ouvir os sons do francês, contar e pedir num café.",
      fr: "Saluer, se présenter, entendre les sons du français, compter et commander au café.",
    },
    units: [unitBonjour, unitSons, unitNombres, unitCafe],
  },
];
