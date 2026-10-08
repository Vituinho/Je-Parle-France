import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitFutur: UnitInput = {
  id: "a2-u8",
  level: "A2",
  title: { pt: "Planos para o futuro", fr: "Projets d'avenir" },
  canDo: {
    pt: "Falar dos seus planos de médio prazo e fazer promessas, com o futuro simples e “quando”.",
    fr: "Parler de ses projets avec le futur simple.",
  },
  missionScenario: "scn-projets",
  lessons: [
    {
      id: "a2-u8-l1",
      title: { pt: "Je parlerai", fr: "Je parlerai" },
      objective: {
        pt: "Formar o futuro simples, regular e irregular.",
        fr: "Former le futur simple.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u8-l1-t1",
          type: "teach",
          title: { pt: "Infinitivo + -ai, -as, -a…" },
          body: {
            pt: "**infinitivo** + **-ai, -as, -a, -ons, -ez, -ont**:\n*je parler**ai*** · *tu parler**as*** · *il parler**a*** · *nous parler**ons*** · *vous parler**ez*** · *ils parler**ont***\n\nVerbos em *-re* perdem o *e*: *prendre → je prendr**ai***.\n\nIrregulares (mesmas terminações): *être → **ser**ai* · *avoir → **aur**ai* · *aller → **ir**ai* · *faire → **fer**ai* · *pouvoir → **pourr**ai* · *venir → **viendr**ai*",
          },
          examples: [
            {
              fr: "L'année prochaine, j'habiterai à Montréal.",
              pt: "Ano que vem vou morar em Montréal.",
            },
            { fr: "Un jour, je parlerai couramment.", pt: "Um dia vou falar fluentemente." },
            { fr: "Nous irons en France en été.", pt: "Iremos à França no verão." },
          ],
          introduces: ["gram:futur-simple", "lex:l-annee-prochaine", "lex:un-jour"],
        },
        {
          id: "a2-u8-l1-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "L'année prochaine, nous ___ au Canada." },
          options: ["irons", "allerons", "allons aller", "irez"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*Aller* é irregular no futuro: radical *ir-*: *nous irons*." },
            { pt: "Possível na fala, mas aqui pedimos o futuro simples: *nous irons*." },
            { pt: "*irez* é para *vous*." },
          ],
          targets: [t("gram:futur-simple", "recognition")],
        },
        {
          id: "a2-u8-l1-a2",
          type: "match",
          instruction: say.match,
          leftLang: "fr",
          rightLang: "fr",
          pairs: [
            { left: "être", right: "je serai" },
            { left: "avoir", right: "j'aurai" },
            { left: "faire", right: "je ferai" },
            { left: "pouvoir", right: "je pourrai" },
            { left: "venir", right: "je viendrai" },
          ],
          targets: [t("gram:futur-simple", "recognition")],
        },
        {
          id: "a2-u8-l1-a3",
          type: "fill",
          instruction: say.complete,
          sentence: "Un jour, je ___ couramment et j'___ un bon travail.",
          blanks: [{ accept: ["parlerai"] }, { accept: ["aurai"] }],
          translation: "Um dia vou falar fluentemente e terei um bom trabalho.",
          targets: [t("gram:futur-simple", "writing"), t("lex:un-jour", "recall", 0.5)],
        },
        {
          id: "a2-u8-l1-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Ano que vem vou morar em Paris. (futuro simples)" },
          accept: [
            "L'année prochaine, j'habiterai à Paris.",
            "L'année prochaine j'habiterai à Paris.",
          ],
          targets: [t("lex:l-annee-prochaine", "recall"), t("gram:futur-simple", "writing", 0.5)],
        },
        {
          id: "a2-u8-l1-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "L'année prochaine, je serai au Canada et je parlerai mieux français.",
          translation: "Ano que vem estarei no Canadá e vou falar francês melhor.",
          targets: [t("gram:futur-simple", "speaking")],
        },
      ],
    },
    {
      id: "a2-u8-l2",
      title: { pt: "Quand j'arriverai…", fr: "Quand j'arriverai…" },
      objective: {
        pt: "Usar o futuro depois de quand — onde o português usa o futuro do subjuntivo.",
        fr: "Le futur après quand.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u8-l2-t1",
          type: "teach",
          title: { pt: "“Quando eu chegar” → quand j'arriverai" },
          body: {
            pt: "Para falar de um momento futuro depois de **quand**, o francês usa o **futuro simples** — nos dois verbos:\n\n*Quand j'**arriverai**, je t'**appellerai**.* (Quando eu **chegar**, te ligo.)\n*Quand tu **auras** le temps, viens me voir.* (Quando você **tiver** tempo, venha me ver.)\n\nO português usa o futuro do subjuntivo (“chegar”, “tiver”); o francês, nunca o presente.\n\nCuidado: depois de **si** (se), presente: *si tu **viens**, je serai content*.",
          },
          examples: [
            {
              fr: "Quand je serai au Canada, je chercherai un travail.",
              pt: "Quando eu estiver no Canadá, vou procurar trabalho.",
            },
            { fr: "Appelle-moi quand tu arriveras.", pt: "Me liga quando você chegar." },
          ],
          introduces: ["gram:futur-simple"],
        },
        {
          id: "a2-u8-l2-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Quand j'___ à Montréal, je t'appellerai." },
          options: ["arriverai", "arrive", "arriver"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Depois de *quand* com sentido futuro: futuro simples, *j'arriverai*." },
            { pt: "É preciso conjugar: *j'arriverai*." },
          ],
          targets: [t("gram:futur-simple", "recognition")],
        },
        {
          id: "a2-u8-l2-a2",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Quand j'ai le temps, je t'écrirai.",
          accept: ["Quand j'aurai le temps, je t'écrirai."],
          explanation: { pt: "“Quando eu tiver tempo”: futuro depois de *quand* — *j'aurai*." },
          targets: [t("gram:futur-simple", "writing")],
        },
        {
          id: "a2-u8-l2-a3",
          type: "choice",
          instruction: { pt: "si ou quand?" },
          prompt: { fr: "Je serai content ___ tu viens." },
          options: ["si", "quand"],
          answer: 0,
          optionFeedback: [
            null,
            {
              pt: "Com *quand* o verbo iria para o futuro (*quand tu viendras*). Com o presente *viens*, só *si*.",
            },
          ],
          targets: [t("gram:futur-simple", "recognition", 0.7)],
        },
        {
          id: "a2-u8-l2-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Me liga quando você chegar. (informal)" },
          accept: ["Appelle-moi quand tu arriveras."],
          targets: [t("gram:futur-simple", "writing")],
        },
        {
          id: "a2-u8-l2-a5",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Qu'est-ce que tu feras quand tu parleras bien français ?",
            audio: {
              text: "Qu'est-ce que tu feras quand tu parleras bien français ?",
              gender: "m",
            },
          },
          text: "Quand je parlerai bien français, je chercherai un travail au Canada.",
          accept: [
            "Je chercherai un travail.",
            "Je chercherai un travail au Canada.",
            "Je passerai le TCF.",
            "Je passerai le TEF.",
            "J'habiterai en France.",
            "J'habiterai au Canada.",
          ],
          translation:
            "Quando eu falar bem francês, vou procurar trabalho no Canadá. (ou o seu plano)",
          targets: [t("gram:futur-simple", "speaking")],
        },
      ],
    },
  ],
};
