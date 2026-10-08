import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitRecit: UnitInput = {
  id: "a2-u6",
  level: "A2",
  title: { pt: "Contar uma história", fr: "Raconter une histoire" },
  canDo: {
    pt: "Contar um acontecimento com cenário e fatos — o que estava acontecendo e o que aconteceu de repente.",
    fr: "Raconter un événement avec le décor et les faits.",
  },
  lessons: [
    {
      id: "a2-u6-l1",
      title: { pt: "Cenário e fatos", fr: "Le décor et les faits" },
      objective: {
        pt: "Escolher entre imparfait e passé composé numa história.",
        fr: "Choisir entre imparfait et passé composé.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u6-l1-t1",
          type: "teach",
          title: { pt: "Estava… quando…" },
          body: {
            pt: "Numa história, dois tempos trabalham juntos:\n\n**imparfait** — o cenário, o que *estava* acontecendo: *Il **pleuvait**. Je **marchais** vers le métro.*\n**passé composé** — o fato que acontece e faz a história andar: *Soudain, j'**ai vu** un vieil ami.*\n\nComo em português: “eu **estava** andando quando **vi** um amigo”.\n\nPalavras que ajudam: **soudain / tout à coup** (de repente) · **pendant que** (enquanto).",
          },
          examples: [
            { fr: "Il pleuvait quand je suis arrivé.", pt: "Estava chovendo quando eu cheguei." },
            {
              fr: "Je dormais quand le téléphone a sonné.",
              pt: "Eu estava dormindo quando o telefone tocou.",
            },
            {
              fr: "Pendant que je cuisinais, les enfants jouaient.",
              pt: "Enquanto eu cozinhava, as crianças brincavam.",
            },
          ],
          introduces: ["gram:pc-imparfait", "lex:soudain", "lex:pendant-que"],
        },
        {
          id: "a2-u6-l1-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Je ___ la télé quand Marc a appelé." },
          options: ["regardais", "ai regardé", "regarde"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "A ação estava em andamento (“eu estava vendo”): *imparfait*." },
            { pt: "É uma história no passado." },
          ],
          targets: [t("gram:pc-imparfait", "recognition")],
        },
        {
          id: "a2-u6-l1-a2",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Il faisait beau. Soudain, il ___ à pleuvoir." },
          options: ["a commencé", "commençait", "commence"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*Soudain* marca um fato pontual: *passé composé*." },
            { pt: "É uma história no passado." },
          ],
          targets: [t("gram:pc-imparfait", "recognition"), t("lex:soudain", "recognition", 0.5)],
        },
        {
          id: "a2-u6-l1-a3",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "soudain", right: "de repente" },
            { left: "pendant que", right: "enquanto" },
            { left: "tout à coup", right: "de uma hora para outra" },
          ],
          targets: [t("lex:soudain", "recognition"), t("lex:pendant-que", "recognition")],
        },
        {
          id: "a2-u6-l1-a4",
          type: "fill",
          instruction: say.complete,
          sentence: "Je ___ quand le téléphone ___ sonné.",
          blanks: [{ accept: ["dormais"] }, { accept: ["a"] }],
          translation: "Eu estava dormindo quando o telefone tocou.",
          targets: [t("gram:pc-imparfait", "writing")],
        },
        {
          id: "a2-u6-l1-a5",
          type: "error_correction",
          instruction: say.fix,
          sentence: "J'ai marché dans la rue quand j'ai vu Julie.",
          accept: ["Je marchais dans la rue quand j'ai vu Julie."],
          explanation: { pt: "Cenário em andamento: *je marchais*; o fato: *j'ai vu*." },
          targets: [t("gram:pc-imparfait", "writing")],
        },
        {
          id: "a2-u6-l1-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Il pleuvait quand je suis arrivé à Montréal.",
          translation: "Estava chovendo quando cheguei a Montréal.",
          targets: [t("gram:pc-imparfait", "speaking")],
        },
      ],
    },
    {
      id: "a2-u6-l2",
      title: { pt: "Meu primeiro dia", fr: "Mon premier jour" },
      objective: {
        pt: "Entender e contar uma história curta com os dois tempos.",
        fr: "Comprendre et raconter une courte histoire.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u6-l2-t1",
          type: "teach",
          title: { pt: "Uma história em três passos" },
          body: {
            pt: "1. **Cenário** (*imparfait*): quando, onde, como era. *C'était le 3 janvier. Il faisait −25 °C.*\n2. **Fatos** (*passé composé*): o que aconteceu, em ordem. *Je suis sorti de l'aéroport, j'ai pris un taxi…*\n3. **Interrupção**: *pendant que* + imparfait, *soudain* + passé composé.",
          },
          examples: [
            { fr: "C'était mon premier jour au Canada.", pt: "Era o meu primeiro dia no Canadá." },
            {
              fr: "Pendant que j'attendais le bus, j'ai rencontré une voisine.",
              pt: "Enquanto eu esperava o ônibus, conheci uma vizinha.",
            },
          ],
          introduces: ["gram:pc-imparfait"],
        },
        {
          id: "a2-u6-l2-a1",
          type: "reading",
          instruction: { pt: "Leia e responda.", fr: "Lisez et répondez." },
          passage: {
            title: "Mon arrivée",
            text: "C'était le 3 janvier et il faisait moins vingt-cinq degrés. J'étais fatigué après le vol. Pendant que j'attendais mes valises, j'ai rencontré une Brésilienne qui habitait à Montréal depuis dix ans. Elle m'a donné son numéro. Aujourd'hui, c'est ma meilleure amie !",
          },
          questions: [
            {
              prompt: { pt: "Que tempo fazia?" },
              options: ["Muito frio: −25 °C", "Chovia", "Fazia sol e calor"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que aconteceu enquanto ele esperava as malas?" },
              options: ["Conheceu uma brasileira", "Perdeu o passaporte", "Pegou um táxi"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("gram:pc-imparfait", "recognition"),
            t("lex:pendant-que", "recognition", 0.5),
          ],
        },
        {
          id: "a2-u6-l2-a2",
          type: "listening",
          instruction: say.listen,
          lines: [
            {
              speaker: "Inês",
              text: "Hier soir, je lisais tranquillement chez moi. Tout à coup, il y a eu une panne d'électricité. Il faisait tout noir !",
              gender: "f",
            },
          ],
          questions: [
            {
              prompt: { pt: "O que Inês estava fazendo?" },
              options: ["Lendo em casa", "Cozinhando", "Dormindo"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que aconteceu de repente?" },
              options: ["Faltou luz", "O telefone tocou", "Alguém bateu na porta"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("gram:pc-imparfait", "recognition"), t("lex:soudain", "listening", 0.5)],
        },
        {
          id: "a2-u6-l2-a3",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Estava chovendo quando eu cheguei. (homem falando)" },
          accept: ["Il pleuvait quand je suis arrivé."],
          targets: [t("gram:pc-imparfait", "writing")],
        },
        {
          id: "a2-u6-l2-a4",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Pendant que j'attendais le bus, j'ai rencontré une voisine.",
          translation: "Enquanto eu esperava o ônibus, conheci uma vizinha.",
          targets: [t("gram:pc-imparfait", "speaking"), t("lex:pendant-que", "speaking", 0.5)],
        },
      ],
    },
  ],
};
