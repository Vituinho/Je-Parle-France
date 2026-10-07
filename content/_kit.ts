import type { Localized } from "@/lib/content/schema";
import type { Dimension } from "@/lib/learning/skills";

/** Small authoring helpers shared by content files. They only build plain data. */

export const t = (concept: string, dimension: Dimension, weight?: number) =>
  weight === undefined ? { concept, dimension } : { concept, dimension, weight };

export const say = {
  meaning: { pt: "O que significa?", fr: "Qu'est-ce que ça veut dire ?" },
  listenChoose: { pt: "Ouça. O que você ouviu?", fr: "Écoutez. Qu'avez-vous entendu ?" },
  whichWord: { pt: "Qual palavra você ouviu?", fr: "Quel mot avez-vous entendu ?" },
  match: { pt: "Ligue os pares.", fr: "Associez." },
  order: { pt: "Monte a frase.", fr: "Remettez les mots dans l'ordre." },
  complete: { pt: "Complete a frase.", fr: "Complétez la phrase." },
  write: { pt: "Escreva em francês.", fr: "Écrivez en français." },
  dictation: { pt: "Ouça e escreva.", fr: "Écoutez et écrivez." },
  repeat: { pt: "Ouça, grave e compare.", fr: "Écoutez, enregistrez-vous et comparez." },
  answer: { pt: "Responda em voz alta.", fr: "Répondez à voix haute." },
  listen: { pt: "Ouça e responda.", fr: "Écoutez et répondez." },
  fix: { pt: "Corrija a frase.", fr: "Corrigez la phrase." },
  situation: { pt: "Escolha o que dizer.", fr: "Que dites-vous ?" },
} satisfies Record<string, Localized>;
