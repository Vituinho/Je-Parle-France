import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitCafe: UnitInput = {
  id: "a0-u4",
  level: "A0",
  title: { pt: "No café", fr: "Au café" },
  canDo: {
    pt: "Entrar num café, pedir algo para comer ou beber, perguntar o preço e pagar — em Paris ou em Montréal.",
    fr: "Commander dans un café, demander le prix et payer, à Paris ou à Montréal.",
  },
  missionScenario: "scn-cafe-paris",
  lessons: [
    {
      id: "a0-u4-l1",
      title: { pt: "Je voudrais un café", fr: "Je voudrais un café" },
      objective: { pt: "Pedir com educação.", fr: "Commander poliment." },
      minutes: 7,
      steps: [
        {
          id: "a0-u4-l1-t1",
          type: "teach",
          title: { pt: "Je voudrais…" },
          body: {
            pt: "Para pedir com educação, use *je voudrais* + o que você quer + *s'il vous plaît*.\n\nÉ como o nosso “eu queria” — muito mais simpático do que *je veux* (“eu quero”).",
          },
          examples: [
            { fr: "Je voudrais un café, s'il vous plaît.", pt: "Eu queria um café, por favor." },
            { fr: "Je voudrais de l'eau.", pt: "Eu queria água." },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "*Je veux un café* não é errado, mas soa exigente numa loja ou num café. Prefira *je voudrais*.",
              },
            },
          ],
          introduces: ["lex:je-voudrais"],
        },
        {
          id: "a0-u4-l1-t2",
          type: "teach",
          title: { pt: "No balcão" },
          body: {
            pt: "Aprenda cada palavra **com o artigo**, porque em francês todo substantivo tem gênero: *un café* (masculino), *une bière* (feminino).\n\nPara água, diz-se *de l'eau* (“um pouco de água”).",
          },
          examples: [
            { fr: "un café", pt: "um café" },
            { fr: "un thé", pt: "um chá" },
            { fr: "un croissant", pt: "um croissant" },
            { fr: "de l'eau", pt: "água" },
          ],
          notes: [
            {
              kind: "france",
              text: {
                pt: "Na França, *un café* é um expresso pequeno. Para algo maior, peça *un café allongé* ou *un café crème*.",
              },
            },
          ],
          introduces: [
            "lex:un-cafe",
            "lex:un-the",
            "lex:un-croissant",
            "lex:de-l-eau",
            "gram:articles-indefinis",
          ],
        },
        {
          id: "a0-u4-l1-a1",
          type: "choice",
          instruction: { pt: "Qual é o jeito mais educado de pedir?" },
          prompt: { pt: "Você quer um café." },
          options: ["Je voudrais un café, s'il vous plaît.", "Je veux un café.", "Un café !"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*Je veux* soa como uma exigência. *Je voudrais* é mais educado." },
            { pt: "Falta o *s'il vous plaît* — e um *bonjour* antes!" },
          ],
          targets: [t("lex:je-voudrais", "recognition")],
        },
        {
          id: "a0-u4-l1-a2",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Je voudrais ___ croissant, s'il vous plaît." },
          options: ["un", "une"],
          answer: 0,
          optionFeedback: [null, { pt: "*Croissant* é masculino: *un croissant*." }],
          targets: [
            t("gram:articles-indefinis", "recognition"),
            t("lex:un-croissant", "recognition", 0.5),
          ],
        },
        {
          id: "a0-u4-l1-a3",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "un café", right: "um café" },
            { left: "un thé", right: "um chá" },
            { left: "de l'eau", right: "água" },
            { left: "je voudrais", right: "eu queria" },
          ],
          targets: [
            t("lex:un-cafe", "recognition"),
            t("lex:un-the", "recognition"),
            t("lex:de-l-eau", "recognition"),
            t("lex:je-voudrais", "recognition", 0.5),
          ],
        },
        {
          id: "a0-u4-l1-a4",
          type: "listening",
          instruction: say.listen,
          lines: [
            {
              speaker: "Garçom",
              text: "Bonjour, madame. Qu'est-ce que vous prenez ?",
              gender: "m",
            },
            {
              speaker: "Cliente",
              text: "Bonjour ! Je voudrais un thé et un croissant, s'il vous plaît.",
              gender: "f",
            },
          ],
          questions: [
            {
              prompt: { pt: "O que ela pede?" },
              options: ["Um chá e um croissant", "Um café e um croissant", "Um chá e água"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:un-the", "listening"), t("lex:je-voudrais", "listening")],
        },
        {
          id: "a0-u4-l1-a5",
          type: "order",
          instruction: say.order,
          tokens: ["Je", "voudrais", "un", "café,", "s'il", "vous", "plaît."],
          translation: "Eu queria um café, por favor.",
          targets: [t("lex:je-voudrais", "recall"), t("lex:un-cafe", "recall", 0.5)],
        },
        {
          id: "a0-u4-l1-a6",
          type: "type",
          instruction: { pt: "Peça um chá, com educação.", fr: "Commandez un thé, poliment." },
          prompt: { pt: "Eu queria um chá, por favor." },
          accept: ["Je voudrais un thé, s'il vous plaît.", "Je voudrais un thé, s'il vous plait."],
          targets: [t("lex:je-voudrais", "recall"), t("lex:un-the", "recall")],
        },
        {
          id: "a0-u4-l1-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Je voudrais un café et de l'eau, s'il vous plaît.",
          translation: "Eu queria um café e água, por favor.",
          targets: [t("lex:je-voudrais", "speaking"), t("lex:de-l-eau", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "a0-u4-l2",
      title: { pt: "C'est combien?", fr: "C'est combien ?" },
      objective: { pt: "Perguntar e entender preços.", fr: "Demander et comprendre un prix." },
      minutes: 6,
      steps: [
        {
          id: "a0-u4-l2-t1",
          type: "teach",
          title: { pt: "Quanto é?" },
          body: {
            pt: "Para perguntar o preço: *C'est combien ?* ou *Ça fait combien ?*\n\nA resposta: *Ça fait quatre euros.* Os centavos vêm logo depois: *deux euros cinquante* = 2,50 €.",
          },
          examples: [
            { fr: "Le croissant, c'est combien ?", pt: "Quanto é o croissant?" },
            { fr: "Ça fait deux euros cinquante.", pt: "Dá dois euros e cinquenta." },
            { fr: "Ça fait dix dollars.", pt: "Dá dez dólares." },
          ],
          notes: [
            {
              kind: "tip",
              text: {
                pt: "Atenção à ligação: *deux euros* soa “dø-zøro”, *trois euros* soa “trwa-zøro”. No Canadá a moeda é o *dollar*.",
              },
            },
          ],
          introduces: ["lex:c-est-combien", "lex:euro"],
        },
        {
          id: "a0-u4-l2-a1",
          type: "choice",
          instruction: say.listenChoose,
          prompt: { audio: { text: "Ça fait trois euros." }, hideText: true },
          options: ["3 €", "13 €", "30 €", "2 €"],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:euro", "listening"), t("lex:nombres-0-10", "listening", 0.5)],
        },
        {
          id: "a0-u4-l2-a2",
          type: "choice",
          instruction: say.listenChoose,
          prompt: { audio: { text: "Ça fait douze euros." }, hideText: true },
          options: ["12 €", "2 €", "20 €", "10 €"],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:euro", "listening"), t("lex:nombres-11-20", "listening", 0.5)],
        },
        {
          id: "a0-u4-l2-a3",
          type: "fill",
          instruction: say.complete,
          sentence: "Le thé, c'est ___ ?",
          blanks: [{ accept: ["combien"] }],
          translation: "Quanto é o chá?",
          targets: [t("lex:c-est-combien", "recall")],
        },
        {
          id: "a0-u4-l2-a4",
          type: "listening",
          instruction: say.listen,
          lines: [
            { speaker: "Cliente", text: "Un croissant et un café, ça fait combien ?", gender: "m" },
            { speaker: "Vendedora", text: "Ça fait quatre euros vingt.", gender: "f" },
          ],
          questions: [
            {
              prompt: { pt: "Quanto ele vai pagar?" },
              options: ["4,20 €", "4,02 €", "20,40 €", "2,40 €"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:c-est-combien", "listening"), t("lex:euro", "listening", 0.5)],
        },
        {
          id: "a0-u4-l2-a5",
          type: "type",
          instruction: { pt: "Pergunte o preço.", fr: "Demandez le prix." },
          prompt: { pt: "Quanto é?" },
          accept: [
            "C'est combien ?",
            "Ça fait combien ?",
            "Ça coûte combien ?",
            "Combien ça coûte ?",
          ],
          targets: [t("lex:c-est-combien", "recall")],
        },
        {
          id: "a0-u4-l2-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Ça fait combien ? — Deux euros cinquante.",
          translation: "Quanto dá? — Dois euros e cinquenta.",
          targets: [t("lex:c-est-combien", "speaking"), t("lex:euro", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "a0-u4-l3",
      title: { pt: "Pagar e ir embora", fr: "Payer et partir" },
      objective: {
        pt: "Pedir a conta, escolher como pagar e dizer se é para levar.",
        fr: "Demander l'addition, choisir comment payer et dire si c'est pour emporter.",
      },
      minutes: 7,
      steps: [
        {
          id: "a0-u4-l3-t1",
          type: "teach",
          title: { pt: "A conta, por favor" },
          body: {
            pt: "No restaurante: *L'addition, s'il vous plaît.*\n\nNo café ou na padaria, perguntam: *Sur place ou à emporter ?* — para comer aqui ou levar?\n\nNa hora de pagar: *par carte* (no cartão) ou *en espèces* (em dinheiro).",
          },
          examples: [
            { fr: "L'addition, s'il vous plaît.", pt: "A conta, por favor." },
            { fr: "Sur place ou à emporter ?", pt: "Para comer aqui ou para levar?" },
            { fr: "Je peux payer par carte ?", pt: "Posso pagar no cartão?" },
          ],
          notes: [
            {
              kind: "quebec",
              text: {
                pt: "No Québec você vai ouvir *pour ici ou pour emporter ?*, e a conta do restaurante também se chama *la facture*.",
              },
            },
          ],
          introduces: [
            "lex:l-addition",
            "lex:par-carte",
            "lex:en-especes",
            "lex:sur-place-ou-a-emporter",
          ],
        },
        {
          id: "a0-u4-l3-a1",
          type: "choice",
          instruction: { pt: "O que o atendente pergunta?" },
          prompt: { fr: "Sur place ou à emporter ?", audio: { text: "Sur place ou à emporter ?" } },
          options: [
            "Para comer aqui ou para levar?",
            "Quer pagar no cartão?",
            "Quer mais alguma coisa?",
          ],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:sur-place-ou-a-emporter", "recognition")],
        },
        {
          id: "a0-u4-l3-a2",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "l'addition", right: "a conta" },
            { left: "par carte", right: "no cartão" },
            { left: "en espèces", right: "em dinheiro" },
            { left: "à emporter", right: "para levar" },
          ],
          targets: [
            t("lex:l-addition", "recognition"),
            t("lex:par-carte", "recognition"),
            t("lex:en-especes", "recognition"),
            t("lex:sur-place-ou-a-emporter", "recognition", 0.5),
          ],
        },
        {
          id: "a0-u4-l3-a3",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Num café em Montréal." },
          lines: [
            {
              speaker: "Barista",
              text: "Bonjour ! Pour ici ou pour emporter ?",
              gender: "m",
              region: "fr-CA",
            },
            {
              speaker: "Cliente",
              text: "Pour emporter, s'il vous plaît. Je peux payer par carte ?",
              gender: "f",
              region: "fr-CA",
            },
            { speaker: "Barista", text: "Oui, bien sûr !", gender: "m", region: "fr-CA" },
          ],
          questions: [
            {
              prompt: { pt: "Onde a cliente vai tomar o café?" },
              options: ["Vai levar", "No próprio café"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Como ela vai pagar?" },
              options: ["No cartão", "Em dinheiro"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:sur-place-ou-a-emporter", "listening"), t("lex:par-carte", "listening")],
        },
        {
          id: "a0-u4-l3-a4",
          type: "type",
          instruction: { pt: "Peça a conta no restaurante.", fr: "Demandez l'addition." },
          prompt: { pt: "A conta, por favor." },
          accept: [
            "L'addition, s'il vous plaît.",
            "L'addition, s'il vous plait.",
            "Je voudrais l'addition, s'il vous plaît.",
          ],
          targets: [t("lex:l-addition", "recall")],
        },
        {
          id: "a0-u4-l3-a5",
          type: "choice",
          instruction: { pt: "No Québec, como também se chama a conta do restaurante?" },
          prompt: { pt: "a conta (Québec)" },
          options: ["la facture", "la carte", "le reçu"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*La carte* é o cardápio (ou o cartão)." },
            { pt: "*Le reçu* é o recibo." },
          ],
          targets: [t("lex:l-addition", "recognition", 0.5)],
        },
        {
          id: "a0-u4-l3-a6",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: { fr: "Vous payez comment ?", audio: { text: "Vous payez comment ?" } },
          text: "Par carte, s'il vous plaît.",
          accept: ["Par carte, s'il vous plaît.", "En espèces, s'il vous plaît."],
          translation: "Responda: no cartão ou em dinheiro.",
          targets: [t("lex:par-carte", "speaking"), t("lex:en-especes", "speaking", 0.5)],
        },
      ],
    },
  ],
};
