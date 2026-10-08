import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitPronoms: UnitInput = {
  id: "a2-u7",
  level: "A2",
  title: { pt: "Eu vi ele? Je l'ai vu!", fr: "Les pronoms compléments" },
  canDo: {
    pt: "Falar de pessoas e coisas sem repetir os nomes: je le connais, je lui ai téléphoné.",
    fr: "Utiliser les pronoms le, la, les, lui, leur.",
  },
  lessons: [
    {
      id: "a2-u7-l1",
      title: { pt: "Le, la, les", fr: "Le, la, les" },
      objective: {
        pt: "Usar os pronomes objeto direto antes do verbo.",
        fr: "Utiliser les pronoms COD.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u7-l1-t1",
          type: "teach",
          title: { pt: "“Vi ele” → je l'ai vu" },
          body: {
            pt: "Para não repetir quem ou o quê: **le** (o) · **la** (a) · **l'** (antes de vogal) · **les** (os, as).\n\nO pronome vem **antes do verbo**: *Tu connais Paulo ? — Oui, je **le** connais.*\nNo passé composé, antes do auxiliar: *Le film ? Je **l'**ai vu hier.*\n\nO “eu vi **ele**” do português não funciona em francês: nada de *j'ai vu lui*.",
          },
          examples: [
            {
              fr: "Tu connais Paulo ? — Oui, je le connais.",
              pt: "Você conhece o Paulo? — Conheço.",
            },
            { fr: "Mes clés ? Je ne les trouve pas.", pt: "Minhas chaves? Não acho." },
            { fr: "La série ? Je l'ai regardée hier.", pt: "A série? Vi ontem." },
          ],
          introduces: ["gram:pronoms-cod"],
        },
        {
          id: "a2-u7-l1-a1",
          type: "choice",
          instruction: { pt: "Responda sem repetir o nome." },
          prompt: { fr: "Tu vois Marie demain ?" },
          options: [
            "Oui, je la vois demain.",
            "Oui, je vois elle demain.",
            "Oui, je lui vois demain.",
          ],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Em francês o pronome objeto vem antes do verbo: *je la vois*." },
            { pt: "*Voir* não pede *à*: objeto direto, *la*." },
          ],
          targets: [t("gram:pronoms-cod", "recognition")],
        },
        {
          id: "a2-u7-l1-a2",
          type: "fill",
          instruction: say.complete,
          sentence: "Tu as tes billets ? — Oui, je ___ ai dans mon sac.",
          blanks: [{ accept: ["les"] }],
          translation: "Você está com as passagens? — Estou, na bolsa.",
          targets: [t("gram:pronoms-cod", "writing")],
        },
        {
          id: "a2-u7-l1-a3",
          type: "error_correction",
          instruction: say.fix,
          sentence: "J'ai vu lui hier au parc.",
          accept: ["Je l'ai vu hier au parc."],
          explanation: { pt: "O pronome vem antes do auxiliar: *je l'ai vu*." },
          targets: [t("gram:pronoms-cod", "writing")],
        },
        {
          id: "a2-u7-l1-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Conheço ela. (de forma correta em francês)" },
          accept: ["Je la connais."],
          targets: [t("gram:pronoms-cod", "writing")],
        },
        {
          id: "a2-u7-l1-a5",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Tu connais mon frère ?",
            audio: { text: "Tu connais mon frère ?", gender: "f" },
          },
          text: "Oui, je le connais.",
          accept: ["Oui, je le connais.", "Non, je ne le connais pas."],
          translation: "Conheço, sim. (ou: Não, não conheço.)",
          targets: [t("gram:pronoms-cod", "speaking")],
        },
      ],
    },
    {
      id: "a2-u7-l2",
      title: { pt: "Lui, leur", fr: "Lui, leur" },
      objective: {
        pt: "Usar lui e leur com os verbos que pedem à.",
        fr: "Utiliser les pronoms COI.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u7-l2-t1",
          type: "teach",
          title: { pt: "“Liguei pra ela” → je lui ai téléphoné" },
          body: {
            pt: "Verbos com **à** + pessoa — *parler à, téléphoner à, écrire à, demander à, donner à, répondre à, dire à* — usam:\n\n**lui** — para ele **ou** para ela\n**leur** — para eles / para elas\n\n*Tu as appelé ta mère ? — Oui, je **lui** ai téléphoné.*\n*Je **leur** écris tous les dimanches.*",
          },
          examples: [
            { fr: "Je lui ai téléphoné hier.", pt: "Liguei pra ele (ou pra ela) ontem." },
            { fr: "Qu'est-ce que tu leur as dit ?", pt: "O que você disse pra eles?" },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "*Lui* serve para homem **e** mulher quando há *à*: *je lui parle* (falo com ele / com ela).",
              },
            },
          ],
          introduces: ["gram:pronoms-coi"],
        },
        {
          id: "a2-u7-l2-a1",
          type: "choice",
          instruction: { pt: "le, la ou lui?" },
          prompt: { fr: "Tu parles à ta voisine ? — Oui, je ___ parle souvent." },
          options: ["lui", "la", "leur"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*Parler à* + pessoa: objeto indireto, *lui* (mesmo para mulher)." },
            { pt: "*Leur* é plural." },
          ],
          targets: [t("gram:pronoms-coi", "recognition")],
        },
        {
          id: "a2-u7-l2-a2",
          type: "choice",
          instruction: { pt: "le, la, les, lui ou leur?" },
          prompt: { fr: "Tes parents ? Je ___ écris chaque semaine." },
          options: ["leur", "les", "lui"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*Écrire à* + pessoa: indireto. Plural: *leur*." },
            { pt: "*lui* é singular." },
          ],
          targets: [
            t("gram:pronoms-coi", "recognition"),
            t("gram:pronoms-cod", "recognition", 0.5),
          ],
        },
        {
          id: "a2-u7-l2-a3",
          type: "error_correction",
          instruction: say.fix,
          sentence: "J'ai téléphoné à elle hier.",
          accept: ["Je lui ai téléphoné hier."],
          explanation: { pt: "*Téléphoner à* + pessoa → *lui*, antes do auxiliar." },
          targets: [t("gram:pronoms-coi", "writing")],
        },
        {
          id: "a2-u7-l2-a4",
          type: "listening",
          instruction: say.listen,
          lines: [
            {
              speaker: "Amiga",
              text: "Tu as dit à tes collègues que tu pars au Canada ?",
              gender: "f",
            },
            {
              speaker: "Rafael",
              text: "Oui, je leur ai dit hier. Et mon chef ? Je lui parle demain matin.",
              gender: "m",
            },
          ],
          questions: [
            {
              prompt: { pt: "Quando Rafael contou aos colegas?" },
              options: ["Ontem", "Amanhã de manhã", "Ainda não contou"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "E ao chefe?" },
              options: ["Vai falar amanhã de manhã", "Já contou ontem", "Não vai contar"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("gram:pronoms-coi", "recognition")],
        },
        {
          id: "a2-u7-l2-a5",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Escrevo pra eles todo domingo." },
          accept: ["Je leur écris tous les dimanches.", "Je leur écris chaque dimanche."],
          targets: [t("gram:pronoms-coi", "writing")],
        },
        {
          id: "a2-u7-l2-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Je lui ai téléphoné et je leur ai écrit.",
          translation: "Liguei pra ela e escrevi pra eles.",
          targets: [t("gram:pronoms-coi", "speaking")],
        },
      ],
    },
  ],
};
