import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitProjets: UnitInput = {
  id: "a1-u5",
  level: "A1",
  title: { pt: "Perguntas e planos", fr: "Questions et projets" },
  canDo: {
    pt: "Fazer perguntas do dia a dia, dizer aonde você vai e contar seus planos para os próximos dias.",
    fr: "Poser des questions simples, dire où vous allez et parler de vos projets.",
  },
  missionScenario: "scn-weekend-plans",
  lessons: [
    {
      id: "a1-u5-l1",
      title: { pt: "Est-ce que…?", fr: "Est-ce que… ?" },
      objective: {
        pt: "Fazer perguntas pela entonação, com est-ce que e com as palavras interrogativas.",
        fr: "Poser des questions avec l'intonation, est-ce que et les mots interrogatifs.",
      },
      minutes: 7,
      steps: [
        {
          id: "a1-u5-l1-t1",
          type: "teach",
          title: { pt: "Três jeitos de perguntar" },
          body: {
            pt: "**Entonação** (o mais comum na conversa): *Tu parles anglais ?*\n**Est-ce que** + frase (serve sempre): *Est-ce que tu parles anglais ?*\n**Inversão** (formal, escrita): *Parlez-vous anglais ?* — só para reconhecer, por enquanto.",
          },
          examples: [
            { fr: "Tu as faim ?", pt: "Você está com fome?" },
            {
              fr: "Est-ce que vous avez une table pour deux ?",
              pt: "O senhor tem uma mesa para dois?",
            },
            { fr: "Parlez-vous portugais ?", pt: "O senhor fala português?" },
          ],
          introduces: ["gram:questions"],
        },
        {
          id: "a1-u5-l1-t2",
          type: "teach",
          title: { pt: "Onde, quando, como, por quê, quem" },
          body: {
            pt: "**où** (onde) · **quand** (quando) · **comment** (como) · **pourquoi** (por quê) → **parce que** (porque) · **qui** (quem)\n\nCom *est-ce que*, a palavra interrogativa vem **antes**: *Où est-ce que tu habites ?* Na fala informal, ela também pode ir para o fim: *Tu habites où ?*",
          },
          examples: [
            { fr: "Où est-ce que tu travailles ?", pt: "Onde você trabalha?" },
            { fr: "Tu pars quand ?", pt: "Você viaja quando?" },
            {
              fr: "Pourquoi ? — Parce que j'ai un rendez-vous.",
              pt: "Por quê? — Porque tenho um compromisso.",
            },
            { fr: "Qui est-ce ?", pt: "Quem é?" },
          ],
          notes: [
            {
              kind: "tip",
              text: { pt: "*Où* (onde) tem acento; *ou* (ou) não tem." },
            },
          ],
          introduces: ["lex:ou", "lex:quand", "lex:comment", "lex:pourquoi-parce-que", "lex:qui"],
        },
        {
          id: "a1-u5-l1-a1",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "où", right: "onde" },
            { left: "quand", right: "quando" },
            { left: "comment", right: "como" },
            { left: "qui", right: "quem" },
            { left: "pourquoi", right: "por quê" },
          ],
          targets: [
            t("lex:ou", "recognition"),
            t("lex:quand", "recognition"),
            t("lex:comment", "recognition"),
            t("lex:qui", "recognition"),
            t("lex:pourquoi-parce-que", "recognition"),
          ],
        },
        {
          id: "a1-u5-l1-a2",
          type: "choice",
          instruction: { pt: "Qual pergunta está correta?" },
          prompt: { pt: "Onde você mora?" },
          options: [
            "Où est-ce que tu habites ?",
            "Est-ce que tu habites où ?",
            "Où tu est-ce que habites ?",
          ],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Com *est-ce que*, a palavra interrogativa vem antes: *Où est-ce que…*" },
            { pt: "*Est-ce que* vem logo depois de *où*, antes do sujeito." },
          ],
          targets: [t("gram:questions", "recognition")],
        },
        {
          id: "a1-u5-l1-a3",
          type: "listening",
          instruction: say.listen,
          context: {
            pt: "Uma colega faz perguntas no primeiro dia de trabalho. *depuis* = desde, há.",
          },
          lines: [
            { speaker: "Nadia", text: "Tu viens d'où ?", gender: "f" },
            { speaker: "Bruno", text: "Du Brésil, de Recife.", gender: "m" },
            { speaker: "Nadia", text: "Et pourquoi la France ?", gender: "f" },
            {
              speaker: "Bruno",
              text: "Parce que ma femme est française. Nous habitons à Lyon depuis deux mois.",
              gender: "m",
            },
          ],
          questions: [
            {
              prompt: { pt: "Por que Bruno está na França?" },
              options: ["Porque a esposa dele é francesa", "Por causa do trabalho", "Para estudar"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:pourquoi-parce-que", "listening"),
            t("gram:questions", "recognition", 0.5),
          ],
        },
        {
          id: "a1-u5-l1-a4",
          type: "fill",
          instruction: say.complete,
          sentence: "___ est-ce que tu arrives ? — Demain matin.",
          blanks: [{ accept: ["Quand", "quand"] }],
          wordBank: ["Quand", "Où", "Qui"],
          translation: "Quando você chega? — Amanhã de manhã.",
          targets: [t("lex:quand", "recall"), t("gram:questions", "writing", 0.5)],
        },
        {
          id: "a1-u5-l1-a5",
          type: "type",
          instruction: { pt: "Pergunte com est-ce que.", fr: "Posez la question avec est-ce que." },
          prompt: { pt: "Você fala inglês? (informal)" },
          accept: ["Est-ce que tu parles anglais ?"],
          targets: [t("gram:questions", "writing")],
        },
        {
          id: "a1-u5-l1-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Pourquoi tu apprends le français ? — Parce que je vais habiter à Montréal.",
          translation: "Por que você aprende francês? — Porque vou morar em Montréal.",
          targets: [t("lex:pourquoi-parce-que", "speaking"), t("gram:questions", "speaking")],
        },
      ],
    },
    {
      id: "a1-u5-l2",
      title: { pt: "Je vais, tu vas…", fr: "Je vais, tu vas…" },
      objective: {
        pt: "Conjugar aller e dizer aonde você vai.",
        fr: "Conjuguer aller et dire où vous allez.",
      },
      minutes: 7,
      steps: [
        {
          id: "a1-u5-l2-t1",
          type: "teach",
          title: { pt: "Aller: ir" },
          body: {
            pt: "*je vais* · *tu vas* · *il / elle / on va*\n*nous allons* · *vous allez* · *ils / elles vont*\n\nCom lugares: *au* parc, *à la* gare, *à l'*école, *aux* toilettes. Com cidades, *à*: *à Toronto*. Com países: *en* France (feminino), *au* Canada, *au* Brésil (masculinos).",
          },
          examples: [
            { fr: "Je vais à la pharmacie.", pt: "Vou à farmácia." },
            { fr: "On va au parc ?", pt: "Vamos ao parque?" },
            { fr: "Ils vont au Canada en août.", pt: "Eles vão ao Canadá em agosto." },
          ],
          notes: [
            {
              kind: "tip",
              text: {
                pt: "Cuidado com o som: *ils vont* (/il vɔ̃/, eles vão) e *ils ont* (/il.z‿ɔ̃/, eles têm).",
              },
            },
          ],
          introduces: ["gram:aller-present"],
        },
        {
          id: "a1-u5-l2-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Nous ___ à la banque." },
          options: ["allons", "vont", "allez", "vais"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*vont* é para *ils / elles*." },
            { pt: "*allez* é para *vous*." },
            { pt: "*vais* é para *je*." },
          ],
          targets: [t("gram:aller-present", "recognition")],
        },
        {
          id: "a1-u5-l2-a2",
          type: "minimal_pair",
          instruction: { pt: "Qual você ouviu: “eles vão” ou “eles têm”?" },
          pair: [
            { word: "ils vont", ipa: "/il vɔ̃/", pt: "eles vão" },
            { word: "ils ont", ipa: "/il.z‿ɔ̃/", pt: "eles têm" },
          ],
          answer: 0,
          targets: [t("gram:aller-present", "recognition", 0.7)],
        },
        {
          id: "a1-u5-l2-a3",
          type: "fill",
          instruction: say.complete,
          sentence: "Je vais ___ parc et elle va ___ gare.",
          blanks: [{ accept: ["au"] }, { accept: ["à la"] }],
          translation: "Eu vou ao parque e ela vai à estação.",
          targets: [
            t("gram:aller-present", "writing"),
            t("gram:contractions-a-de", "writing", 0.5),
          ],
        },
        {
          id: "a1-u5-l2-a4",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Nous vont à l'école.",
          accept: ["Nous allons à l'école."],
          explanation: { pt: "Com *nous*: *allons*." },
          targets: [t("gram:aller-present", "writing")],
        },
        {
          id: "a1-u5-l2-a5",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Vocês vão ao Canadá? (formal)" },
          accept: ["Vous allez au Canada ?"],
          targets: [t("gram:aller-present", "writing")],
        },
        {
          id: "a1-u5-l2-a6",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: { fr: "Tu vas où ?", audio: { text: "Tu vas où ?", gender: "f" } },
          text: "Je vais à la pharmacie.",
          accept: [
            "Je vais à la pharmacie.",
            "Je vais au parc.",
            "Je vais à la banque.",
            "Je vais à la gare.",
            "Je vais à l'école.",
            "Je vais au travail.",
          ],
          translation: "Vou à farmácia. (ou aonde você vai)",
          targets: [t("gram:aller-present", "speaking")],
        },
      ],
    },
    {
      id: "a1-u5-l3",
      title: { pt: "Demain, je vais…", fr: "Demain, je vais…" },
      objective: {
        pt: "Falar dos seus planos com o futuro próximo.",
        fr: "Parler de ses projets avec le futur proche.",
      },
      minutes: 7,
      steps: [
        {
          id: "a1-u5-l3-t1",
          type: "teach",
          title: { pt: "Vou + verbo: igual ao português" },
          body: {
            pt: "**aller** + **infinitivo** = futuro próximo, exatamente como “vou + verbo”:\n\n*Je vais travailler.* — Vou trabalhar.\n*On va manger au restaurant.* — A gente vai comer no restaurante.\n\nNa negação, *ne… pas* abraça o *aller*: *Je **ne** vais **pas** travailler.*\n\nMarcadores de tempo: **demain** (amanhã) · **ce soir** (hoje à noite) · **la semaine prochaine** (semana que vem).",
          },
          examples: [
            { fr: "Demain, je vais travailler.", pt: "Amanhã vou trabalhar." },
            { fr: "Ce soir, on va au cinéma.", pt: "Hoje à noite a gente vai ao cinema." },
            {
              fr: "Je ne vais pas partir la semaine prochaine.",
              pt: "Não vou viajar semana que vem.",
            },
          ],
          introduces: [
            "gram:futur-proche",
            "lex:demain",
            "lex:ce-soir",
            "lex:la-semaine-prochaine",
          ],
        },
        {
          id: "a1-u5-l3-a1",
          type: "choice",
          instruction: { pt: "Qual frase está correta?" },
          prompt: { pt: "Amanhã vou trabalhar." },
          options: [
            "Demain, je vais travailler.",
            "Demain, je vais travaille.",
            "Demain, je travailler.",
          ],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Depois de *aller*, o verbo fica no infinitivo: *travailler*." },
            { pt: "Falta o *aller*: *je vais travailler*." },
          ],
          targets: [t("gram:futur-proche", "recognition")],
        },
        {
          id: "a1-u5-l3-a2",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "demain", right: "amanhã" },
            { left: "ce soir", right: "hoje à noite" },
            { left: "la semaine prochaine", right: "a semana que vem" },
          ],
          targets: [
            t("lex:demain", "recognition"),
            t("lex:ce-soir", "recognition"),
            t("lex:la-semaine-prochaine", "recognition"),
          ],
        },
        {
          id: "a1-u5-l3-a3",
          type: "listening",
          instruction: say.listen,
          context: {
            pt: "Dois amigos combinam o fim de semana em Montréal. *le marché* = a feira.",
          },
          lines: [
            {
              speaker: "Simon",
              text: "Qu'est-ce que tu vas faire en fin de semaine ?",
              gender: "m",
              region: "fr-CA",
            },
            {
              speaker: "Carla",
              text: "Samedi, je vais aller au marché Jean-Talon. Dimanche, je vais travailler.",
              gender: "f",
              region: "fr-CA",
            },
            {
              speaker: "Simon",
              text: "Je vais au marché aussi ! On y va ensemble ?",
              gender: "m",
              region: "fr-CA",
            },
            { speaker: "Carla", text: "Oui ! À dix heures ?", gender: "f", region: "fr-CA" },
          ],
          questions: [
            {
              prompt: { pt: "O que Carla vai fazer no domingo?" },
              options: ["Trabalhar", "Ir à feira", "Ir ao cinema"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que eles combinam?" },
              options: [
                "Ir juntos à feira no sábado às 10h",
                "Trabalhar juntos no domingo",
                "Jantar juntos no sábado",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("gram:futur-proche", "recognition"),
            t("gram:aller-present", "recognition", 0.5),
          ],
        },
        {
          id: "a1-u5-l3-a4",
          type: "fill",
          instruction: say.complete,
          sentence: "Ce soir, nous ___ manger au restaurant.",
          blanks: [{ accept: ["allons"] }],
          translation: "Hoje à noite vamos comer no restaurante.",
          targets: [t("gram:futur-proche", "writing"), t("lex:ce-soir", "recall", 0.5)],
        },
        {
          id: "a1-u5-l3-a5",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Je vais ne pas travailler demain.",
          accept: ["Je ne vais pas travailler demain."],
          explanation: { pt: "A negação abraça o *aller*: *je ne vais pas travailler*." },
          targets: [t("gram:futur-proche", "writing"), t("gram:negation-ne-pas", "writing", 0.5)],
        },
        {
          id: "a1-u5-l3-a6",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Amanhã vou ao parque." },
          accept: ["Demain, je vais au parc.", "Demain je vais au parc."],
          targets: [t("lex:demain", "recall"), t("gram:aller-present", "writing", 0.5)],
        },
        {
          id: "a1-u5-l3-a7",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Qu'est-ce que tu vas faire demain ?",
            audio: { text: "Qu'est-ce que tu vas faire demain ?", gender: "m" },
          },
          text: "Demain, je vais travailler.",
          accept: [
            "Demain, je vais travailler.",
            "Demain, je vais aller au parc.",
            "Demain, je vais étudier.",
            "Je vais travailler.",
            "Je vais aller au marché.",
          ],
          translation: "Amanhã vou trabalhar. (ou o seu plano)",
          targets: [t("gram:futur-proche", "speaking"), t("lex:demain", "speaking", 0.5)],
        },
      ],
    },
  ],
};
