import type { ModuleInput } from "@/lib/content/schema";
import { unitPasseAvoir } from "./unit-1-passe-avoir";
import { unitPasseEtre } from "./unit-2-passe-etre";
import { unitImparfait } from "./unit-3-imparfait";
import { unitYEn } from "./unit-4-y-en";
import { unitComparer } from "./unit-5-comparer";

export const a2Modules: ModuleInput[] = [
  {
    id: "a2-m1",
    level: "A2",
    title: { pt: "Contar e comparar", fr: "Raconter et comparer" },
    description: {
      pt: "O passado (passé composé e imparfait), os pronomes y e en, e descrever e comparar lugares.",
      fr: "Le passé, les pronoms y et en, décrire et comparer.",
    },
    units: [unitPasseAvoir, unitPasseEtre, unitImparfait, unitYEn, unitComparer],
  },
];
