import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitQuotidien: UnitInput = {
  id: "fr-u1",
  level: "A0",
  track: "france",
  region: "fr-FR",
  title: { pt: "O dia a dia na França", fr: "Le quotidien en France" },
  canDo: {
    pt: "Comprar na boulangerie do começo ao fim e entender os nomes e horários das refeições na França.",
    fr: "Acheter à la boulangerie du début à la fin et comprendre les repas et leurs horaires en France.",
  },
  missionScenario: "scn-boulangerie",
  lessons: [
    {
      id: "fr-u1-l1",
      title: { pt: "Na boulangerie", fr: "À la boulangerie" },
      objective: {
        pt: "Pedir, responder ao “et avec ceci ?” e encerrar a compra.",
        fr: "Commander, répondre à « et avec ceci ? » et terminer l'achat.",
      },
      minutes: 7,
      steps: [
        {
          id: "fr-u1-l1-t1",
          type: "teach",
          title: { pt: "O ritual da boulangerie" },
          body: {
            pt: "Uma compra na boulangerie segue quase sempre o mesmo roteiro:\n\n1. Você entra dizendo *Bonjour !*\n2. Pede com *je voudrais…* ou *je vais prendre…* (“vou levar…”).\n3. A vendedora pergunta *Et avec ceci ?* — “E mais alguma coisa?”\n4. Você encerra com *Ce sera tout* (ou *C'est tout*), *merci*.",
          },
          examples: [
            {
              fr: "Je vais prendre une baguette, s'il vous plaît.",
              pt: "Vou levar uma baguete, por favor.",
            },
            { fr: "Et avec ceci ?", pt: "E mais alguma coisa?" },
            { fr: "Ce sera tout, merci.", pt: "É só isso, obrigado." },
          ],
          notes: [
            {
              kind: "france",
              text: {
                pt: "Pular o *bonjour* é visto como grosseria na França. Diga-o antes de qualquer pedido, até numa fila longa.",
              },
            },
          ],
          introduces: ["lex:je-vais-prendre", "lex:et-avec-ceci", "lex:ce-sera-tout"],
        },
        {
          id: "fr-u1-l1-t2",
          type: "teach",
          title: { pt: "O pão e os folhados" },
          body: {
            pt: "**Une baguette** é feminina: *une baguette*, *deux baguettes*.\n\n**Un pain au chocolat** é o folhado com chocolate dentro. No sudoeste da França ele se chama *une chocolatine* — e a discussão sobre o nome certo é eterna.",
          },
          examples: [
            { fr: "Une baguette, s'il vous plaît.", pt: "Uma baguete, por favor." },
            { fr: "Deux pains au chocolat.", pt: "Dois pains au chocolat." },
          ],
          introduces: ["lex:une-baguette", "lex:un-pain-au-chocolat"],
        },
        {
          id: "fr-u1-l1-a1",
          type: "choice",
          instruction: { pt: "O que a vendedora quer saber?" },
          prompt: {
            fr: "Et avec ceci ?",
            audio: { text: "Et avec ceci ?" },
          },
          options: ["Se você quer mais alguma coisa", "Como você vai pagar", "Se é para viagem"],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:et-avec-ceci", "recognition")],
        },
        {
          id: "fr-u1-l1-a2",
          type: "choice",
          instruction: say.situation,
          prompt: { pt: "Você já pediu tudo. Como encerra a compra?" },
          options: ["Ce sera tout, merci.", "Et avec ceci ?", "Je vais prendre."],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Essa é a pergunta da vendedora." },
            { pt: "*Je vais prendre…* é para pedir algo — falta o quê!" },
          ],
          targets: [t("lex:ce-sera-tout", "recognition")],
        },
        {
          id: "fr-u1-l1-a3",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Numa boulangerie de Lyon." },
          lines: [
            { speaker: "Vendedora", text: "Bonjour, monsieur !", gender: "f" },
            {
              speaker: "Cliente",
              text: "Bonjour ! Je vais prendre une baguette, s'il vous plaît.",
              gender: "m",
            },
            { speaker: "Vendedora", text: "Et avec ceci ?", gender: "f" },
            { speaker: "Cliente", text: "Deux pains au chocolat.", gender: "m" },
            { speaker: "Vendedora", text: "Ce sera tout ?", gender: "f" },
            { speaker: "Cliente", text: "Oui, ce sera tout, merci.", gender: "m" },
          ],
          questions: [
            {
              prompt: { pt: "O que o cliente compra?" },
              options: [
                "Uma baguete e dois pains au chocolat",
                "Duas baguetes e um croissant",
                "Uma baguete e dois croissants",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:une-baguette", "listening"),
            t("lex:un-pain-au-chocolat", "listening"),
            t("lex:et-avec-ceci", "listening"),
          ],
        },
        {
          id: "fr-u1-l1-a4",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "une baguette", right: "uma baguete" },
            { left: "un pain au chocolat", right: "um folhado com chocolate" },
            { left: "Et avec ceci ?", right: "E mais alguma coisa?" },
            { left: "Ce sera tout.", right: "É só isso." },
          ],
          targets: [
            t("lex:une-baguette", "recognition"),
            t("lex:un-pain-au-chocolat", "recognition"),
            t("lex:et-avec-ceci", "recognition", 0.5),
            t("lex:ce-sera-tout", "recognition", 0.5),
          ],
        },
        {
          id: "fr-u1-l1-a5",
          type: "order",
          instruction: say.order,
          tokens: ["Je", "vais", "prendre", "une", "baguette,", "s'il", "vous", "plaît."],
          translation: "Vou levar uma baguete, por favor.",
          targets: [t("lex:je-vais-prendre", "recall"), t("lex:une-baguette", "recall", 0.5)],
        },
        {
          id: "fr-u1-l1-a6",
          type: "type",
          instruction: say.write,
          prompt: { pt: "É só isso, obrigado." },
          accept: ["Ce sera tout, merci.", "C'est tout, merci."],
          targets: [t("lex:ce-sera-tout", "recall")],
        },
        {
          id: "fr-u1-l1-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Bonjour ! Je vais prendre un pain au chocolat, s'il vous plaît.",
          translation: "Bom dia! Vou levar um pain au chocolat, por favor.",
          targets: [
            t("lex:je-vais-prendre", "speaking"),
            t("lex:un-pain-au-chocolat", "speaking", 0.5),
          ],
        },
      ],
    },
    {
      id: "fr-u1-l2",
      title: { pt: "As refeições na França", fr: "Les repas en France" },
      objective: {
        pt: "Usar os nomes das refeições e entender os horários franceses.",
        fr: "Nommer les repas et comprendre les horaires français.",
      },
      minutes: 7,
      steps: [
        {
          id: "fr-u1-l2-t1",
          type: "teach",
          title: { pt: "Três refeições" },
          body: {
            pt: "Na França:\n\n**le petit-déjeuner** — o café da manhã\n**le déjeuner** — o almoço\n**le dîner** — o jantar\n\nOs verbos vêm junto: *déjeuner* (almoçar), *dîner* (jantar).",
          },
          examples: [
            { fr: "Le petit-déjeuner est à huit heures.", pt: "O café da manhã é às oito." },
            { fr: "On déjeune à midi et demi.", pt: "A gente almoça ao meio-dia e meia." },
            { fr: "Le dîner est prêt !", pt: "O jantar está pronto!" },
          ],
          notes: [
            {
              kind: "quebec",
              text: {
                pt: "No Québec é diferente: *le déjeuner* é o café da manhã, *le dîner* é o almoço e *le souper* é o jantar.",
              },
            },
          ],
          introduces: ["lex:le-petit-dejeuner", "lex:le-dejeuner-fr", "lex:le-diner-fr"],
        },
        {
          id: "fr-u1-l2-t2",
          type: "teach",
          title: { pt: "À table!" },
          body: {
            pt: "Antes de comer, deseja-se *Bon appétit !*.\n\nOs horários contam: o almoço costuma ser entre 12h e 14h, e muitos restaurantes só servem nesse intervalo. O jantar raramente começa antes das 19h30.\n\nO fim de semana, na França, é *le week-end*.",
          },
          examples: [
            { fr: "À table ! Bon appétit !", pt: "Para a mesa! Bom apetite!" },
            { fr: "Bon week-end !", pt: "Bom fim de semana!" },
          ],
          introduces: ["lex:bon-appetit", "cult:horaires-repas", "lex:le-week-end"],
        },
        {
          id: "fr-u1-l2-a1",
          type: "choice",
          instruction: say.meaning,
          prompt: { pt: "Na França, *le dîner* é…" },
          options: ["o jantar", "o almoço", "o café da manhã"],
          optionsLang: "pt",
          answer: 0,
          optionFeedback: [
            null,
            { pt: "No Québec, sim! Na França, o almoço é *le déjeuner*." },
            { pt: "O café da manhã é *le petit-déjeuner*." },
          ],
          targets: [t("lex:le-diner-fr", "recognition")],
        },
        {
          id: "fr-u1-l2-a2",
          type: "match",
          instruction: { pt: "Ligue os pares (como na França).", fr: "Associez (en France)." },
          pairs: [
            { left: "le petit-déjeuner", right: "o café da manhã" },
            { left: "le déjeuner", right: "o almoço" },
            { left: "le dîner", right: "o jantar" },
            { left: "le week-end", right: "o fim de semana" },
          ],
          targets: [
            t("lex:le-petit-dejeuner", "recognition"),
            t("lex:le-dejeuner-fr", "recognition"),
            t("lex:le-diner-fr", "recognition", 0.5),
            t("lex:le-week-end", "recognition"),
          ],
        },
        {
          id: "fr-u1-l2-a3",
          type: "choice",
          instruction: { pt: "O que provavelmente acontece?" },
          prompt: {
            pt: "Você chega às 15h30 a um restaurante tradicional em Lyon e pede o almoço.",
          },
          options: [
            "A cozinha já fechou: o almoço vai até umas 14h",
            "O serviço do almoço está começando",
            "Só servem café da manhã",
          ],
          optionsLang: "pt",
          answer: 0,
          targets: [t("cult:horaires-repas", "recognition")],
        },
        {
          id: "fr-u1-l2-a4",
          type: "listening",
          instruction: say.listen,
          context: {
            pt: "*samedi* = sábado; *dimanche soir* = domingo à noite; *ma grand-mère* = minha avó.",
          },
          lines: [
            { speaker: "Léa", text: "Tu fais quoi ce week-end ?", gender: "f" },
            {
              speaker: "Hugo",
              text: "Samedi, je déjeune chez ma grand-mère. Et dimanche soir, on dîne au restaurant.",
              gender: "m",
            },
          ],
          questions: [
            {
              prompt: { pt: "O que o Hugo faz no sábado?" },
              options: [
                "Almoça na casa da avó",
                "Janta na casa da avó",
                "Toma café da manhã num restaurante",
              ],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "E no domingo à noite?" },
              options: ["Janta num restaurante", "Almoça num restaurante", "Fica em casa"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:le-dejeuner-fr", "listening", 0.7),
            t("lex:le-diner-fr", "listening", 0.7),
            t("lex:le-week-end", "listening", 0.5),
          ],
        },
        {
          id: "fr-u1-l2-a5",
          type: "fill",
          instruction: say.complete,
          sentence: "On ___ à midi et on dîne à vingt heures.",
          blanks: [{ accept: ["déjeune"] }],
          wordBank: ["déjeune", "dîne", "soupe"],
          translation: "A gente almoça ao meio-dia e janta às oito da noite.",
          explanation: {
            pt: "*Souper* (jantar) é do Québec. Na França, ao meio-dia se *déjeune*.",
          },
          targets: [t("lex:le-dejeuner-fr", "recall", 0.7)],
        },
        {
          id: "fr-u1-l2-a6",
          type: "type",
          instruction: say.write,
          prompt: { pt: "o café da manhã (na França)" },
          accept: ["le petit-déjeuner", "le petit déjeuner"],
          targets: [t("lex:le-petit-dejeuner", "recall")],
        },
        {
          id: "fr-u1-l2-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Le dîner est prêt. Bon appétit !",
          translation: "O jantar está pronto. Bom apetite!",
          targets: [t("lex:bon-appetit", "speaking"), t("lex:le-diner-fr", "speaking", 0.5)],
        },
      ],
    },
  ],
};
