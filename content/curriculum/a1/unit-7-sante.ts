import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitSante: UnitInput = {
  id: "a1-u7",
  level: "A1",
  title: { pt: "Saúde", fr: "La santé" },
  canDo: {
    pt: "Dizer onde dói e como você está, entender as perguntas do médico e se virar na farmácia.",
    fr: "Dire où on a mal, comprendre le médecin et se débrouiller à la pharmacie.",
  },
  missionScenario: "scn-pharmacie",
  lessons: [
    {
      id: "a1-u7-l1",
      title: { pt: "J'ai mal à la tête", fr: "J'ai mal à la tête" },
      objective: {
        pt: "Dizer onde dói com avoir mal à e as partes do corpo.",
        fr: "Dire où on a mal.",
      },
      minutes: 7,
      steps: [
        {
          id: "a1-u7-l1-t1",
          type: "teach",
          title: { pt: "“Estou com dor de…”" },
          body: {
            pt: "Em francês, você **tem mal** num lugar: **avoir mal à** + parte do corpo.\n\n*J'ai mal **à la** tête.* (cabeça)\n*J'ai mal **au** ventre.* (barriga — *à + le*)\n*J'ai mal **au** dos.* (costas)\n*J'ai mal **à la** gorge.* (garganta)\n*J'ai mal **aux** dents.* (dentes — *à + les*)",
          },
          examples: [
            { fr: "J'ai mal à la tête.", pt: "Estou com dor de cabeça." },
            { fr: "Il a mal au dos.", pt: "Ele está com dor nas costas." },
            { fr: "Où est-ce que vous avez mal ?", pt: "Onde está doendo?" },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "É *la* tête, não *ma* tête: com o corpo, o francês usa o artigo definido.",
              },
            },
          ],
          introduces: [
            "gram:avoir-mal-a",
            "lex:la-tete",
            "lex:le-ventre",
            "lex:le-dos",
            "lex:la-gorge",
          ],
        },
        {
          id: "a1-u7-l1-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "J'ai mal ___ ventre." },
          options: ["au", "à le", "à la", "du"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*à + le* = *au*." },
            { pt: "*Ventre* é masculino: *au ventre*." },
            { pt: "*du* é *de + le*. Aqui é *à*: *au*." },
          ],
          targets: [t("gram:avoir-mal-a", "recognition"), t("lex:le-ventre", "recognition", 0.5)],
        },
        {
          id: "a1-u7-l1-a2",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "la tête", right: "a cabeça" },
            { left: "le ventre", right: "a barriga" },
            { left: "le dos", right: "as costas" },
            { left: "la gorge", right: "a garganta" },
          ],
          targets: [
            t("lex:la-tete", "recognition"),
            t("lex:le-ventre", "recognition"),
            t("lex:le-dos", "recognition"),
            t("lex:la-gorge", "recognition"),
          ],
        },
        {
          id: "a1-u7-l1-a3",
          type: "fill",
          instruction: say.complete,
          sentence: "Elle a mal ___ gorge et ___ dents.",
          blanks: [{ accept: ["à la"] }, { accept: ["aux"] }],
          translation: "Ela está com dor de garganta e de dente.",
          targets: [t("gram:avoir-mal-a", "writing")],
        },
        {
          id: "a1-u7-l1-a4",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Ma tête fait mal.",
          accept: ["J'ai mal à la tête."],
          explanation: { pt: "Em francês, a pessoa “tem mal”: *j'ai mal à la tête*." },
          targets: [t("gram:avoir-mal-a", "writing"), t("lex:la-tete", "recall", 0.5)],
        },
        {
          id: "a1-u7-l1-a5",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Estou com dor nas costas." },
          accept: ["J'ai mal au dos."],
          targets: [t("gram:avoir-mal-a", "writing"), t("lex:le-dos", "recall")],
        },
        {
          id: "a1-u7-l1-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "J'ai mal à la tête et au ventre.",
          translation: "Estou com dor de cabeça e de barriga.",
          targets: [t("gram:avoir-mal-a", "speaking")],
        },
      ],
    },
    {
      id: "a1-u7-l2",
      title: { pt: "Estou doente", fr: "Je suis malade" },
      objective: {
        pt: "Descrever sintomas simples e avisar que não vai trabalhar ou estudar.",
        fr: "Décrire des symptômes simples.",
      },
      minutes: 6,
      steps: [
        {
          id: "a1-u7-l2-t1",
          type: "teach",
          title: { pt: "Sintomas" },
          body: {
            pt: "**Je suis malade.** — Estou doente.\n**J'ai de la fièvre.** — Estou com febre (com partitivo: *de la fièvre*).\n**J'ai mal à la gorge.** — Estou com dor de garganta.\n\nPara avisar no trabalho ou na escola: *Je suis malade, je ne viens pas aujourd'hui.* (Estou doente, não vou hoje.)",
          },
          examples: [
            { fr: "Je suis malade.", pt: "Estou doente." },
            { fr: "Mon fils a de la fièvre.", pt: "Meu filho está com febre." },
            {
              fr: "Je suis malade, je ne viens pas aujourd'hui.",
              pt: "Estou doente, não vou hoje.",
            },
          ],
          introduces: ["lex:je-suis-malade", "lex:avoir-de-la-fievre"],
        },
        {
          id: "a1-u7-l2-a1",
          type: "choice",
          instruction: { pt: "Qual frase está correta?" },
          prompt: { pt: "Estou com febre." },
          options: ["J'ai de la fièvre.", "Je suis fièvre.", "J'ai fièvre la."],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Febre se “tem”: *avoir de la fièvre*." },
            { pt: "O artigo vem antes: *de la fièvre*." },
          ],
          targets: [t("lex:avoir-de-la-fievre", "recognition")],
        },
        {
          id: "a1-u7-l2-a2",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Uma mensagem de voz para o chefe. *le bureau* = o escritório." },
          lines: [
            {
              speaker: "Lucas",
              text: "Bonjour Claire, c'est Lucas. Je suis malade : j'ai de la fièvre et mal à la gorge. Je ne viens pas au bureau aujourd'hui. Merci, à demain j'espère !",
              gender: "m",
            },
          ],
          questions: [
            {
              prompt: { pt: "Quais são os sintomas de Lucas?" },
              options: ["Febre e dor de garganta", "Dor de cabeça e de barriga", "Dor nas costas"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que ele avisa?" },
              options: [
                "Que não vai ao escritório hoje",
                "Que vai chegar atrasado",
                "Que vai ao médico amanhã",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:je-suis-malade", "listening"),
            t("lex:avoir-de-la-fievre", "listening"),
            t("lex:la-gorge", "listening", 0.5),
          ],
        },
        {
          id: "a1-u7-l2-a3",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Estou doente." },
          accept: ["Je suis malade."],
          targets: [t("lex:je-suis-malade", "recall")],
        },
        {
          id: "a1-u7-l2-a4",
          type: "order",
          instruction: say.order,
          tokens: ["Ma", "fille", "a", "de", "la", "fièvre."],
          translation: "Minha filha está com febre.",
          targets: [t("lex:avoir-de-la-fievre", "recall")],
        },
        {
          id: "a1-u7-l2-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Je suis malade, je ne viens pas aujourd'hui.",
          translation: "Estou doente, não vou hoje.",
          targets: [t("lex:je-suis-malade", "speaking")],
        },
      ],
    },
    {
      id: "a1-u7-l3",
      title: { pt: "No médico e na farmácia", fr: "Chez le médecin, à la pharmacie" },
      objective: {
        pt: "Entender a receita, pedir um remédio e saber os números de emergência.",
        fr: "Comprendre une ordonnance et demander un médicament.",
      },
      minutes: 7,
      steps: [
        {
          id: "a1-u7-l3-t1",
          type: "teach",
          title: { pt: "Receita e remédio" },
          body: {
            pt: "**une ordonnance** — a receita do médico (receita de cozinha é *une recette*!)\n**un médicament** — um remédio\n\nNa farmácia: *J'ai une ordonnance.* / *Vous avez quelque chose pour le mal de gorge ?* (Tem algo para dor de garganta?)\n\nE os números de emergência — saiba antes de precisar.",
          },
          examples: [
            { fr: "Vous avez une ordonnance ?", pt: "O senhor tem receita?" },
            {
              fr: "Prenez ce médicament trois fois par jour.",
              pt: "Tome este remédio três vezes por dia.",
            },
          ],
          notes: [
            {
              kind: "quebec",
              text: {
                pt: "No Québec, para algo sem gravidade, procure uma *clinique sans rendez-vous* ou ligue para o **811** (Info-Santé). Emergência: **911**.",
              },
            },
            {
              kind: "france",
              text: {
                pt: "Na França, a farmácia fica indicada por uma cruz verde, e o médico de família é o *médecin traitant*. Emergência médica: **15** (SAMU) ou **112**.",
              },
            },
          ],
          introduces: ["lex:une-ordonnance", "lex:un-medicament", "cult:urgences"],
        },
        {
          id: "a1-u7-l3-a1",
          type: "choice",
          instruction: say.meaning,
          prompt: { fr: "Vous avez une ordonnance ?" },
          options: [
            "O senhor tem receita (médica)?",
            "O senhor tem uma ordem?",
            "O senhor tem horário marcado?",
          ],
          optionsLang: "pt",
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Falso amigo: no médico, *ordonnance* é a receita." },
            { pt: "Horário marcado é *un rendez-vous*." },
          ],
          targets: [t("lex:une-ordonnance", "recognition")],
        },
        {
          id: "a1-u7-l3-a2",
          type: "choice",
          instruction: say.situation,
          prompt: { pt: "Você está no Canadá e alguém desmaiou na rua. Para que número liga?" },
          options: ["911", "15", "811"],
          optionsLang: "pt",
          answer: 0,
          optionFeedback: [
            null,
            { pt: "O 15 é o SAMU da França." },
            { pt: "O 811 (Québec) é para orientação de saúde, não para emergências." },
          ],
          targets: [t("cult:urgences", "recognition")],
        },
        {
          id: "a1-u7-l3-a3",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Na farmácia. *des comprimés* = comprimidos; *par jour* = por dia." },
          lines: [
            { speaker: "Farmacêutica", text: "Bonjour, je peux vous aider ?", gender: "f" },
            {
              speaker: "Cliente",
              text: "Bonjour, j'ai mal à la gorge. Vous avez quelque chose ?",
              gender: "m",
            },
            {
              speaker: "Farmacêutica",
              text: "Oui, ces comprimés. Trois fois par jour, pendant cinq jours. Si vous avez de la fièvre, allez chez le médecin.",
              gender: "f",
            },
          ],
          questions: [
            {
              prompt: { pt: "Quantas vezes por dia ele deve tomar o remédio?" },
              options: ["Três", "Duas", "Cinco"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Quando ele deve ir ao médico?" },
              options: ["Se tiver febre", "Depois de três dias", "Amanhã de manhã"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:un-medicament", "listening", 0.5),
            t("lex:avoir-de-la-fievre", "listening", 0.5),
          ],
        },
        {
          id: "a1-u7-l3-a4",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "une ordonnance", right: "uma receita médica" },
            { left: "un médicament", right: "um remédio" },
            { left: "je suis malade", right: "estou doente" },
          ],
          targets: [
            t("lex:une-ordonnance", "recognition"),
            t("lex:un-medicament", "recognition"),
            t("lex:je-suis-malade", "recognition"),
          ],
        },
        {
          id: "a1-u7-l3-a5",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Tenho uma receita." },
          accept: ["J'ai une ordonnance."],
          targets: [t("lex:une-ordonnance", "recall")],
        },
        {
          id: "a1-u7-l3-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Bonjour, j'ai mal à la gorge. Vous avez quelque chose ?",
          translation: "Bom dia, estou com dor de garganta. O senhor tem alguma coisa?",
          targets: [t("gram:avoir-mal-a", "speaking"), t("lex:la-gorge", "speaking", 0.5)],
        },
      ],
    },
  ],
};
