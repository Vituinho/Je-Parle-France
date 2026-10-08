import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitYEn: UnitInput = {
  id: "a2-u4",
  level: "A2",
  title: { pt: "Y e en", fr: "Y et en" },
  canDo: {
    pt: "Responder sem repetir lugares e quantidades, como os nativos: j'y vais, j'en ai deux.",
    fr: "Répondre sans répéter les lieux et les quantités.",
  },
  lessons: [
    {
      id: "a2-u4-l1",
      title: { pt: "J'y vais", fr: "J'y vais" },
      objective: {
        pt: "Usar y para retomar um lugar.",
        fr: "Utiliser y pour un lieu.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u4-l1-t1",
          type: "teach",
          title: { pt: "y = lá" },
          body: {
            pt: "**y** retoma um lugar já mencionado, para não repeti-lo: *Tu vas **à la banque** ? — Oui, j'**y** vais.*\n\nEle vem **antes do verbo**: *j'y vais*, *tu y habites*.\nNa negação: *je **n'y** vais **pas***.\n\nE a expressão mais útil de todas: **On y va !** — Vamos!",
          },
          examples: [
            {
              fr: "Tu vas au marché ? — Oui, j'y vais samedi.",
              pt: "Você vai à feira? — Vou, no sábado.",
            },
            {
              fr: "Vous habitez à Québec ? — Oui, j'y habite depuis deux ans.",
              pt: "O senhor mora em Québec? — Moro, há dois anos.",
            },
            { fr: "Tout le monde est prêt ? On y va !", pt: "Todo mundo pronto? Vamos!" },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "Em português dizemos só “vou”. Em francês, *je vais* sozinho fica incompleto: *j'**y** vais*.",
              },
            },
          ],
          introduces: ["gram:pronom-y", "lex:on-y-va"],
        },
        {
          id: "a2-u4-l1-a1",
          type: "choice",
          instruction: { pt: "Como responder sem repetir o lugar?" },
          prompt: { fr: "Tu vas à la pharmacie ?" },
          options: ["Oui, j'y vais.", "Oui, je vais.", "Oui, je vais y."],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Falta retomar o lugar: *j'y vais*." },
            { pt: "*y* vem antes do verbo: *j'y vais*." },
          ],
          targets: [t("gram:pronom-y", "recognition")],
        },
        {
          id: "a2-u4-l1-a2",
          type: "fill",
          instruction: {
            pt: "Responda na negativa, sem repetir o lugar.",
            fr: "Répondez à la forme négative.",
          },
          sentence: "Tu vas au cinéma ce soir ? — Non, je n'___ vais pas.",
          blanks: [{ accept: ["y"] }],
          translation: "Você vai ao cinema hoje à noite? — Não, não vou.",
          targets: [t("gram:pronom-y", "writing")],
        },
        {
          id: "a2-u4-l1-a3",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Tu vas au parc ? — Oui, je vais y.",
          accept: ["Tu vas au parc ? — Oui, j'y vais."],
          explanation: { pt: "*y* vem antes do verbo: *j'y vais*." },
          targets: [t("gram:pronom-y", "writing")],
        },
        {
          id: "a2-u4-l1-a4",
          type: "choice",
          instruction: say.meaning,
          prompt: { fr: "On y va !" },
          options: ["Vamos!", "Chegamos!", "Fiquem aí!"],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:on-y-va", "recognition")],
        },
        {
          id: "a2-u4-l1-a5",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Tu vas au marché samedi ?",
            audio: { text: "Tu vas au marché samedi ?", gender: "f" },
          },
          text: "Oui, j'y vais samedi.",
          accept: ["Oui, j'y vais.", "Oui, j'y vais samedi.", "Non, je n'y vais pas."],
          translation: "Vou, sim, no sábado. (ou: Não, não vou.)",
          targets: [t("gram:pronom-y", "speaking")],
        },
      ],
    },
    {
      id: "a2-u4-l2",
      title: { pt: "J'en ai deux", fr: "J'en ai deux" },
      objective: {
        pt: "Usar en para retomar quantidades e partitivos.",
        fr: "Utiliser en pour les quantités.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u4-l2-t1",
          type: "teach",
          title: { pt: "en = disso, deles" },
          body: {
            pt: "**en** retoma um nome que vinha com *du, de la, des* ou uma quantidade:\n\n*Tu veux **du café** ? — Oui, j'**en** veux.*\n*Vous avez **des enfants** ? — Oui, j'**en** ai **deux**.*\n\nO número fica no fim: *j'en ai deux*, *j'en veux un kilo*. Na negação: *je **n'en** ai **pas***.",
          },
          examples: [
            { fr: "Tu veux du café ? — Oui, j'en veux bien.", pt: "Quer café? — Quero, sim." },
            {
              fr: "Vous avez des frères ? — J'en ai trois.",
              pt: "O senhor tem irmãos? — Tenho três.",
            },
            {
              fr: "Il y a encore du lait ? — Non, il n'y en a plus.",
              pt: "Ainda tem leite? — Não, acabou.",
            },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "“Tem filhos? — Tenho dois.” Em português o nome some. Em francês ele volta como **en**: *j'en ai deux*.",
              },
            },
          ],
          introduces: ["gram:pronom-en"],
        },
        {
          id: "a2-u4-l2-a1",
          type: "choice",
          instruction: { pt: "Qual resposta está completa?" },
          prompt: { fr: "Vous avez des enfants ?" },
          options: ["Oui, j'en ai deux.", "Oui, j'ai deux.", "Oui, j'y ai deux."],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Com quantidade, o francês retoma o nome com *en*: *j'en ai deux*." },
            { pt: "*y* é para lugares. Quantidade é *en*." },
          ],
          targets: [t("gram:pronom-en", "recognition")],
        },
        {
          id: "a2-u4-l2-a2",
          type: "choice",
          instruction: { pt: "y ou en?" },
          prompt: { fr: "Tu habites à Lyon ? — Oui, j'___ habite depuis un an." },
          options: ["y", "en"],
          answer: 0,
          optionFeedback: [null, { pt: "É um lugar (*à Lyon*): *y*." }],
          targets: [t("gram:pronom-y", "recognition"), t("gram:pronom-en", "recognition", 0.5)],
        },
        {
          id: "a2-u4-l2-a3",
          type: "fill",
          instruction: say.complete,
          sentence: "Tu veux des pommes ? — Oui, j'___ veux un kilo.",
          blanks: [{ accept: ["en"] }],
          translation: "Você quer maçãs? — Quero, um quilo.",
          targets: [t("gram:pronom-en", "writing")],
        },
        {
          id: "a2-u4-l2-a4",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Tu as des frères ? — Oui, j'ai trois.",
          accept: ["Tu as des frères ? — Oui, j'en ai trois."],
          explanation: { pt: "Com quantidade: *j'en ai trois*." },
          targets: [t("gram:pronom-en", "writing")],
        },
        {
          id: "a2-u4-l2-a5",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Na feira." },
          lines: [
            { speaker: "Feirante", text: "Vous voulez des tomates ?", gender: "m" },
            { speaker: "Cliente", text: "Oui, j'en veux un kilo. Et des fraises ?", gender: "f" },
            { speaker: "Feirante", text: "Désolé, il n'y en a plus aujourd'hui.", gender: "m" },
          ],
          questions: [
            {
              prompt: { pt: "O que acontece com os morangos?" },
              options: ["Acabaram", "Custam caro", "Estão verdes"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("gram:pronom-en", "recognition")],
        },
        {
          id: "a2-u4-l2-a6",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Vous avez des enfants ?",
            audio: { text: "Vous avez des enfants ?", gender: "f" },
          },
          text: "Oui, j'en ai deux.",
          accept: [
            "Oui, j'en ai un.",
            "Oui, j'en ai deux.",
            "Oui, j'en ai trois.",
            "Non, je n'en ai pas.",
          ],
          translation: "Tenho, dois. (ou a sua resposta)",
          targets: [t("gram:pronom-en", "speaking")],
        },
      ],
    },
  ],
};
