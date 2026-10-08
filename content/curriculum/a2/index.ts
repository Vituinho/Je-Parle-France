import type { ModuleInput } from "@/lib/content/schema";
import { unitPasseAvoir } from "./unit-1-passe-avoir";
import { unitPasseEtre } from "./unit-2-passe-etre";
import { unitImparfait } from "./unit-3-imparfait";
import { unitYEn } from "./unit-4-y-en";
import { unitComparer } from "./unit-5-comparer";
import { unitRecit } from "./unit-6-recit";
import { unitPronoms } from "./unit-7-pronoms";
import { unitFutur } from "./unit-8-futur";
import { unitObligation } from "./unit-9-obligation";
import { unitRelatifs } from "./unit-10-relatifs";

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
  {
    id: "a2-m2",
    level: "A2",
    title: { pt: "Histórias, pronomes e planos", fr: "Récits, pronoms et projets" },
    description: {
      pt: "Passé composé e imparfait juntos, pronomes objeto, o futuro, a obrigação e os relativos.",
      fr: "Passé composé et imparfait, pronoms compléments, futur, obligation et relatifs.",
    },
    units: [unitRecit, unitPronoms, unitFutur, unitObligation, unitRelatifs],
  },
];
