import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitSons: UnitInput = {
  id: "a0-u2",
  level: "A0",
  title: { pt: "Os sons do francês", fr: "Les sons du français" },
  canDo: {
    pt: "Ouvir e produzir os sons que mais confundem brasileiros: /y/ e /u/, as consoantes finais mudas, as vogais nasais e o R.",
    fr: "Entendre et prononcer les sons difficiles pour les Brésiliens : /y/ et /u/, les consonnes muettes, les voyelles nasales et le R.",
  },
  lessons: [
    // ─── /y/ vs /u/ ───
    {
      id: "a0-u2-l1",
      title: { pt: "Tu ou tout?", fr: "Tu ou tout ?" },
      objective: {
        pt: "Distinguir /y/ (tu) de /u/ (tout) — e começar a produzir o /y/.",
        fr: "Distinguer /y/ et /u/, et commencer à produire /y/.",
      },
      minutes: 7,
      steps: [
        {
          id: "a0-u2-l1-t1",
          type: "teach",
          title: { pt: "Dois sons que parecem um só", fr: "Deux sons différents" },
          body: {
            pt: "O francês separa dois sons que, para o ouvido brasileiro, parecem iguais:\n\n**/u/**, escrito *ou*: *tout* (tudo), *vous* (vocês), *roue* (roda). É o nosso “u”.\n\n**/y/**, escrito *u*: *tu* (você), *vu* (visto), *rue* (rua). Esse som não existe em português.",
          },
          examples: [
            { fr: "tu", pt: "você" },
            { fr: "tout", pt: "tudo" },
            { fr: "rue", pt: "rua" },
            { fr: "roue", pt: "roda" },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "Se você disser *tu* como o “tu” do português, um francês vai entender *tout* (“tudo”). *Rue* vira *roue*, e *vu* vira *vous*.",
              },
            },
          ],
          introduces: ["pron:y-vs-u"],
        },
        {
          id: "a0-u2-l1-a1",
          type: "minimal_pair",
          instruction: say.whichWord,
          pair: [
            { word: "tu", ipa: "/ty/", pt: "você" },
            { word: "tout", ipa: "/tu/", pt: "tudo" },
          ],
          answer: 0,
          targets: [t("pron:y-vs-u", "listening")],
        },
        {
          id: "a0-u2-l1-a2",
          type: "minimal_pair",
          instruction: say.whichWord,
          pair: [
            { word: "tu", ipa: "/ty/", pt: "você" },
            { word: "tout", ipa: "/tu/", pt: "tudo" },
          ],
          answer: 1,
          targets: [t("pron:y-vs-u", "listening")],
        },
        {
          id: "a0-u2-l1-a3",
          type: "minimal_pair",
          instruction: say.whichWord,
          pair: [
            { word: "rue", ipa: "/ʁy/", pt: "rua" },
            { word: "roue", ipa: "/ʁu/", pt: "roda" },
          ],
          answer: 1,
          targets: [t("pron:y-vs-u", "listening")],
        },
        {
          id: "a0-u2-l1-a4",
          type: "minimal_pair",
          instruction: say.whichWord,
          pair: [
            { word: "vu", ipa: "/vy/", pt: "visto" },
            { word: "vous", ipa: "/vu/", pt: "vocês" },
          ],
          answer: 0,
          targets: [t("pron:y-vs-u", "listening")],
        },
        {
          id: "a0-u2-l1-t2",
          type: "teach",
          title: { pt: "Agora, a sua boca" },
          body: {
            pt: "1. Diga “iiii” e sinta a língua na frente, encostada nos dentes de baixo.\n2. Sem mexer a língua, arredonde os lábios em biquinho, como para assobiar.\n3. Pronto: isso é o /y/ de *tu*.\n\nGrave a sua voz e compare com o modelo. Exagere o biquinho no começo.",
          },
          examples: [
            { fr: "tu", pt: "você" },
            { fr: "salut", pt: "oi" },
            { fr: "du jus", pt: "suco" },
          ],
        },
        {
          id: "a0-u2-l1-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "tu, tout — tu, tout",
          targets: [t("pron:y-vs-u", "pronunciation")],
        },
        {
          id: "a0-u2-l1-a6",
          type: "minimal_pair",
          instruction: say.whichWord,
          pair: [
            { word: "dessus", ipa: "/də.sy/", pt: "em cima" },
            { word: "dessous", ipa: "/də.su/", pt: "embaixo" },
          ],
          answer: 0,
          targets: [t("pron:y-vs-u", "listening")],
        },
        {
          id: "a0-u2-l1-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Tu as vu la rue ?",
          translation: "Você viu a rua?",
          targets: [t("pron:y-vs-u", "pronunciation")],
        },
      ],
    },

    // ─── Silent final consonants ───
    {
      id: "a0-u2-l2",
      title: { pt: "Letras que não se pronunciam", fr: "Les lettres muettes" },
      objective: {
        pt: "Não pronunciar as consoantes finais mudas — e reconhecer as que soam.",
        fr: "Ne pas prononcer les consonnes finales muettes.",
      },
      minutes: 6,
      steps: [
        {
          id: "a0-u2-l2-t1",
          type: "teach",
          title: { pt: "Pare na última vogal" },
          body: {
            pt: "Em francês, a consoante no fim da palavra normalmente **não** se pronuncia: *Paris* = “Pa-ri”, *petit* = “pe-ti”, *beaucoup* = “bo-ku”.\n\nAs exceções mais comuns são c, r, f e l — lembre de **CaReFuL**: *avec*, *bonjour*, *neuf*, *Brésil*.\n\nO -ent dos verbos no plural também é mudo: *ils parlent* soa igual a *il parle*.",
          },
          examples: [
            { fr: "Paris", pt: "(o s não soa)" },
            { fr: "petit", pt: "pequeno (o t não soa)" },
            { fr: "petite", pt: "pequena (agora o t soa)" },
            { fr: "avec", pt: "com (o c soa)" },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "Brasileiros tendem a pronunciar tudo e ainda acrescentar um “i”: “Parisi”, “petiti”. Segure a vontade: termine a palavra na vogal.",
              },
            },
          ],
          introduces: ["pron:silent-final-consonants"],
        },
        {
          id: "a0-u2-l2-a1",
          type: "minimal_pair",
          instruction: say.whichWord,
          pair: [
            { word: "petit", ipa: "/pə.ti/", pt: "pequeno" },
            { word: "petite", ipa: "/pə.tit/", pt: "pequena" },
          ],
          answer: 1,
          targets: [t("pron:silent-final-consonants", "listening")],
        },
        {
          id: "a0-u2-l2-a2",
          type: "minimal_pair",
          instruction: say.whichWord,
          pair: [
            { word: "grand", ipa: "/ɡʁɑ̃/", pt: "grande (m.)" },
            { word: "grande", ipa: "/ɡʁɑ̃d/", pt: "grande (f.)" },
          ],
          answer: 0,
          targets: [t("pron:silent-final-consonants", "listening")],
        },
        {
          id: "a0-u2-l2-a3",
          type: "minimal_pair",
          instruction: say.whichWord,
          pair: [
            { word: "petit", ipa: "/pə.ti/", pt: "pequeno" },
            { word: "petite", ipa: "/pə.tit/", pt: "pequena" },
          ],
          answer: 0,
          targets: [t("pron:silent-final-consonants", "listening")],
        },
        {
          id: "a0-u2-l2-a4",
          type: "dictation",
          instruction: say.dictation,
          audio: { text: "Il est petit.", rate: "slow" },
          accept: ["Il est petit."],
          translation: "Ele é pequeno.",
          targets: [t("pron:silent-final-consonants", "listening", 0.6)],
        },
        {
          id: "a0-u2-l2-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Paris, beaucoup, petit, avec.",
          targets: [t("pron:silent-final-consonants", "pronunciation")],
        },
        {
          id: "a0-u2-l2-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Ils parlent avec Louis.",
          translation: "Eles falam com o Louis.",
          targets: [t("pron:silent-final-consonants", "pronunciation")],
        },
      ],
    },

    // ─── Nasal vowels ───
    {
      id: "a0-u2-l3",
      title: { pt: "As vogais nasais", fr: "Les voyelles nasales" },
      objective: {
        pt: "Reconhecer e produzir on, an/en e in — sem “n” no final.",
        fr: "Reconnaître et produire les voyelles nasales.",
      },
      minutes: 7,
      steps: [
        {
          id: "a0-u2-l3-t1",
          type: "teach",
          title: { pt: "Três vogais pelo nariz" },
          body: {
            pt: "**/ɔ̃/** — *on*: *bon, nom, maison*.\n**/ɑ̃/** — *an, en*: *an, vent, enfant*.\n**/ɛ̃/** — *in, ain, un*: *vin, pain, brésilien*.\n\nO ar sai pelo nariz e pela boca, e a palavra termina **na vogal**: sem “n”, sem “m”, sem “i”.",
          },
          examples: [
            { fr: "bon", pt: "bom" },
            { fr: "vent", pt: "vento" },
            { fr: "vin", pt: "vinho" },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "O português também tem vogais nasais — vantagem sua! O cuidado é não fechar com “n” (*bon* não é “bõn”) e lembrar que, se depois do n vem uma vogal, a vogal deixa de ser nasal: *bon* /bɔ̃/ × *bonne* /bɔn/.",
              },
            },
          ],
          introduces: ["pron:nasal-vowels"],
        },
        {
          id: "a0-u2-l3-a1",
          type: "minimal_pair",
          instruction: say.whichWord,
          pair: [
            { word: "bon", ipa: "/bɔ̃/", pt: "bom" },
            { word: "bonne", ipa: "/bɔn/", pt: "boa" },
          ],
          answer: 0,
          targets: [t("pron:nasal-vowels", "listening")],
        },
        {
          id: "a0-u2-l3-a2",
          type: "minimal_pair",
          instruction: say.whichWord,
          pair: [
            { word: "vin", ipa: "/vɛ̃/", pt: "vinho" },
            { word: "vent", ipa: "/vɑ̃/", pt: "vento" },
          ],
          answer: 1,
          targets: [t("pron:nasal-vowels", "listening")],
        },
        {
          id: "a0-u2-l3-a3",
          type: "minimal_pair",
          instruction: say.whichWord,
          pair: [
            { word: "vent", ipa: "/vɑ̃/", pt: "vento" },
            { word: "vont", ipa: "/vɔ̃/", pt: "vão" },
          ],
          answer: 1,
          targets: [t("pron:nasal-vowels", "listening")],
        },
        {
          id: "a0-u2-l3-a4",
          type: "minimal_pair",
          instruction: say.whichWord,
          pair: [
            { word: "bon", ipa: "/bɔ̃/", pt: "bom" },
            { word: "bonne", ipa: "/bɔn/", pt: "boa" },
          ],
          answer: 1,
          targets: [t("pron:nasal-vowels", "listening")],
        },
        {
          id: "a0-u2-l3-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "un bon vin blanc",
          translation: "um bom vinho branco — quatro vogais nasais seguidas!",
          targets: [t("pron:nasal-vowels", "pronunciation")],
        },
        {
          id: "a0-u2-l3-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Il est brésilien, elle est brésilienne.",
          translation: "Ele é brasileiro, ela é brasileira.",
          targets: [
            t("pron:nasal-vowels", "pronunciation"),
            t("lex:je-suis-bresilien", "speaking", 0.4),
          ],
        },
      ],
    },

    // ─── French R ───
    {
      id: "a0-u2-l4",
      title: { pt: "O R francês", fr: "Le R français" },
      objective: {
        pt: "Produzir o R francês em qualquer posição da palavra.",
        fr: "Prononcer le R français dans toutes les positions.",
      },
      minutes: 6,
      steps: [
        {
          id: "a0-u2-l4-t1",
          type: "teach",
          title: { pt: "Um R no fundo da garganta" },
          body: {
            pt: "O R francês é feito com a parte de trás da língua, perto da garganta — **sempre**, em qualquer posição: *rue, Paris, merci, très*.\n\n1. Comece pelo seu “rr” de “carro”.\n2. Deixe-o mais suave e com a voz vibrando.\n3. A ponta da língua fica parada atrás dos dentes de baixo.",
          },
          examples: [
            { fr: "rue", pt: "rua" },
            { fr: "Paris", pt: "Paris" },
            { fr: "merci", pt: "obrigado" },
            { fr: "très bien", pt: "muito bem" },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "O erro típico é usar o “r” fraco de “caro” entre vogais e depois de consoante: *Paris*, *très*, *trois*. Em francês, esse r fraco não existe.",
              },
            },
          ],
          introduces: ["pron:french-r"],
        },
        {
          id: "a0-u2-l4-a1",
          type: "choice",
          instruction: say.listenChoose,
          prompt: { audio: { text: "rue" }, hideText: true },
          options: ["rue", "lu", "vu"],
          answer: 0,
          targets: [t("pron:french-r", "listening")],
        },
        {
          id: "a0-u2-l4-a2",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "rue, Paris, merci.",
          targets: [t("pron:french-r", "pronunciation")],
        },
        {
          id: "a0-u2-l4-a3",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Très bien, merci !",
          translation: "Muito bem, obrigado!",
          targets: [t("pron:french-r", "pronunciation"), t("lex:merci", "speaking", 0.4)],
        },
        {
          id: "a0-u2-l4-a4",
          type: "choice",
          instruction: { pt: "Em Paris, o R soa como em qual palavra do português?" },
          prompt: { fr: "Paris", audio: { text: "Paris" } },
          options: ["carro (rr)", "caro (r fraco)"],
          optionsLang: "pt",
          answer: 0,
          targets: [t("pron:french-r", "listening", 0.4)],
        },
        {
          id: "a0-u2-l4-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Trois, quatre, Paris, Rio.",
          targets: [t("pron:french-r", "pronunciation")],
        },
      ],
    },
  ],
};
