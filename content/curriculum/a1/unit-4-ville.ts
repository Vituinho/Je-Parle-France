import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitVille: UnitInput = {
  id: "a1-u4",
  level: "A1",
  title: { pt: "Na cidade", fr: "En ville" },
  canDo: {
    pt: "Perguntar se tem um lugar por perto, entender onde ele fica e explicar o caminho com palavras simples.",
    fr: "Demander s'il y a un lieu près d'ici, comprendre où il est et l'expliquer simplement.",
  },
  missionScenario: "scn-directions",
  lessons: [
    {
      id: "a1-u4-l1",
      title: { pt: "Le, la, les", fr: "Le, la, les" },
      objective: {
        pt: "Usar os artigos definidos e aprender os lugares da cidade com o gênero certo.",
        fr: "Utiliser les articles définis avec les lieux de la ville.",
      },
      minutes: 7,
      steps: [
        {
          id: "a1-u4-l1-t1",
          type: "teach",
          title: { pt: "O, a, os, as" },
          body: {
            pt: "**le** (masculino) · **la** (feminino) · **l'** (antes de vogal ou *h* mudo) · **les** (plural, os dois gêneros)\n\nOs lugares desta unidade, já com o artigo:\n*la pharmacie* · *la banque* · *la gare* (estação de trem) · *l'épicerie* · *l'hôpital* · *l'école* · *le parc*",
          },
          examples: [
            { fr: "La pharmacie est ouverte.", pt: "A farmácia está aberta." },
            { fr: "L'hôpital est grand.", pt: "O hospital é grande." },
            { fr: "Les écoles sont fermées le dimanche.", pt: "As escolas fecham no domingo." },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "Nem sempre o gênero coincide: *la voiture* (o carro), *le voyage* (a viagem), *la mer* (o mar). Aprenda cada palavra com o artigo.",
              },
            },
            {
              kind: "quebec",
              text: {
                pt: "No Québec, *l'épicerie* é o supermercado (*faire l'épicerie* = fazer as compras). Na França, é uma mercearia pequena.",
              },
            },
          ],
          introduces: [
            "gram:articles-definis",
            "lex:la-pharmacie",
            "lex:la-banque",
            "lex:la-gare",
            "lex:l-epicerie",
            "lex:l-hopital",
            "lex:l-ecole",
            "lex:le-parc",
          ],
        },
        {
          id: "a1-u4-l1-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "___ hôpital est en ville." },
          options: ["L'", "Le", "La", "Les"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Antes de vogal ou *h* mudo, *le* vira *l'*." },
            { pt: "*Hôpital* é masculino — e começa com som de vogal: *l'*." },
            { pt: "*Les* é plural." },
          ],
          targets: [t("gram:articles-definis", "recognition")],
        },
        {
          id: "a1-u4-l1-a2",
          type: "choice",
          instruction: { pt: "Qual está correto?" },
          prompt: { pt: "O carro está na garagem." },
          options: ["La voiture", "Le voiture", "L'voiture"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*Voiture* é feminino: *la voiture*." },
            { pt: "*L'* só antes de vogal." },
          ],
          targets: [t("gram:articles-definis", "recognition")],
        },
        {
          id: "a1-u4-l1-a3",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "la gare", right: "a estação de trem" },
            { left: "la pharmacie", right: "a farmácia" },
            { left: "l'école", right: "a escola" },
            { left: "la banque", right: "o banco" },
            { left: "le parc", right: "o parque" },
          ],
          targets: [
            t("lex:la-gare", "recognition"),
            t("lex:la-pharmacie", "recognition"),
            t("lex:l-ecole", "recognition"),
            t("lex:la-banque", "recognition"),
            t("lex:le-parc", "recognition"),
          ],
        },
        {
          id: "a1-u4-l1-a4",
          type: "fill",
          instruction: say.complete,
          sentence: "___ banque et ___ épicerie sont fermées, mais ___ parc est ouvert.",
          blanks: [{ accept: ["La", "la"] }, { accept: ["l'"] }, { accept: ["le"] }],
          translation: "O banco e o mercado estão fechados, mas o parque está aberto.",
          targets: [t("gram:articles-definis", "writing")],
        },
        {
          id: "a1-u4-l1-a5",
          type: "type",
          instruction: say.write,
          prompt: { pt: "o hospital" },
          accept: ["l'hôpital"],
          targets: [t("lex:l-hopital", "recall"), t("gram:articles-definis", "writing", 0.5)],
        },
        {
          id: "a1-u4-l1-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "La pharmacie, la banque, l'école et l'hôpital.",
          translation: "A farmácia, o banco, a escola e o hospital.",
          targets: [t("gram:articles-definis", "speaking"), t("lex:l-hopital", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "a1-u4-l2",
      title: { pt: "Au parc, près du métro", fr: "Au parc, près du métro" },
      objective: {
        pt: "Contrair à e de com o artigo e dizer onde as coisas ficam.",
        fr: "Utiliser au, du et situer un lieu.",
      },
      minutes: 7,
      steps: [
        {
          id: "a1-u4-l2-t1",
          type: "teach",
          title: { pt: "Ao, do: o francês também contrai" },
          body: {
            pt: "Como “ao” e “do” em português, o francês junta a preposição com **le** e **les**:\n\n*à + le* → **au** · *à + les* → **aux** · *à la* · *à l'*\n*de + le* → **du** · *de + les* → **des** · *de la* · *de l'*\n\nPara situar: **près de** (perto de) · **à côté de** (ao lado de) · **en face de** (em frente a).",
          },
          examples: [
            { fr: "Je vais au parc.", pt: "Vou ao parque." },
            { fr: "Elle travaille à l'hôpital.", pt: "Ela trabalha no hospital." },
            { fr: "J'habite près du métro.", pt: "Moro perto do metrô." },
            { fr: "La banque est en face de la gare.", pt: "O banco fica em frente à estação." },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "Se em português você diria “ao” ou “do”, em francês é *au* ou *du*. *À le* e *de le* não existem.",
              },
            },
          ],
          introduces: ["gram:contractions-a-de", "lex:pres-de", "lex:a-cote-de", "lex:en-face-de"],
        },
        {
          id: "a1-u4-l2-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Je vais ___ parc avec les enfants." },
          options: ["au", "à le", "à la", "du"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*à + le* sempre vira *au*." },
            { pt: "*Parc* é masculino." },
            { pt: "*du* é *de + le* (“do”). Aqui é “ao parque”." },
          ],
          targets: [t("gram:contractions-a-de", "recognition")],
        },
        {
          id: "a1-u4-l2-a2",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "près de", right: "perto de" },
            { left: "à côté de", right: "ao lado de" },
            { left: "en face de", right: "em frente a" },
          ],
          targets: [
            t("lex:pres-de", "recognition"),
            t("lex:a-cote-de", "recognition"),
            t("lex:en-face-de", "recognition"),
          ],
        },
        {
          id: "a1-u4-l2-a3",
          type: "fill",
          instruction: say.complete,
          sentence: "La pharmacie est à côté ___ banque et en face ___ parc.",
          blanks: [{ accept: ["de la"] }, { accept: ["du"] }],
          translation: "A farmácia fica ao lado do banco e em frente ao parque.",
          targets: [t("gram:contractions-a-de", "writing"), t("lex:a-cote-de", "recall", 0.5)],
        },
        {
          id: "a1-u4-l2-a4",
          type: "error_correction",
          instruction: say.fix,
          sentence: "J'habite près de le métro.",
          accept: ["J'habite près du métro."],
          explanation: { pt: "*de + le* = *du*." },
          targets: [t("gram:contractions-a-de", "writing"), t("lex:pres-de", "recall", 0.5)],
        },
        {
          id: "a1-u4-l2-a5",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Uma vizinha explica onde ficam as coisas no bairro." },
          lines: [
            {
              speaker: "Vizinha",
              text: "L'école est en face du parc. Et la pharmacie ? Elle est à côté de la banque, près de la gare.",
              gender: "f",
            },
          ],
          questions: [
            {
              prompt: { pt: "Onde fica a escola?" },
              options: ["Em frente ao parque", "Ao lado do banco", "Perto da estação"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "E a farmácia?" },
              options: ["Ao lado do banco", "Em frente ao parque", "Dentro da estação"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:en-face-de", "listening"),
            t("lex:a-cote-de", "listening"),
            t("gram:contractions-a-de", "recognition", 0.5),
          ],
        },
        {
          id: "a1-u4-l2-a6",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Vou ao hospital." },
          accept: ["Je vais à l'hôpital."],
          targets: [t("gram:contractions-a-de", "writing")],
        },
        {
          id: "a1-u4-l2-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "J'habite près du parc, à côté de l'école.",
          translation: "Moro perto do parque, ao lado da escola.",
          targets: [t("gram:contractions-a-de", "speaking"), t("lex:pres-de", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "a1-u4-l3",
      title: { pt: "Il y a une pharmacie ?", fr: "Il y a une pharmacie ?" },
      objective: {
        pt: "Perguntar se tem um lugar por perto e entender a resposta.",
        fr: "Demander s'il y a un lieu près d'ici et comprendre la réponse.",
      },
      minutes: 7,
      steps: [
        {
          id: "a1-u4-l3-t1",
          type: "teach",
          title: { pt: "Tem… / Onde fica…?" },
          body: {
            pt: "Para dizer que algo **existe** num lugar: **il y a** — o nosso “tem / há”.\n\n*Il y a une pharmacie près d'ici.* — Tem uma farmácia aqui perto.\n*Il n'y a pas de métro.* — Não tem metrô.\n*Est-ce qu'il y a une banque ici ?* — Tem um banco aqui?\n\nPara perguntar onde fica algo: **Où est…?** — *Où est la gare ?*",
          },
          examples: [
            {
              fr: "Pardon, est-ce qu'il y a une pharmacie près d'ici ?",
              pt: "Com licença, tem uma farmácia aqui perto?",
            },
            {
              fr: "Oui, il y a une pharmacie à côté de la banque.",
              pt: "Sim, tem uma farmácia ao lado do banco.",
            },
            { fr: "Où est la gare ?", pt: "Onde fica a estação?" },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "“Tem” de posse é *avoir* (*il a une voiture*, ele tem um carro). “Tem” de existência é *il y a* (*il y a une voiture*, tem um carro ali).",
              },
            },
          ],
          introduces: ["gram:il-y-a", "lex:ou-est"],
        },
        {
          id: "a1-u4-l3-a1",
          type: "choice",
          instruction: { pt: "Como se diz “Tem uma farmácia aqui”?" },
          prompt: { pt: "Você quer dizer que existe uma farmácia neste lugar." },
          options: [
            "Il y a une pharmacie ici.",
            "Il a une pharmacie ici.",
            "Il est une pharmacie ici.",
          ],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*Il a* é “ele tem” (posse). Existência é *il y a*." },
            { pt: "*Il est* é “ele é / está”." },
          ],
          targets: [t("gram:il-y-a", "recognition")],
        },
        {
          id: "a1-u4-l3-a2",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Na rua, em Québec. *tout droit* = em frente; *à gauche* = à esquerda." },
          lines: [
            {
              speaker: "Turista",
              text: "Pardon, madame, est-ce qu'il y a une épicerie près d'ici ?",
              gender: "m",
              region: "fr-CA",
            },
            {
              speaker: "Senhora",
              text: "Oui, il y a une épicerie tout droit, à gauche, en face de l'école.",
              gender: "f",
              region: "fr-CA",
            },
            { speaker: "Turista", text: "Et une banque ?", gender: "m", region: "fr-CA" },
            {
              speaker: "Senhora",
              text: "Non, il n'y a pas de banque dans le quartier.",
              gender: "f",
              region: "fr-CA",
            },
          ],
          questions: [
            {
              prompt: { pt: "Onde fica o mercado?" },
              options: ["Em frente à escola", "Ao lado do banco", "Perto da estação"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Tem banco no bairro?" },
              options: ["Não", "Sim, ao lado do mercado", "Sim, em frente à escola"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("gram:il-y-a", "recognition"),
            t("lex:l-epicerie", "listening"),
            t("lex:en-face-de", "listening", 0.5),
          ],
        },
        {
          id: "a1-u4-l3-a3",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Il a une banque près de la gare.",
          accept: ["Il y a une banque près de la gare."],
          explanation: { pt: "Para existência, *il y a*." },
          targets: [t("gram:il-y-a", "writing")],
        },
        {
          id: "a1-u4-l3-a4",
          type: "fill",
          instruction: { pt: "Passe para a negativa.", fr: "Mettez à la forme négative." },
          sentence: "Il n'y a pas ___ métro dans ma ville.",
          blanks: [{ accept: ["de"] }],
          translation: "Não tem metrô na minha cidade.",
          targets: [t("gram:il-y-a", "writing"), t("gram:negation-ne-pas", "writing", 0.5)],
        },
        {
          id: "a1-u4-l3-a5",
          type: "order",
          instruction: say.order,
          tokens: ["Est-ce", "qu'il", "y", "a", "une", "pharmacie", "près", "d'ici ?"],
          translation: "Tem uma farmácia aqui perto?",
          targets: [t("gram:il-y-a", "writing"), t("lex:la-pharmacie", "recall", 0.5)],
        },
        {
          id: "a1-u4-l3-a6",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Onde fica a estação de trem?" },
          accept: ["Où est la gare ?"],
          targets: [t("lex:ou-est", "recall"), t("lex:la-gare", "recall")],
        },
        {
          id: "a1-u4-l3-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Pardon, est-ce qu'il y a une banque près d'ici ?",
          translation: "Com licença, tem um banco aqui perto?",
          targets: [t("gram:il-y-a", "speaking"), t("lex:la-banque", "speaking", 0.5)],
        },
      ],
    },
  ],
};
