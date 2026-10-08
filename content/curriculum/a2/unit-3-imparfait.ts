import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitImparfait: UnitInput = {
  id: "a2-u3",
  level: "A2",
  title: { pt: "Antes e agora", fr: "Avant et maintenant" },
  canDo: {
    pt: "Descrever como era a sua vida antes — onde você morava, o que fazia — e comparar com agora.",
    fr: "Décrire sa vie d'avant et la comparer avec aujourd'hui.",
  },
  lessons: [
    {
      id: "a2-u3-l1",
      title: { pt: "Je parlais, j'habitais", fr: "Je parlais, j'habitais" },
      objective: {
        pt: "Formar o imparfait a partir da forma de nous.",
        fr: "Former l'imparfait.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u3-l1-t1",
          type: "teach",
          title: { pt: "“Eu morava, eu falava”" },
          body: {
            pt: "O *imparfait* corresponde ao nosso imperfeito — **-ava / -ia**. Formação:\n\n1. *nous* no presente: *nous **habit**ons*\n2. tire **-ons** e acrescente: **-ais, -ais, -ait, -ions, -iez, -aient**\n\n*j'habitais* · *tu habitais* · *il habitait* · *nous habitions* · *vous habitiez* · *ils habitaient*\n\nÚnica exceção: **être** → *j'étais, tu étais, il était…*",
          },
          examples: [
            { fr: "J'habitais à Recife.", pt: "Eu morava em Recife." },
            { fr: "Nous parlions portugais à la maison.", pt: "A gente falava português em casa." },
            { fr: "Elle était professeure.", pt: "Ela era professora." },
          ],
          notes: [
            {
              kind: "tip",
              text: { pt: "*habitais, habitait, habitaient* soam igual: /a.bi.tɛ/." },
            },
          ],
          introduces: ["gram:imparfait"],
        },
        {
          id: "a2-u3-l1-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Avant, nous ___ à São Paulo." },
          options: ["habitions", "habitons", "habitaient", "avons habité"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*habitons* é presente. Para “a gente morava”: *habitions*." },
            { pt: "*habitaient* é para *ils / elles*." },
            { pt: "Para descrever como era (“a gente morava”), *imparfait*: *habitions*." },
          ],
          targets: [t("gram:imparfait", "recognition")],
        },
        {
          id: "a2-u3-l1-a2",
          type: "fill",
          instruction: say.complete,
          sentence: "Quand j'___ petit, je ___ à Salvador.",
          blanks: [{ accept: ["étais"] }, { accept: ["habitais"] }],
          translation: "Quando eu era pequeno, morava em Salvador.",
          targets: [t("gram:imparfait", "writing")],
        },
        {
          id: "a2-u3-l1-a3",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Nous parlaions portugais.",
          accept: ["Nous parlions portugais."],
          explanation: { pt: "Com *nous*, a terminação é *-ions*." },
          targets: [t("gram:imparfait", "writing")],
        },
        {
          id: "a2-u3-l1-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Eu era engenheira no Brasil." },
          accept: ["J'étais ingénieure au Brésil."],
          targets: [t("gram:imparfait", "writing")],
        },
        {
          id: "a2-u3-l1-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Avant, j'habitais à Recife et je travaillais dans une banque.",
          translation: "Antes eu morava em Recife e trabalhava num banco.",
          targets: [t("gram:imparfait", "speaking")],
        },
      ],
    },
    {
      id: "a2-u3-l2",
      title: { pt: "Quando eu era pequeno", fr: "Quand j'étais petit" },
      objective: {
        pt: "Contar hábitos e descrever lugares do passado.",
        fr: "Raconter ses habitudes et décrire le passé.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u3-l2-t1",
          type: "teach",
          title: { pt: "Descrição e hábito" },
          body: {
            pt: "O *imparfait* serve para:\n\n**descrever** como era: *la maison **était** grande*, *il **faisait** chaud*\n**hábitos** do passado: *le dimanche, nous **allions** à la plage* (aos domingos a gente ia à praia)\n\nExpressão-chave: **quand j'étais petit(e)** — quando eu era criança.",
          },
          examples: [
            {
              fr: "Quand j'étais petite, je voulais être médecin.",
              pt: "Quando eu era pequena, queria ser médica.",
            },
            {
              fr: "Le dimanche, nous allions chez ma grand-mère.",
              pt: "Aos domingos, a gente ia à casa da minha avó.",
            },
            { fr: "Il faisait toujours chaud.", pt: "Fazia sempre calor." },
          ],
          introduces: ["gram:imparfait", "lex:quand-j-etais-petit"],
        },
        {
          id: "a2-u3-l2-a1",
          type: "reading",
          instruction: { pt: "Leia e responda.", fr: "Lisez et répondez." },
          passage: {
            title: "Mon enfance à Fortaleza",
            text: "Quand j'étais petit, j'habitais à Fortaleza, près de la mer. Il faisait chaud toute l'année. Le samedi, nous allions à la plage avec mes cousins. Mon père travaillait beaucoup, mais le dimanche il préparait toujours le déjeuner.",
          },
          questions: [
            {
              prompt: { pt: "O que a família fazia aos sábados?" },
              options: ["Ia à praia com os primos", "Visitava a avó", "Preparava o almoço"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Quem preparava o almoço de domingo?" },
              options: ["O pai", "A mãe", "Os primos"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("gram:imparfait", "recognition"),
            t("lex:quand-j-etais-petit", "recognition", 0.5),
          ],
        },
        {
          id: "a2-u3-l2-a2",
          type: "choice",
          instruction: { pt: "Qual frase descreve um hábito do passado?" },
          prompt: { pt: "“Aos domingos, a gente ia ao parque.”" },
          options: [
            "Le dimanche, nous allions au parc.",
            "Dimanche, nous sommes allés au parc.",
            "Le dimanche, nous allons au parc.",
          ],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Isso é um domingo específico (“fomos”). Hábito é *imparfait*: *nous allions*." },
            { pt: "*allons* é presente (“vamos”)." },
          ],
          targets: [t("gram:imparfait", "recognition")],
        },
        {
          id: "a2-u3-l2-a3",
          type: "order",
          instruction: say.order,
          tokens: ["Quand", "j'étais", "petite,", "je", "voulais", "être", "médecin."],
          translation: "Quando eu era pequena, queria ser médica.",
          targets: [t("lex:quand-j-etais-petit", "recall"), t("gram:imparfait", "writing", 0.5)],
        },
        {
          id: "a2-u3-l2-a4",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Où est-ce que tu habitais quand tu étais petit ?",
            audio: { text: "Où est-ce que tu habitais quand tu étais petit ?", gender: "f" },
          },
          text: "Quand j'étais petit, j'habitais à São Paulo.",
          accept: [
            "Quand j'étais petit, j'habitais à São Paulo.",
            "Quand j'étais petite, j'habitais à São Paulo.",
            "J'habitais à Rio.",
            "J'habitais au Brésil.",
          ],
          translation: "Quando eu era pequeno, morava em São Paulo. (ou onde você morava)",
          targets: [t("gram:imparfait", "speaking"), t("lex:quand-j-etais-petit", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "a2-u3-l3",
      title: { pt: "Antes e agora", fr: "Avant et maintenant" },
      objective: {
        pt: "Comparar a vida de antes com a de agora.",
        fr: "Comparer hier et aujourd'hui.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u3-l3-t1",
          type: "teach",
          title: { pt: "Avant… maintenant…" },
          body: {
            pt: "Para contar uma mudança de vida: **avant** (antes) + *imparfait*, **maintenant** (agora) + presente.\n\n*Avant, j'**habitais** à Belo Horizonte ; maintenant, j'**habite** à Québec.*\n*Avant, je ne **parlais** pas français ; maintenant, je **parle** un peu.*",
          },
          examples: [
            {
              fr: "Avant, je travaillais dans un bureau ; maintenant, je suis étudiante.",
              pt: "Antes eu trabalhava num escritório; agora sou estudante.",
            },
            { fr: "Maintenant, j'habite près du métro.", pt: "Agora moro perto do metrô." },
          ],
          introduces: ["gram:imparfait", "lex:avant", "lex:maintenant"],
        },
        {
          id: "a2-u3-l3-a1",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "avant", right: "antes" },
            { left: "maintenant", right: "agora" },
            { left: "quand j'étais petit", right: "quando eu era criança" },
          ],
          targets: [
            t("lex:avant", "recognition"),
            t("lex:maintenant", "recognition"),
            t("lex:quand-j-etais-petit", "recognition"),
          ],
        },
        {
          id: "a2-u3-l3-a2",
          type: "listening",
          instruction: say.listen,
          lines: [
            {
              speaker: "Rodrigo",
              text: "Avant, j'habitais à Porto Alegre et je travaillais dans une banque. Maintenant, j'habite à Lyon et je suis cuisinier. Je suis plus heureux !",
              gender: "m",
            },
          ],
          questions: [
            {
              prompt: { pt: "Qual era o trabalho de Rodrigo antes?" },
              options: ["Ele trabalhava num banco", "Ele era cozinheiro", "Ele era estudante"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "E agora?" },
              options: [
                "É cozinheiro em Lyon",
                "Trabalha num banco em Lyon",
                "Mora em Porto Alegre",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("gram:imparfait", "recognition"), t("lex:maintenant", "listening", 0.5)],
        },
        {
          id: "a2-u3-l3-a3",
          type: "fill",
          instruction: say.complete,
          sentence: "Avant, je ne ___ pas français ; maintenant, je ___ un peu.",
          blanks: [{ accept: ["parlais"] }, { accept: ["parle"] }],
          translation: "Antes eu não falava francês; agora falo um pouco.",
          targets: [t("gram:imparfait", "writing"), t("lex:avant", "recall", 0.5)],
        },
        {
          id: "a2-u3-l3-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Antes eu morava no Brasil; agora moro no Canadá." },
          accept: [
            "Avant, j'habitais au Brésil ; maintenant, j'habite au Canada.",
            "Avant, j'habitais au Brésil, maintenant, j'habite au Canada.",
            "Avant j'habitais au Brésil, maintenant j'habite au Canada.",
          ],
          targets: [t("gram:imparfait", "writing"), t("lex:maintenant", "recall", 0.5)],
        },
        {
          id: "a2-u3-l3-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Avant, je travaillais beaucoup ; maintenant, j'apprends le français.",
          translation: "Antes eu trabalhava muito; agora estou aprendendo francês.",
          targets: [t("gram:imparfait", "speaking"), t("lex:avant", "speaking", 0.5)],
        },
      ],
    },
  ],
};
