import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitVerbes: UnitInput = {
  id: "a1-u10",
  level: "A1",
  title: { pt: "Querer, poder, fazer, pegar", fr: "Vouloir, pouvoir, faire, prendre" },
  canDo: {
    pt: "Pedir permissão e favores, dizer o que você quer fazer e se virar quando não entende.",
    fr: "Demander une permission ou un service, dire ce qu'on veut faire et gérer l'incompréhension.",
  },
  lessons: [
    {
      id: "a1-u10-l1",
      title: { pt: "Je veux, je peux", fr: "Je veux, je peux" },
      objective: {
        pt: "Conjugar vouloir e pouvoir e usá-los com infinitivo.",
        fr: "Conjuguer vouloir et pouvoir.",
      },
      minutes: 7,
      steps: [
        {
          id: "a1-u10-l1-t1",
          type: "teach",
          title: { pt: "Querer e poder + verbo" },
          body: {
            pt: "**vouloir**: *je veux · tu veux · il veut · nous voulons · vous voulez · ils veulent*\n**pouvoir**: *je peux · tu peux · il peut · nous pouvons · vous pouvez · ils peuvent*\n\nDepois deles, o verbo fica no infinitivo — igual ao português: *je peux entrer ?* (posso entrar?).\n\nNum pedido, *je voudrais* é mais gentil que *je veux*.",
          },
          examples: [
            { fr: "Je peux payer par carte ?", pt: "Posso pagar com cartão?" },
            { fr: "Tu veux venir avec nous ?", pt: "Você quer vir com a gente?" },
            { fr: "Ils ne peuvent pas venir.", pt: "Eles não podem vir." },
          ],
          introduces: ["gram:vouloir-pouvoir"],
        },
        {
          id: "a1-u10-l1-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Nous ___ partir à huit heures." },
          options: ["pouvons", "peuvent", "pouvez", "peux"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*peuvent* é para *ils / elles*." },
            { pt: "*pouvez* é para *vous*." },
            { pt: "*peux* é para *je / tu*." },
          ],
          targets: [t("gram:vouloir-pouvoir", "recognition")],
        },
        {
          id: "a1-u10-l1-a2",
          type: "fill",
          instruction: say.complete,
          sentence: "Tu ___ un café ? — Oui, et je ___ payer.",
          blanks: [{ accept: ["veux"] }, { accept: ["peux"] }],
          translation: "Você quer um café? — Quero, e eu posso pagar.",
          targets: [t("gram:vouloir-pouvoir", "writing")],
        },
        {
          id: "a1-u10-l1-a3",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Je peux paye par carte ?",
          accept: ["Je peux payer par carte ?"],
          explanation: { pt: "Depois de *pouvoir*, o verbo fica no infinitivo: *payer*." },
          targets: [t("gram:vouloir-pouvoir", "writing")],
        },
        {
          id: "a1-u10-l1-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Posso entrar?" },
          accept: ["Je peux entrer ?"],
          targets: [t("gram:vouloir-pouvoir", "writing")],
        },
        {
          id: "a1-u10-l1-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Je peux payer par carte ? — Oui, bien sûr.",
          translation: "Posso pagar com cartão? — Sim, claro.",
          targets: [t("gram:vouloir-pouvoir", "speaking")],
        },
      ],
    },
    {
      id: "a1-u10-l2",
      title: { pt: "Pode repetir?", fr: "Pouvez-vous répéter ?" },
      objective: {
        pt: "Se virar quando não entende: pedir para repetir, falar mais devagar e perguntar palavras.",
        fr: "Gérer l'incompréhension.",
      },
      minutes: 6,
      steps: [
        {
          id: "a1-u10-l2-t1",
          type: "teach",
          title: { pt: "As frases que salvam" },
          body: {
            pt: "Ninguém entende tudo no começo — e tudo bem. Estas frases mantêm a conversa viva:\n\n*Pouvez-vous répéter, s'il vous plaît ?* — Pode repetir, por favor?\n*Vous pouvez parler plus lentement ?* — Pode falar mais devagar?\n*Je ne comprends pas.* — Não entendo.\n*Comment dit-on « saudade » en français ?* — Como se diz “saudade” em francês?",
          },
          examples: [
            {
              fr: "Pardon, pouvez-vous répéter, s'il vous plaît ?",
              pt: "Desculpe, pode repetir, por favor?",
            },
            { fr: "Désolé, je ne comprends pas.", pt: "Desculpe, não entendo." },
            { fr: "Comment dit-on « fila » en français ?", pt: "Como se diz “fila” em francês?" },
          ],
          notes: [
            {
              kind: "tip",
              text: {
                pt: "Usar estas frases em francês, em vez de mudar para o inglês, faz a pessoa simplificar — e você continua treinando.",
              },
            },
          ],
          introduces: ["lex:pouvez-vous-repeter", "lex:je-ne-comprends-pas", "lex:comment-dit-on"],
        },
        {
          id: "a1-u10-l2-a1",
          type: "choice",
          instruction: say.situation,
          prompt: { pt: "O atendente falou rápido demais e você não entendeu nada." },
          options: [
            "Pouvez-vous répéter, s'il vous plaît ?",
            "Comment dit-on « fila » en français ?",
            "Je peux payer par carte ?",
          ],
          answer: 0,
          targets: [t("lex:pouvez-vous-repeter", "recognition")],
        },
        {
          id: "a1-u10-l2-a2",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "Je ne comprends pas.", right: "Não entendo." },
            { left: "Pouvez-vous répéter ?", right: "Pode repetir?" },
            { left: "Comment dit-on… ?", right: "Como se diz…?" },
          ],
          targets: [
            t("lex:je-ne-comprends-pas", "recognition"),
            t("lex:pouvez-vous-repeter", "recognition"),
            t("lex:comment-dit-on", "recognition"),
          ],
        },
        {
          id: "a1-u10-l2-a3",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Não entendo." },
          accept: ["Je ne comprends pas."],
          targets: [t("lex:je-ne-comprends-pas", "recall")],
        },
        {
          id: "a1-u10-l2-a4",
          type: "order",
          instruction: say.order,
          tokens: ["Vous", "pouvez", "parler", "plus", "lentement ?"],
          translation: "O senhor pode falar mais devagar?",
          targets: [t("gram:vouloir-pouvoir", "writing", 0.7)],
        },
        {
          id: "a1-u10-l2-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Pardon, je ne comprends pas. Pouvez-vous répéter, s'il vous plaît ?",
          translation: "Desculpe, não entendo. Pode repetir, por favor?",
          targets: [
            t("lex:pouvez-vous-repeter", "speaking"),
            t("lex:je-ne-comprends-pas", "speaking"),
          ],
        },
      ],
    },
    {
      id: "a1-u10-l3",
      title: { pt: "Faire e prendre", fr: "Faire et prendre" },
      objective: {
        pt: "Usar faire e prendre nas combinações do dia a dia.",
        fr: "Utiliser faire et prendre au quotidien.",
      },
      minutes: 7,
      steps: [
        {
          id: "a1-u10-l3-t1",
          type: "teach",
          title: { pt: "Fazer e pegar" },
          body: {
            pt: "**faire**: *je fais · tu fais · il fait · nous faisons · vous faites · ils font*\n**prendre**: *je prends · tu prends · il prend · nous prenons · vous prenez · ils prennent*\n\nCombinações para guardar inteiras:\n*faire les courses* — fazer as compras · *faire du sport* — fazer exercício\n*prendre le bus / le métro* — pegar o ônibus / o metrô · *prendre un café* — tomar um café",
          },
          examples: [
            { fr: "Je fais les courses le samedi.", pt: "Faço as compras no sábado." },
            { fr: "Vous faites du sport ?", pt: "O senhor pratica esporte?" },
            { fr: "Je prends le bus à huit heures.", pt: "Pego o ônibus às oito." },
          ],
          notes: [
            {
              kind: "quebec",
              text: {
                pt: "No Québec: *faire l'épicerie* (fazer as compras) e *prendre l'autobus* (pegar o ônibus).",
              },
            },
          ],
          introduces: [
            "gram:faire-prendre",
            "lex:faire-les-courses",
            "lex:prendre-le-bus",
            "lex:faire-du-sport",
          ],
        },
        {
          id: "a1-u10-l3-a1",
          type: "choice",
          instruction: { pt: "Como se diz “Pego o metrô”?" },
          prompt: { pt: "Você conta como vai ao trabalho." },
          options: ["Je prends le métro.", "J'attrape le métro.", "Je fais le métro."],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "“Pegar” um transporte é *prendre*." },
            { pt: "Para transporte, *prendre*." },
          ],
          targets: [
            t("lex:prendre-le-bus", "recognition"),
            t("gram:faire-prendre", "recognition", 0.5),
          ],
        },
        {
          id: "a1-u10-l3-a2",
          type: "fill",
          instruction: say.complete,
          sentence: "Vous ___ du sport ? — Oui, et le samedi nous ___ les courses.",
          blanks: [{ accept: ["faites"] }, { accept: ["faisons"] }],
          translation: "Vocês praticam esporte? — Sim, e no sábado fazemos as compras.",
          targets: [t("gram:faire-prendre", "writing")],
        },
        {
          id: "a1-u10-l3-a3",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Ils prendent le bus.",
          accept: ["Ils prennent le bus."],
          explanation: { pt: "Com *ils*: *prennent*, com dois *n*." },
          targets: [t("gram:faire-prendre", "writing")],
        },
        {
          id: "a1-u10-l3-a4",
          type: "listening",
          instruction: say.listen,
          lines: [
            { speaker: "Colega", text: "Tu viens comment au bureau ?", gender: "f" },
            {
              speaker: "Rafael",
              text: "Je prends le métro. Et le soir, je fais du sport au parc.",
              gender: "m",
            },
          ],
          questions: [
            {
              prompt: { pt: "Como Rafael vai ao escritório?" },
              options: ["De metrô", "De ônibus", "A pé"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que ele faz à noite?" },
              options: ["Exercício no parque", "Compras no mercado", "Um curso de francês"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:prendre-le-bus", "listening"), t("lex:faire-du-sport", "listening")],
        },
        {
          id: "a1-u10-l3-a5",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Faço as compras no sábado." },
          accept: ["Je fais les courses le samedi.", "Samedi, je fais les courses."],
          targets: [t("lex:faire-les-courses", "recall")],
        },
        {
          id: "a1-u10-l3-a6",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Vous faites du sport ?",
            audio: { text: "Vous faites du sport ?", gender: "m" },
          },
          text: "Oui, je fais du sport le week-end.",
          accept: [
            "Oui, je fais du sport.",
            "Oui, je fais du sport le week-end.",
            "Non, je ne fais pas de sport.",
          ],
          translation: "Sim, faço esporte no fim de semana. (ou a sua resposta)",
          targets: [t("lex:faire-du-sport", "speaking"), t("gram:faire-prendre", "speaking", 0.5)],
        },
      ],
    },
  ],
};
