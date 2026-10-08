import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitDiscours: UnitInput = {
  id: "b1-u4",
  level: "B1",
  title: { pt: "Ele disse que…", fr: "Il a dit que…" },
  canDo: {
    pt: "Relatar o que alguém disse ou perguntou — num recado, numa reunião, numa ligação.",
    fr: "Rapporter des paroles et des questions.",
  },
  lessons: [
    {
      id: "b1-u4-l1",
      title: { pt: "Dire que, demander si", fr: "Dire que, demander si" },
      objective: {
        pt: "Relatar afirmações e perguntas.",
        fr: "Rapporter des affirmations et des questions.",
      },
      minutes: 7,
      steps: [
        {
          id: "b1-u4-l1-t1",
          type: "teach",
          title: { pt: "Recados" },
          body: {
            pt: "**Afirmação** → **dire que**: *Le propriétaire dit **que** le loyer augmente.*\n**Pergunta sim/não** → **demander si**: *Elle demande **si** tu es disponible.*\n**Pergunta com palavra** → a palavra fica, sem *est-ce que*: *Il veut savoir **où** tu habites.*\n**Qu'est-ce que** → **ce que**: *Je ne sais pas **ce qu'**il veut.*",
          },
          examples: [
            { fr: "Le médecin dit que ce n'est pas grave.", pt: "O médico diz que não é grave." },
            {
              fr: "Elle demande si tu peux venir samedi.",
              pt: "Ela pergunta se você pode vir no sábado.",
            },
            { fr: "Je ne sais pas ce qu'il veut.", pt: "Não sei o que ele quer." },
          ],
          introduces: ["gram:discours-indirect"],
        },
        {
          id: "b1-u4-l1-a1",
          type: "choice",
          instruction: { pt: "Como relatar a pergunta?" },
          prompt: { fr: "« Est-ce que tu as un garant ? »" },
          options: [
            "Elle demande si j'ai un garant.",
            "Elle demande est-ce que j'ai un garant.",
            "Elle demande que j'ai un garant.",
          ],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "No indireto, *est-ce que* some: *si*." },
            { pt: "*Que* é para afirmações. Pergunta sim/não: *si*." },
          ],
          targets: [t("gram:discours-indirect", "recognition")],
        },
        {
          id: "b1-u4-l1-a2",
          type: "fill",
          instruction: say.complete,
          sentence: "Je ne sais pas ___ qu'il veut, ni ___ il arrive.",
          blanks: [{ accept: ["ce"] }, { accept: ["quand"] }],
          translation: "Não sei o que ele quer, nem quando ele chega.",
          targets: [t("gram:discours-indirect", "writing")],
        },
        {
          id: "b1-u4-l1-a3",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Je ne sais pas qu'est-ce que tu veux.",
          accept: ["Je ne sais pas ce que tu veux."],
          explanation: { pt: "No indireto: *ce que*." },
          targets: [t("gram:discours-indirect", "writing")],
        },
        {
          id: "b1-u4-l1-a4",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Elle demande si tu peux venir samedi et ce que tu veux manger.",
          translation: "Ela pergunta se você pode vir no sábado e o que você quer comer.",
          targets: [t("gram:discours-indirect", "speaking")],
        },
      ],
    },
    {
      id: "b1-u4-l2",
      title: { pt: "Il m'a dit qu'il était…", fr: "Il m'a dit qu'il était…" },
      objective: {
        pt: "Relatar no passado, com o imparfait.",
        fr: "Rapporter au passé.",
      },
      minutes: 7,
      steps: [
        {
          id: "b1-u4-l2-t1",
          type: "teach",
          title: { pt: "Quando o relato é no passado" },
          body: {
            pt: "Se o verbo que introduz está no passado (*il a dit*, *elle m'a demandé*), o presente da fala original vira ***imparfait*** — como em português:\n\n« Je **suis** fatigué. » → *Il a dit qu'il **était** fatigué.* (Ele disse que **estava** cansado.)\n« Tu **as** un garant ? » → *Elle m'a demandé si j'**avais** un garant.*",
          },
          examples: [
            { fr: "Il m'a dit qu'il était en retard.", pt: "Ele me disse que estava atrasado." },
            {
              fr: "Elle m'a demandé si j'avais un garant.",
              pt: "Ela me perguntou se eu tinha fiador.",
            },
          ],
          introduces: ["gram:discours-indirect"],
        },
        {
          id: "b1-u4-l2-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "« Je suis malade. » → Il m'a dit qu'il ___ malade." },
          options: ["était", "est", "sera"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Com *il m'a dit* no passado: *imparfait*, *était*." },
            { pt: "Aqui o relato é no passado: *était*." },
          ],
          targets: [t("gram:discours-indirect", "recognition")],
        },
        {
          id: "b1-u4-l2-a2",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Uma colega conta o que a chefe disse na reunião." },
          lines: [
            {
              speaker: "Sofia",
              text: "La directrice nous a dit que le bureau fermait à seize heures vendredi. Elle a aussi demandé si quelqu'un pouvait travailler samedi.",
              gender: "f",
            },
          ],
          questions: [
            {
              prompt: { pt: "O que a diretora anunciou?" },
              options: [
                "Que o escritório fecha às 16h na sexta",
                "Que o escritório abre no sábado",
                "Que haverá reunião na sexta",
              ],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que ela perguntou?" },
              options: [
                "Se alguém podia trabalhar no sábado",
                "Se todos estavam de acordo",
                "Quem queria folga",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("gram:discours-indirect", "recognition")],
        },
        {
          id: "b1-u4-l2-a3",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Ela me perguntou se eu tinha fiador." },
          accept: ["Elle m'a demandé si j'avais un garant."],
          targets: [t("gram:discours-indirect", "writing")],
        },
        {
          id: "b1-u4-l2-a4",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Il m'a dit qu'il était en retard et qu'il arrivait dans dix minutes.",
          translation: "Ele me disse que estava atrasado e que chegava em dez minutos.",
          targets: [t("gram:discours-indirect", "speaking")],
        },
      ],
    },
  ],
};
