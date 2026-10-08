import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitMeteo: UnitInput = {
  id: "a1-u8",
  level: "A1",
  title: { pt: "O tempo e as estações", fr: "Le temps et les saisons" },
  canDo: {
    pt: "Falar do tempo, entender uma previsão simples e se preparar para as estações — do verão francês ao inverno do Québec.",
    fr: "Parler du temps, comprendre une météo simple et parler des saisons.",
  },
  lessons: [
    {
      id: "a1-u8-l1",
      title: { pt: "Quel temps fait-il ?", fr: "Quel temps fait-il ?" },
      objective: {
        pt: "Dizer como está o tempo com il fait, il pleut e il neige.",
        fr: "Dire le temps qu'il fait.",
      },
      minutes: 7,
      steps: [
        {
          id: "a1-u8-l1-t1",
          type: "teach",
          title: { pt: "Como está o tempo?" },
          body: {
            pt: "*Quel temps fait-il ?* — Como está o tempo?\n\n**il fait beau** · **il fait chaud** · **il fait froid**\n**il pleut** (chove) · **il neige** (neva)\n**il y a du soleil** · **il y a du vent**\n\n“Está calor” é *il fait chaud* — nunca *il est chaud*.",
          },
          examples: [
            { fr: "Il fait beau aujourd'hui.", pt: "Hoje o dia está bonito." },
            { fr: "Il pleut, prends un parapluie.", pt: "Está chovendo, leva um guarda-chuva." },
            { fr: "Il y a du vent.", pt: "Está ventando." },
          ],
          introduces: [
            "gram:il-fait",
            "lex:il-fait-beau",
            "lex:il-fait-chaud-froid",
            "lex:il-pleut",
            "lex:il-neige",
          ],
        },
        {
          id: "a1-u8-l1-a1",
          type: "choice",
          instruction: { pt: "Como se diz “Está calor”?" },
          prompt: { pt: "Você fala do tempo hoje." },
          options: ["Il fait chaud.", "Il est chaud.", "J'ai chaud le temps."],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Para o tempo, *il fait*: *il fait chaud*." },
            { pt: "*J'ai chaud* é a sua sensação, e a frase não fecha." },
          ],
          targets: [
            t("gram:il-fait", "recognition"),
            t("lex:il-fait-chaud-froid", "recognition", 0.5),
          ],
        },
        {
          id: "a1-u8-l1-a2",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "il pleut", right: "está chovendo" },
            { left: "il neige", right: "está nevando" },
            { left: "il fait beau", right: "o dia está bonito" },
            { left: "il fait froid", right: "está frio" },
          ],
          targets: [
            t("lex:il-pleut", "recognition"),
            t("lex:il-neige", "recognition"),
            t("lex:il-fait-beau", "recognition"),
            t("lex:il-fait-chaud-froid", "recognition"),
          ],
        },
        {
          id: "a1-u8-l1-a3",
          type: "choice",
          instruction: say.listenChoose,
          prompt: { audio: { text: "Il neige depuis ce matin.", region: "fr-CA" }, hideText: true },
          options: [
            "Está nevando desde de manhã.",
            "Está chovendo desde de manhã.",
            "Está ventando desde de manhã.",
          ],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:il-neige", "listening")],
        },
        {
          id: "a1-u8-l1-a4",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Il fait froid, je suis froid.",
          accept: ["Il fait froid, j'ai froid."],
          explanation: { pt: "O tempo: *il fait froid*. A sensação: *j'ai froid*." },
          targets: [t("gram:il-fait", "writing"), t("lex:avoir-froid", "recall", 0.5)],
        },
        {
          id: "a1-u8-l1-a5",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Está chovendo." },
          accept: ["Il pleut."],
          targets: [t("lex:il-pleut", "recall")],
        },
        {
          id: "a1-u8-l1-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Il fait beau, mais il y a du vent.",
          translation: "O dia está bonito, mas está ventando.",
          targets: [t("gram:il-fait", "speaking"), t("lex:il-fait-beau", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "a1-u8-l2",
      title: { pt: "As estações", fr: "Les saisons" },
      objective: {
        pt: "Falar das estações e do clima no Québec e na França.",
        fr: "Parler des saisons au Québec et en France.",
      },
      minutes: 7,
      steps: [
        {
          id: "a1-u8-l2-t1",
          type: "teach",
          title: { pt: "Quatro estações de verdade" },
          body: {
            pt: "**au printemps** (primavera) · **en été** (verão) · **en automne** (outono) · **en hiver** (inverno)\n\nSó a primavera usa *au*; as outras começam com vogal e usam *en*.\n\nNo Québec, o inverno é longo e rigoroso (−20 °C não surpreende ninguém), e o verão é curto e quente. Na França o clima varia muito por região: invernos suaves no oeste e no sul, mais frios no leste e nas montanhas.",
          },
          examples: [
            { fr: "En hiver, il neige beaucoup à Québec.", pt: "No inverno neva muito em Québec." },
            { fr: "Au printemps, il pleut souvent.", pt: "Na primavera chove com frequência." },
            { fr: "En été, il fait chaud à Marseille.", pt: "No verão faz calor em Marselha." },
          ],
          notes: [
            {
              kind: "quebec",
              text: {
                pt: "Prepare a *tuque* (touca de lã): no Québec é peça obrigatória no inverno. Na França ela se chama *un bonnet*.",
              },
            },
          ],
          introduces: ["lex:les-saisons", "lex:une-tuque"],
        },
        {
          id: "a1-u8-l2-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "___ printemps, il fait doux." },
          options: ["Au", "En", "À la"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Só a primavera usa *au*: *au printemps*." },
            { pt: "*Printemps* é masculino: *au printemps*." },
          ],
          targets: [t("lex:les-saisons", "recognition")],
        },
        {
          id: "a1-u8-l2-a2",
          type: "reading",
          instruction: { pt: "Leia e responda.", fr: "Lisez et répondez." },
          passage: {
            title: "Mon année à Québec",
            text: "En hiver, il fait très froid et il neige souvent : je mets ma tuque tous les jours ! Au printemps, la neige fond. En été, il fait chaud et on mange dehors. En automne, les arbres sont rouges et orange : c'est ma saison préférée.",
          },
          questions: [
            {
              prompt: { pt: "Qual é a estação preferida de quem escreve?" },
              options: ["O outono", "O verão", "O inverno"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que acontece na primavera?" },
              options: ["A neve derrete", "Neva muito", "Faz muito calor"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:les-saisons", "recognition"), t("lex:une-tuque", "recognition", 0.5)],
        },
        {
          id: "a1-u8-l2-a3",
          type: "fill",
          instruction: say.complete,
          sentence: "___ hiver, il neige ; ___ été, il fait chaud.",
          blanks: [{ accept: ["En", "en"] }, { accept: ["en"] }],
          translation: "No inverno neva; no verão faz calor.",
          targets: [t("lex:les-saisons", "recall"), t("gram:il-fait", "writing", 0.5)],
        },
        {
          id: "a1-u8-l2-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "uma touca de lã (no Québec)" },
          accept: ["une tuque"],
          targets: [t("lex:une-tuque", "recall")],
        },
        {
          id: "a1-u8-l2-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "En hiver, il fait froid ; au printemps, il pleut.",
          translation: "No inverno faz frio; na primavera chove.",
          targets: [t("lex:les-saisons", "speaking"), t("gram:il-fait", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "a1-u8-l3",
      title: { pt: "A previsão do tempo", fr: "La météo" },
      objective: {
        pt: "Entender uma previsão simples com o futuro próximo.",
        fr: "Comprendre une météo simple.",
      },
      minutes: 6,
      steps: [
        {
          id: "a1-u8-l3-t1",
          type: "teach",
          title: { pt: "Amanhã vai chover" },
          body: {
            pt: "A previsão usa o futuro próximo que você já conhece:\n\n*Demain, il **va** pleuvoir.* — Amanhã vai chover.\n*Ce soir, il **va** neiger.* — Hoje à noite vai nevar.\n*Il **va** faire beau.* — Vai fazer tempo bom.\n\nNa previsão, as temperaturas: *moins dix degrés* (−10 °C), *vingt degrés* (20 °C).",
          },
          examples: [
            { fr: "Demain, il va faire beau.", pt: "Amanhã vai fazer tempo bom." },
            {
              fr: "Ce soir, il va neiger : moins douze degrés.",
              pt: "Hoje à noite vai nevar: menos doze graus.",
            },
          ],
          introduces: ["gram:il-fait"],
        },
        {
          id: "a1-u8-l3-a1",
          type: "listening",
          instruction: say.listen,
          context: {
            pt: "A previsão do tempo no rádio de Montréal. *degrés* = graus; *la tempête* = a tempestade.",
          },
          lines: [
            {
              speaker: "Locutora",
              text: "Bonjour Montréal ! Aujourd'hui, il fait froid : moins quinze degrés. Ce soir, il va neiger. Demain, attention : tempête de neige toute la journée !",
              gender: "f",
              region: "fr-CA",
            },
          ],
          questions: [
            {
              prompt: { pt: "Qual é a temperatura hoje?" },
              options: ["−15 °C", "−5 °C", "15 °C"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que vai acontecer amanhã?" },
              options: ["Uma tempestade de neve", "Sol o dia todo", "Chuva forte"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:il-neige", "listening"), t("gram:il-fait", "recognition", 0.5)],
        },
        {
          id: "a1-u8-l3-a2",
          type: "choice",
          instruction: say.meaning,
          prompt: { fr: "Demain, il va pleuvoir." },
          options: ["Amanhã vai chover.", "Ontem choveu.", "Amanhã vai nevar."],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:il-pleut", "recognition"), t("gram:futur-proche", "recognition", 0.5)],
        },
        {
          id: "a1-u8-l3-a3",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Amanhã vai fazer tempo bom." },
          accept: ["Demain, il va faire beau.", "Demain il va faire beau."],
          targets: [t("gram:il-fait", "writing"), t("gram:futur-proche", "writing", 0.5)],
        },
        {
          id: "a1-u8-l3-a4",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Quel temps fait-il aujourd'hui ?",
            audio: { text: "Quel temps fait-il aujourd'hui ?", gender: "m" },
          },
          text: "Il fait beau.",
          accept: [
            "Il fait beau.",
            "Il fait froid.",
            "Il fait chaud.",
            "Il pleut.",
            "Il neige.",
            "Il y a du vent.",
          ],
          translation: "O dia está bonito. (ou como está o tempo aí)",
          targets: [t("gram:il-fait", "speaking")],
        },
      ],
    },
  ],
};
