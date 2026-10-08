import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitHypotheses: UnitInput = {
  id: "b1-u2",
  level: "B1",
  title: { pt: "Se eu tivesse…", fr: "Si j'avais…" },
  canDo: {
    pt: "Imaginar situações, dar conselhos (“se eu fosse você…”) e falar de condições reais e hipotéticas.",
    fr: "Faire des hypothèses et donner des conseils.",
  },
  lessons: [
    {
      id: "b1-u2-l1",
      title: { pt: "Si + imparfait", fr: "Si + imparfait" },
      objective: {
        pt: "Fazer hipóteses com si + imparfait e condicional.",
        fr: "L'hypothèse : si + imparfait, conditionnel.",
      },
      minutes: 7,
      steps: [
        {
          id: "b1-u2-l1-t1",
          type: "teach",
          title: { pt: "“Se eu tivesse” → si j'avais" },
          body: {
            pt: "Para imaginar: **si** + ***imparfait***, depois **condicional**:\n\n*Si j'**avais** plus de temps, j'**apprendrais** le piano.*\n*Si j'**étais** riche, j'**habiterais** au bord de la mer.*\n\nO português usa o subjuntivo (“se eu **tivesse**”, “se eu **fosse**”); o francês usa o *imparfait*. E **nunca** condicional logo depois de *si*.",
          },
          examples: [
            {
              fr: "Si je parlais mieux, je chercherais un autre travail.",
              pt: "Se eu falasse melhor, procuraria outro trabalho.",
            },
            { fr: "Si j'étais toi, j'accepterais.", pt: "Se eu fosse você, aceitaria." },
            {
              fr: "À ta place, je prendrais le CDI.",
              pt: "No seu lugar, eu pegaria o contrato fixo.",
            },
          ],
          introduces: ["gram:hypothese-si-imparfait", "lex:si-j-etais-toi"],
        },
        {
          id: "b1-u2-l1-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Si j'___ le temps, je viendrais." },
          options: ["avais", "aurais", "aurai", "ai eu"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Depois de *si*, nunca o condicional: *si j'avais*." },
            { pt: "Depois de *si*, nunca o futuro." },
            { pt: "Para uma hipótese no presente: *si j'avais*." },
          ],
          targets: [t("gram:hypothese-si-imparfait", "recognition")],
        },
        {
          id: "b1-u2-l1-a2",
          type: "fill",
          instruction: say.complete,
          sentence: "Si j'___ riche, j'___ au bord de la mer.",
          blanks: [{ accept: ["étais"] }, { accept: ["habiterais"] }],
          translation: "Se eu fosse rico, moraria à beira-mar.",
          targets: [t("gram:hypothese-si-imparfait", "writing")],
        },
        {
          id: "b1-u2-l1-a3",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Si j'aurais une voiture, j'irais à Gaspé.",
          accept: ["Si j'avais une voiture, j'irais à Gaspé."],
          explanation: { pt: "Depois de *si*: *imparfait* (*avais*)." },
          targets: [t("gram:hypothese-si-imparfait", "writing")],
        },
        {
          id: "b1-u2-l1-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Se eu fosse você, eu aceitaria. (informal)" },
          accept: ["Si j'étais toi, j'accepterais.", "Si j'étais toi, j'accepterais !"],
          targets: [
            t("lex:si-j-etais-toi", "recall"),
            t("gram:hypothese-si-imparfait", "writing", 0.5),
          ],
        },
        {
          id: "b1-u2-l1-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Si j'avais plus de temps, j'apprendrais à jouer du piano.",
          translation: "Se eu tivesse mais tempo, aprenderia a tocar piano.",
          targets: [t("gram:hypothese-si-imparfait", "speaking")],
        },
      ],
    },
    {
      id: "b1-u2-l2",
      title: { pt: "Real ou imaginário?", fr: "Réel ou imaginaire ?" },
      objective: {
        pt: "Distinguir si + presente (real) de si + imparfait (imaginário).",
        fr: "Distinguer les deux hypothèses.",
      },
      minutes: 7,
      steps: [
        {
          id: "b1-u2-l2-t1",
          type: "teach",
          title: { pt: "Dois tipos de “se”" },
          body: {
            pt: "**Possível, real**: *si* + **presente**, depois **futuro** (ou imperativo):\n*Si tu **viens** samedi, on **ira** au marché.* · *Si tu as besoin, **appelle**-moi.*\n\n**Imaginário**: *si* + ***imparfait***, depois **condicional**:\n*Si tu **venais** plus souvent, on **irait** au marché.*",
          },
          examples: [
            {
              fr: "S'il fait beau demain, nous irons au parc.",
              pt: "Se fizer tempo bom amanhã, iremos ao parque.",
            },
            {
              fr: "S'il faisait toujours beau, je vivrais dehors !",
              pt: "Se fizesse sempre tempo bom, eu viveria ao ar livre!",
            },
          ],
          introduces: ["gram:hypothese-si-imparfait"],
        },
        {
          id: "b1-u2-l2-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "S'il fait beau demain, nous ___ au parc." },
          options: ["irons", "irions", "allions"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*si* + presente (*fait*) → futuro: *nous irons*." },
            { pt: "*si* + presente (*fait*) → futuro: *nous irons*." },
          ],
          targets: [t("gram:hypothese-si-imparfait", "recognition")],
        },
        {
          id: "b1-u2-l2-a2",
          type: "listening",
          instruction: say.listen,
          lines: [
            {
              speaker: "Lucas",
              text: "On m'offre un poste à Vancouver, mais en anglais…",
              gender: "m",
            },
            {
              speaker: "Clara",
              text: "À ta place, je refuserais. Si tu restais à Montréal, tu continuerais à pratiquer ton français !",
              gender: "f",
              region: "fr-CA",
            },
          ],
          questions: [
            {
              prompt: { pt: "O que Clara aconselha?" },
              options: [
                "Recusar a vaga e ficar em Montréal",
                "Aceitar a vaga em Vancouver",
                "Pedir um salário maior",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:si-j-etais-toi", "listening"),
            t("gram:hypothese-si-imparfait", "recognition", 0.5),
          ],
        },
        {
          id: "b1-u2-l2-a3",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Si tu auras besoin d'aide, appelle-moi.",
          accept: ["Si tu as besoin d'aide, appelle-moi."],
          explanation: { pt: "Depois de *si*, nunca futuro: *si tu as besoin*." },
          targets: [t("gram:hypothese-si-imparfait", "writing")],
        },
        {
          id: "b1-u2-l2-a4",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Qu'est-ce que tu ferais si tu gagnais au loto ?",
            audio: { text: "Qu'est-ce que tu ferais si tu gagnais au loto ?", gender: "m" },
          },
          text: "Si je gagnais au loto, j'achèterais une maison.",
          accept: [
            "J'achèterais une maison.",
            "Je voyagerais.",
            "J'arrêterais de travailler.",
            "Si je gagnais au loto, j'achèterais une maison.",
            "Si je gagnais au loto, je voyagerais.",
          ],
          translation: "Se eu ganhasse na loteria, compraria uma casa. (ou o que você faria)",
          targets: [t("gram:hypothese-si-imparfait", "speaking")],
        },
      ],
    },
  ],
};
