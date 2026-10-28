import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitBonjour: UnitInput = {
  id: "a0-u1",
  level: "A0",
  title: { pt: "Bonjour!", fr: "Bonjour !" },
  canDo: {
    pt: "Cumprimentar, agradecer, se despedir e se apresentar — com tu ou vous, conforme a situação.",
    fr: "Saluer, remercier, prendre congé et se présenter, en choisissant tu ou vous.",
  },
  missionScenario: "scn-first-meeting",
  lessons: [
    // ─── Lesson 1 ───
    {
      id: "a0-u1-l1",
      title: { pt: "Bonjour, salut, bonsoir", fr: "Bonjour, salut, bonsoir" },
      objective: {
        pt: "Cumprimentar e se despedir no registro certo.",
        fr: "Saluer et prendre congé dans le bon registre.",
      },
      minutes: 6,
      steps: [
        {
          id: "a0-u1-l1-t1",
          type: "teach",
          title: { pt: "Bonjour!", fr: "Bonjour !" },
          body: {
            pt: "*Bonjour* é a palavra mais importante do francês. Ela vale por “bom dia”, “boa tarde” e “olá” — da manhã até o fim da tarde.\n\nCom desconhecidos, é comum completar com *madame* ou *monsieur*.",
            fr: "« Bonjour » s'utilise du matin jusqu'à la fin de l'après-midi.",
          },
          examples: [
            { fr: "Bonjour, madame.", pt: "Bom dia, senhora." },
            { fr: "Bonjour, monsieur.", pt: "Boa tarde, senhor." },
            { fr: "Bonjour, ça va ?", pt: "Olá, tudo bem?" },
          ],
          notes: [
            {
              kind: "culture",
              text: {
                pt: "Na França, entrar numa loja sem dizer *bonjour* é visto como falta de educação. Diga *bonjour* primeiro, depois peça o que quer.",
              },
            },
          ],
          introduces: ["lex:bonjour", "cult:bonjour-social"],
        },
        {
          id: "a0-u1-l1-a1",
          type: "choice",
          instruction: say.meaning,
          prompt: { fr: "Bonjour !", audio: { text: "Bonjour !" } },
          options: ["Bom dia / Olá!", "Boa noite!", "Tchau!", "Obrigado!"],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:bonjour", "recognition")],
        },
        {
          id: "a0-u1-l1-t2",
          type: "teach",
          title: { pt: "Salut e bonsoir" },
          body: {
            pt: "*Salut* é o “oi” entre amigos — e também serve para “tchau”.\n\n*Bonsoir* é o “boa noite” que se diz **ao chegar**, a partir do fim da tarde.",
          },
          examples: [
            { fr: "Salut, Léa !", pt: "Oi, Léa!" },
            { fr: "Bonsoir, monsieur.", pt: "Boa noite, senhor." },
          ],
          notes: [
            {
              kind: "register",
              text: {
                pt: "*Salut* é informal: use com amigos e colegas próximos. Com um atendente ou um desconhecido, diga *bonjour*.",
              },
            },
          ],
          introduces: ["lex:salut", "lex:bonsoir"],
        },
        {
          id: "a0-u1-l1-a2",
          type: "choice",
          instruction: say.situation,
          prompt: { pt: "Você entra numa padaria às 9 da manhã. O que você diz?" },
          options: ["Bonjour !", "Salut !", "Bonsoir !"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*Salut* é informal demais para falar com um atendente." },
            { pt: "*Bonsoir* é para o fim da tarde e a noite." },
          ],
          targets: [t("cult:bonjour-social", "recognition"), t("lex:bonjour", "recognition", 0.6)],
        },
        {
          id: "a0-u1-l1-a3",
          type: "choice",
          instruction: say.listenChoose,
          prompt: { audio: { text: "Bonsoir !" }, hideText: true },
          options: ["Bonsoir", "Bonjour", "Salut"],
          answer: 0,
          targets: [t("lex:bonsoir", "listening")],
        },
        {
          id: "a0-u1-l1-t3",
          type: "teach",
          title: { pt: "Para se despedir", fr: "Pour dire au revoir" },
          body: {
            pt: "*Au revoir* é o “tchau” educado. *À bientôt* = “até breve”. E *bonne journée* deseja um bom dia na hora de ir embora.",
          },
          examples: [
            { fr: "Au revoir, madame !", pt: "Tchau, senhora!" },
            { fr: "Merci, bonne journée !", pt: "Obrigado, tenha um bom dia!" },
            { fr: "À bientôt !", pt: "Até breve!" },
          ],
          notes: [
            {
              kind: "quebec",
              text: {
                pt: "No Québec você pode ouvir *Bonjour !* também na despedida, no sentido de “tenha um bom dia”.",
              },
            },
          ],
          introduces: ["lex:au-revoir", "lex:a-bientot", "lex:bonne-journee"],
        },
        {
          id: "a0-u1-l1-a4",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "bonjour", right: "bom dia, olá" },
            { left: "salut", right: "oi (informal)" },
            { left: "bonsoir", right: "boa noite (ao chegar)" },
            { left: "au revoir", right: "tchau, até logo" },
            { left: "à bientôt", right: "até breve" },
          ],
          targets: [
            t("lex:bonjour", "recognition", 0.5),
            t("lex:salut", "recognition"),
            t("lex:bonsoir", "recognition"),
            t("lex:au-revoir", "recognition"),
            t("lex:a-bientot", "recognition"),
          ],
        },
        {
          id: "a0-u1-l1-a5",
          type: "type",
          instruction: say.write,
          prompt: { pt: "“Tchau!” (de forma educada)" },
          accept: ["Au revoir !"],
          targets: [t("lex:au-revoir", "recall")],
        },
        {
          id: "a0-u1-l1-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Bonjour, madame. Au revoir, monsieur !",
          translation: "Bom dia, senhora. Até logo, senhor!",
          targets: [t("lex:bonjour", "speaking"), t("lex:au-revoir", "speaking")],
        },
      ],
    },

    // ─── Lesson 2 ───
    {
      id: "a0-u1-l2",
      title: { pt: "Merci, s'il vous plaît", fr: "Merci, s'il vous plaît" },
      objective: {
        pt: "Pedir com educação, agradecer e responder a um agradecimento.",
        fr: "Demander poliment, remercier et répondre à un remerciement.",
      },
      minutes: 7,
      steps: [
        {
          id: "a0-u1-l2-t1",
          type: "teach",
          title: { pt: "Merci!", fr: "Merci !" },
          body: {
            pt: "*Merci* = obrigado ou obrigada. *Merci beaucoup* = muito obrigado(a).\n\nDiferente do português, a palavra não muda com quem fala: homens e mulheres dizem *merci*.",
          },
          examples: [
            { fr: "Merci, madame.", pt: "Obrigada, senhora." },
            { fr: "Merci beaucoup !", pt: "Muito obrigado!" },
          ],
          introduces: ["lex:merci", "lex:merci-beaucoup"],
        },
        {
          id: "a0-u1-l2-a1",
          type: "choice",
          instruction: say.listenChoose,
          prompt: { audio: { text: "Merci beaucoup !" }, hideText: true },
          options: ["Merci beaucoup !", "Merci, bonsoir !", "Bonjour, madame !"],
          answer: 0,
          targets: [t("lex:merci-beaucoup", "listening"), t("lex:merci", "listening", 0.5)],
        },
        {
          id: "a0-u1-l2-t2",
          type: "teach",
          title: { pt: "Por favor" },
          body: {
            pt: "Para pedir com educação: *s'il vous plaît* com desconhecidos (ou para várias pessoas) e *s'il te plaît* com amigos e família.\n\nLiteralmente, é “se lhe agrada”.",
          },
          examples: [
            { fr: "Un café, s'il vous plaît.", pt: "Um café, por favor." },
            { fr: "Aide-moi, s'il te plaît.", pt: "Me ajuda, por favor." },
          ],
          notes: [
            {
              kind: "tip",
              text: {
                pt: "Em placas e mensagens você verá a abreviação *SVP*, de *s'il vous plaît*.",
              },
            },
          ],
          introduces: ["lex:s-il-vous-plait", "lex:s-il-te-plait"],
        },
        {
          id: "a0-u1-l2-a2",
          type: "choice",
          instruction: { pt: "Você pede um café ao garçom. Como termina a frase?" },
          prompt: { fr: "Un café, …" },
          options: ["s'il vous plaît.", "s'il te plaît.", "de rien."],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Com um garçom, que você não conhece, use a forma formal: *s'il vous plaît*." },
            { pt: "*De rien* quer dizer “de nada”." },
          ],
          targets: [
            t("lex:s-il-vous-plait", "recognition"),
            t("lex:s-il-te-plait", "recognition", 0.5),
          ],
        },
        {
          id: "a0-u1-l2-t3",
          type: "teach",
          title: { pt: "De nada e com licença" },
          body: {
            pt: "Para responder a um *merci*: *de rien* (“de nada”) ou, mais formal, *je vous en prie*.\n\nPara chamar a atenção de alguém ou pedir desculpa: *excusez-moi*.",
          },
          examples: [
            { fr: "Merci ! — De rien.", pt: "Obrigado! — De nada." },
            { fr: "Merci, madame. — Je vous en prie.", pt: "Obrigado, senhora. — Não há de quê." },
            { fr: "Excusez-moi, monsieur !", pt: "Com licença, senhor!" },
          ],
          notes: [
            {
              kind: "quebec",
              text: {
                pt: "No Québec, muita gente responde *bienvenue !* a um *merci* — é o “de nada” de lá.",
              },
            },
          ],
          introduces: ["lex:de-rien", "lex:je-vous-en-prie", "lex:excusez-moi"],
        },
        {
          id: "a0-u1-l2-a3",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "merci", right: "obrigado(a)" },
            { left: "de rien", right: "de nada" },
            { left: "s'il vous plaît", right: "por favor (formal)" },
            { left: "excusez-moi", right: "com licença" },
          ],
          targets: [
            t("lex:merci", "recognition"),
            t("lex:de-rien", "recognition"),
            t("lex:s-il-vous-plait", "recognition", 0.5),
            t("lex:excusez-moi", "recognition"),
          ],
        },
        {
          id: "a0-u1-l2-a4",
          type: "fill",
          instruction: say.complete,
          sentence: "Un croissant, s'il vous ___.",
          blanks: [{ accept: ["plaît", "plait"] }],
          translation: "Um croissant, por favor.",
          targets: [t("lex:s-il-vous-plait", "recall")],
        },
        {
          id: "a0-u1-l2-a5",
          type: "order",
          instruction: say.order,
          tokens: ["Merci", "beaucoup,", "madame."],
          translation: "Muito obrigada, senhora.",
          targets: [t("lex:merci-beaucoup", "recall")],
        },
        {
          id: "a0-u1-l2-a6",
          type: "dictation",
          instruction: say.dictation,
          audio: { text: "Excusez-moi, monsieur.", rate: "slow" },
          accept: ["Excusez-moi, monsieur."],
          translation: "Com licença, senhor.",
          targets: [t("lex:excusez-moi", "listening"), t("lex:excusez-moi", "recall", 0.5)],
        },
        {
          id: "a0-u1-l2-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Merci beaucoup ! — De rien !",
          translation: "Muito obrigado! — De nada!",
          targets: [t("lex:merci-beaucoup", "speaking"), t("lex:de-rien", "speaking")],
        },
        {
          id: "a0-u1-l2-a8",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Como dizer “com licença” em francês?" },
          accept: ["Excusez-moi."],
          alternatives: [
            {
              text: "Excuse-moi.",
              explanation: {
                pt: "Sua resposta, *excuse-moi*, também vale: é informal e singular. *Excusez-moi* é a forma formal ou plural.",
                fr: "Votre réponse, *excuse-moi*, convient aussi : c'est la forme informelle, au singulier. *Excusez-moi* est la forme de politesse ou le pluriel.",
              },
            },
          ],
          targets: [t("lex:excusez-moi", "recall")],
        },
      ],
    },

    // ─── Lesson 3 ───
    {
      id: "a0-u1-l3",
      title: { pt: "Je m'appelle…", fr: "Je m'appelle…" },
      objective: {
        pt: "Dizer seu nome e de onde você é.",
        fr: "Dire votre prénom et d'où vous venez.",
      },
      minutes: 7,
      steps: [
        {
          id: "a0-u1-l3-t1",
          type: "teach",
          title: { pt: "Je m'appelle…" },
          body: {
            pt: "Para dizer seu nome: *je m'appelle* + nome.\n\nAo conhecer alguém: *enchanté* ou *enchantée* — “muito prazer”.",
          },
          examples: [
            { fr: "Je m'appelle Paulo.", pt: "Eu me chamo Paulo." },
            { fr: "Enchantée, je m'appelle Ana.", pt: "Muito prazer, eu me chamo Ana." },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "Mesma lógica do português “eu **me** chamo”: *je **m'**appelle*. O *me* vira *m'* antes de vogal.",
              },
            },
          ],
          introduces: ["lex:je-m-appelle", "lex:enchante"],
        },
        {
          id: "a0-u1-l3-a1",
          type: "choice",
          instruction: say.meaning,
          prompt: { fr: "Je m'appelle Lucas.", audio: { text: "Je m'appelle Lucas." } },
          options: ["Meu nome é Lucas.", "Eu chamo o Lucas.", "Eu moro com o Lucas."],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:je-m-appelle", "recognition")],
        },
        {
          id: "a0-u1-l3-a2",
          type: "fill",
          instruction: say.complete,
          sentence: "Bonjour, je ___ Camila.",
          blanks: [{ accept: ["m'appelle"] }],
          wordBank: ["m'appelle", "appelle", "suis"],
          translation: "Olá, eu me chamo Camila.",
          targets: [t("lex:je-m-appelle", "recall")],
        },
        {
          id: "a0-u1-l3-t2",
          type: "teach",
          title: { pt: "Nacionalidade e origem" },
          body: {
            pt: "*Je suis brésilien* (homem) e *je suis brésilienne* (mulher) = sou brasileiro(a).\n\n*Je viens du Brésil* = sou do Brasil (literalmente, “venho do Brasil”).",
          },
          examples: [
            { fr: "Je suis brésilien.", pt: "Sou brasileiro." },
            { fr: "Je suis brésilienne.", pt: "Sou brasileira." },
            { fr: "Je viens du Brésil.", pt: "Sou do Brasil." },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "Ouça a diferença: em *brésilien* o final é nasal e o n não soa; em *brésilienne* o n é pronunciado. É assim que se ouve se é homem ou mulher.",
              },
            },
          ],
          introduces: ["lex:je-suis-bresilien", "lex:je-viens-du-bresil"],
        },
        {
          id: "a0-u1-l3-a3",
          type: "choice",
          instruction: say.listenChoose,
          prompt: { audio: { text: "Je suis brésilienne." }, hideText: true },
          options: ["Je suis brésilienne.", "Je suis brésilien."],
          answer: 0,
          explanation: {
            pt: "Em *brésilienne* você ouve o n no final; em *brésilien* o final é nasal.",
          },
          targets: [t("lex:je-suis-bresilien", "listening")],
        },
        {
          id: "a0-u1-l3-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Eu sou do Brasil." },
          accept: ["Je viens du Brésil."],
          targets: [t("lex:je-viens-du-bresil", "recall")],
        },
        {
          id: "a0-u1-l3-t3",
          type: "teach",
          title: { pt: "E você?" },
          body: {
            pt: "Para devolver a pergunta: *et vous ?* (formal) ou *et toi ?* (informal).",
          },
          examples: [
            { fr: "Je m'appelle Ana. Et vous ?", pt: "Eu me chamo Ana. E o senhor?" },
            { fr: "Moi, c'est Léo. Et toi ?", pt: "Eu sou o Léo. E você?" },
          ],
          introduces: ["lex:et-vous"],
        },
        {
          id: "a0-u1-l3-a5",
          type: "listening",
          instruction: say.listen,
          lines: [
            {
              speaker: "Marc",
              text: "Bonjour ! Je m'appelle Marc. Je suis français. Et vous ?",
              gender: "m",
            },
            {
              speaker: "Ana",
              text: "Enchantée ! Je m'appelle Ana. Je viens du Brésil.",
              gender: "f",
            },
          ],
          questions: [
            {
              prompt: { pt: "Como ele se chama?" },
              options: ["Marc", "Luc", "Paul"],
              answer: 0,
            },
            {
              prompt: { pt: "De onde a Ana é?" },
              options: ["Do Brasil", "Da França", "De Portugal"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:je-m-appelle", "listening"),
            t("lex:je-viens-du-bresil", "listening"),
            t("lex:enchante", "listening", 0.5),
          ],
        },
        {
          id: "a0-u1-l3-a6",
          type: "order",
          instruction: say.order,
          tokens: ["Enchantée,", "je", "m'appelle", "Ana."],
          translation: "Muito prazer, eu me chamo Ana.",
          targets: [t("lex:enchante", "recall"), t("lex:je-m-appelle", "recall", 0.5)],
        },
        {
          id: "a0-u1-l3-a7",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Comment vous appelez-vous ?",
            audio: { text: "Comment vous appelez-vous ?" },
          },
          text: "Je m'appelle Ana. Je viens du Brésil.",
          translation: "Responda com o seu nome e a sua origem.",
          targets: [t("lex:je-m-appelle", "speaking"), t("lex:je-viens-du-bresil", "speaking")],
        },
      ],
    },

    // ─── Lesson 4 ───
    {
      id: "a0-u1-l4",
      title: { pt: "Tu ou vous?", fr: "Tu ou vous ?" },
      objective: {
        pt: "Escolher entre tu e vous e perguntar como a pessoa está.",
        fr: "Choisir entre tu et vous et demander des nouvelles.",
      },
      minutes: 8,
      steps: [
        {
          id: "a0-u1-l4-t1",
          type: "teach",
          title: { pt: "Tu ou vous?", fr: "Tu ou vous ?" },
          body: {
            pt: "Em francês você sempre escolhe entre *tu* e *vous*.\n\n*Tu*: amigos, família, crianças, colegas próximos.\n*Vous*: desconhecidos, atendentes, chefes, pessoas mais velhas — e também para falar com **várias** pessoas.\n\nNa dúvida, comece com *vous*.",
          },
          examples: [
            { fr: "Tu t'appelles comment ?", pt: "Como você se chama? (informal)" },
            { fr: "Comment vous appelez-vous ?", pt: "Como o senhor se chama?" },
            { fr: "Vous êtes brésiliens ?", pt: "Vocês são brasileiros?" },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "Em português o “você” cobre os dois casos. Em francês, usar *tu* com um desconhecido pode soar rude — principalmente na França.",
              },
            },
            {
              kind: "quebec",
              text: {
                pt: "No Québec o *tu* é bem mais comum, inclusive entre colegas e às vezes no atendimento. Mesmo assim, comece com *vous* com pessoas mais velhas ou em situações formais.",
              },
            },
          ],
          introduces: ["gram:tu-vous"],
        },
        {
          id: "a0-u1-l4-a1",
          type: "choice",
          instruction: { pt: "Você fala com a sua nova chefe pela primeira vez. Qual você usa?" },
          prompt: { fr: "Bonjour, madame. … êtes la directrice ?" },
          options: ["Vous", "Tu"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Com uma chefe que você acabou de conhecer, o esperado é *vous*." },
          ],
          targets: [t("gram:tu-vous", "recognition")],
        },
        {
          id: "a0-u1-l4-a2",
          type: "choice",
          instruction: { pt: "Você fala com um amigo da sua idade. Qual você usa?" },
          prompt: { fr: "Salut, Hugo ! … viens ce soir ?" },
          options: ["Tu", "Vous"],
          answer: 0,
          optionFeedback: [
            null,
            {
              pt: "Com um amigo, *vous* soa distante — a não ser que você fale com vários amigos ao mesmo tempo.",
            },
          ],
          targets: [t("gram:tu-vous", "recognition")],
        },
        {
          id: "a0-u1-l4-t2",
          type: "teach",
          title: { pt: "Tudo bem?" },
          body: {
            pt: "Informal: *Salut ! Ça va ?* — *Ça va bien, et toi ?*\n\nFormal: *Bonjour, comment allez-vous ?* — *Je vais bien, merci. Et vous ?*",
          },
          examples: [
            { fr: "Salut ! Ça va ?", pt: "Oi! Tudo bem?" },
            { fr: "Comment allez-vous ?", pt: "Como vai o senhor?" },
            { fr: "Comment tu t'appelles ?", pt: "Como você se chama?" },
            { fr: "Comment vous appelez-vous ?", pt: "Como a senhora se chama?" },
          ],
          introduces: [
            "lex:ca-va",
            "lex:comment-allez-vous",
            "lex:comment-tu-t-appelles",
            "lex:comment-vous-appelez-vous",
          ],
        },
        {
          id: "a0-u1-l4-a3",
          type: "match",
          instruction: {
            pt: "Ligue cada pergunta à resposta.",
            fr: "Associez chaque question à sa réponse.",
          },
          pairs: [
            { left: "Ça va ?", right: "Ça va bien, et toi ?" },
            { left: "Comment allez-vous ?", right: "Je vais bien, merci." },
            { left: "Comment tu t'appelles ?", right: "Je m'appelle Léo." },
            { left: "Merci !", right: "De rien." },
          ],
          rightLang: "fr",
          targets: [
            t("lex:ca-va", "recognition"),
            t("lex:comment-allez-vous", "recognition"),
            t("lex:comment-tu-t-appelles", "recognition"),
          ],
        },
        {
          id: "a0-u1-l4-a4",
          type: "multi_select",
          instruction: { pt: "Quais frases usam tu (informal)?" },
          prompt: { pt: "Marque todas as informais." },
          options: [
            "Et toi ?",
            "Comment tu t'appelles ?",
            "S'il te plaît.",
            "Comment allez-vous ?",
            "S'il vous plaît.",
          ],
          answers: [0, 1, 2],
          targets: [t("gram:tu-vous", "recognition")],
        },
        {
          id: "a0-u1-l4-a5",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Dois colegas se conhecem numa universidade em Montréal." },
          lines: [
            {
              speaker: "Julie",
              text: "Salut ! Moi, c'est Julie. Toi, tu t'appelles comment ?",
              gender: "f",
              region: "fr-CA",
            },
            { speaker: "Rafael", text: "Salut ! Rafael. Ça va ?", gender: "m", region: "fr-CA" },
            { speaker: "Julie", text: "Ça va bien !", gender: "f", region: "fr-CA" },
          ],
          questions: [
            {
              prompt: { pt: "Julie usa tu ou vous com o Rafael?" },
              options: ["tu", "vous"],
              answer: 0,
            },
            {
              prompt: { pt: "O que o Rafael pergunta?" },
              options: ["Ça va ?", "Comment allez-vous ?", "Et vous ?"],
              answer: 0,
            },
          ],
          targets: [
            t("lex:comment-tu-t-appelles", "listening"),
            t("lex:ca-va", "listening"),
            t("gram:tu-vous", "recognition", 0.5),
          ],
        },
        {
          id: "a0-u1-l4-a6",
          type: "fill",
          instruction: say.complete,
          sentence: "Bonjour, madame. Comment ___-vous ?",
          blanks: [{ accept: ["allez"] }],
          translation: "Bom dia, senhora. Como vai?",
          targets: [t("lex:comment-allez-vous", "recall")],
        },
        {
          id: "a0-u1-l4-a7",
          type: "type",
          instruction: {
            pt: "Pergunte a um colega, de forma informal:",
            fr: "Demandez à un collègue, de façon familière :",
          },
          prompt: { pt: "Como você se chama?" },
          accept: ["Comment tu t'appelles ?", "Tu t'appelles comment ?", "Comment t'appelles-tu ?"],
          targets: [t("lex:comment-tu-t-appelles", "recall"), t("gram:tu-vous", "writing", 0.6)],
        },
        {
          id: "a0-u1-l4-a8",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Bonjour ! Comment allez-vous ?",
            audio: { text: "Bonjour ! Comment allez-vous ?" },
          },
          text: "Je vais bien, merci. Et vous ?",
          translation: "Vou bem, obrigado. E o senhor?",
          targets: [t("lex:comment-allez-vous", "speaking"), t("gram:tu-vous", "speaking", 0.5)],
        },
      ],
    },
  ],
};
