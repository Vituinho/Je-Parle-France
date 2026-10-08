import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitSInstaller: UnitInput = {
  id: "ca-u2",
  level: "A1",
  track: "canada",
  region: "fr-CA",
  title: { pt: "Chegar e se instalar", fr: "Arriver et s'installer" },
  canDo: {
    pt: "Responder às perguntas da imigração, abrir uma conta no banco e entender um anúncio de apartamento em Montréal.",
    fr: "Répondre aux questions à la frontière, ouvrir un compte et comprendre une annonce de logement à Montréal.",
  },
  missionScenario: "scn-bank-canada",
  lessons: [
    {
      id: "ca-u2-l1",
      title: { pt: "No aeroporto", fr: "À l'aéroport" },
      objective: {
        pt: "Entender e responder às perguntas básicas da imigração.",
        fr: "Comprendre et répondre aux questions de base à la frontière.",
      },
      minutes: 7,
      steps: [
        {
          id: "ca-u2-l1-t1",
          type: "teach",
          title: { pt: "As perguntas do agente" },
          body: {
            pt: "Na chegada, o agente de fronteira costuma fazer perguntas curtas. Você não precisa de frases longas: entenda a pergunta e responda o essencial.\n\n*Votre passeport, s'il vous plaît.* — Seu passaporte.\n*Quel est le but de votre voyage ?* — Qual é o motivo da viagem?\n*Combien de temps restez-vous ?* — Quanto tempo vai ficar?",
          },
          examples: [
            { fr: "Votre passeport, s'il vous plaît.", pt: "Seu passaporte, por favor." },
            { fr: "Quel est le but de votre voyage ?", pt: "Qual é o motivo da sua viagem?" },
            {
              fr: "Combien de temps restez-vous au Canada ?",
              pt: "Quanto tempo o senhor fica no Canadá?",
            },
          ],
          notes: [
            {
              kind: "tip",
              text: {
                pt: "Se não entender, peça com calma: *Pouvez-vous répéter, s'il vous plaît ?* (Pode repetir, por favor?). Em Montréal o atendimento também pode ser em inglês.",
              },
            },
          ],
          introduces: ["lex:le-passeport", "lex:le-but-du-voyage", "lex:combien-de-temps"],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u2-l1-t2",
          type: "teach",
          title: { pt: "Por que você veio" },
          body: {
            pt: "*Je suis ici pour* + verbo no infinitivo explica o motivo: *travailler* (trabalhar), *étudier* (estudar), *visiter* (visitar).\n\nPara falar do seu documento: *J'ai un permis de travail* ou *J'ai un permis d'études*.",
          },
          examples: [
            { fr: "Je suis ici pour travailler.", pt: "Estou aqui para trabalhar." },
            { fr: "J'ai un permis d'études.", pt: "Tenho uma autorização de estudos." },
            { fr: "Deux ans.", pt: "Dois anos." },
          ],
          notes: [
            {
              kind: "tip",
              text: {
                pt: "Tenha à mão os documentos que o governo canadense pediu para a sua situação. Este curso ensina a língua — para regras de imigração, consulte sempre os canais oficiais.",
              },
            },
          ],
          introduces: [
            "lex:je-suis-ici-pour",
            "lex:un-permis-de-travail",
            "lex:un-permis-d-etudes",
          ],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u2-l1-a1",
          type: "listening",
          instruction: say.listen,
          context: { pt: "No aeroporto de Montréal-Trudeau. *deux ans* = dois anos." },
          lines: [
            {
              speaker: "Agente",
              text: "Bonjour. Votre passeport, s'il vous plaît.",
              gender: "m",
              region: "fr-CA",
            },
            { speaker: "Viajante", text: "Bonjour. Voilà.", gender: "f", region: "fr-CA" },
            {
              speaker: "Agente",
              text: "Quel est le but de votre voyage ?",
              gender: "m",
              region: "fr-CA",
            },
            {
              speaker: "Viajante",
              text: "Je suis ici pour étudier. J'ai un permis d'études.",
              gender: "f",
              region: "fr-CA",
            },
            {
              speaker: "Agente",
              text: "Combien de temps restez-vous au Canada ?",
              gender: "m",
              region: "fr-CA",
            },
            { speaker: "Viajante", text: "Deux ans.", gender: "f", region: "fr-CA" },
          ],
          questions: [
            {
              prompt: { pt: "Por que ela vem ao Canadá?" },
              options: ["Para estudar", "Para trabalhar", "Para visitar a família"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Quanto tempo ela vai ficar?" },
              options: ["Dois anos", "Duas semanas", "Doze anos"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:je-suis-ici-pour", "listening"),
            t("lex:un-permis-d-etudes", "listening"),
            t("lex:combien-de-temps", "listening"),
          ],
        },
        {
          id: "ca-u2-l1-a2",
          type: "choice",
          instruction: { pt: "O que o agente quer saber?" },
          prompt: {
            fr: "Quel est le but de votre voyage ?",
            audio: { text: "Quel est le but de votre voyage ?", region: "fr-CA", gender: "m" },
          },
          options: ["O motivo da viagem", "Quanto tempo você fica", "Onde você vai morar"],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:le-but-du-voyage", "recognition")],
        },
        {
          id: "ca-u2-l1-a3",
          type: "choice",
          instruction: { pt: "O que o agente quer saber?" },
          prompt: {
            fr: "Combien de temps restez-vous ?",
            audio: { text: "Combien de temps restez-vous ?", region: "fr-CA", gender: "m" },
          },
          options: ["Quanto tempo você vai ficar", "Quanto custa a estadia", "Quando você chegou"],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:combien-de-temps", "recognition")],
        },
        {
          id: "ca-u2-l1-a4",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "le passeport", right: "o passaporte" },
            { left: "un permis de travail", right: "uma autorização de trabalho" },
            { left: "un permis d'études", right: "uma autorização de estudos" },
            { left: "le but du voyage", right: "o motivo da viagem" },
          ],
          targets: [
            t("lex:le-passeport", "recognition"),
            t("lex:un-permis-de-travail", "recognition"),
            t("lex:un-permis-d-etudes", "recognition"),
            t("lex:le-but-du-voyage", "recognition", 0.5),
          ],
        },
        {
          id: "ca-u2-l1-a5",
          type: "order",
          instruction: say.order,
          tokens: ["Je", "suis", "ici", "pour", "travailler."],
          translation: "Estou aqui para trabalhar.",
          targets: [t("lex:je-suis-ici-pour", "recall")],
        },
        {
          id: "ca-u2-l1-a6",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Tenho uma autorização de trabalho." },
          accept: ["J'ai un permis de travail."],
          targets: [t("lex:un-permis-de-travail", "recall")],
        },
        {
          id: "ca-u2-l1-a7",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Quel est le but de votre voyage ?",
            audio: { text: "Quel est le but de votre voyage ?", region: "fr-CA", gender: "m" },
          },
          text: "Je suis ici pour travailler.",
          accept: [
            "Je suis ici pour travailler.",
            "Je suis ici pour étudier.",
            "Je suis ici pour visiter.",
          ],
          translation: "Estou aqui para trabalhar.",
          region: "fr-CA",
          targets: [t("lex:je-suis-ici-pour", "speaking")],
        },
      ],
    },
    {
      id: "ca-u2-l2",
      title: { pt: "No banco", fr: "À la banque" },
      objective: {
        pt: "Dizer do que você precisa e entender os documentos pedidos.",
        fr: "Dire ce dont vous avez besoin et comprendre les documents demandés.",
      },
      minutes: 7,
      steps: [
        {
          id: "ca-u2-l2-t1",
          type: "teach",
          title: { pt: "Eu preciso de…" },
          body: {
            pt: "“Precisar” em francês é **avoir besoin de** — literalmente “ter necessidade de”: *j'ai besoin de*, *tu as besoin de*…\n\nNum banco ou num guichê, soa ainda mais educado dizer **j'aurais besoin de** (“eu precisaria de”), como o nosso “eu queria”.",
          },
          examples: [
            { fr: "J'ai besoin d'ouvrir un compte.", pt: "Preciso abrir uma conta." },
            { fr: "J'aurais besoin d'un renseignement.", pt: "Eu precisaria de uma informação." },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "*Je besoin* é um dos erros mais comuns de brasileiros: falta o verbo *avoir*. Pense sempre “eu **tenho** necessidade”: *j'ai besoin*.",
              },
            },
          ],
          introduces: ["lex:avoir-besoin-de", "lex:j-aurais-besoin-de", "lex:ouvrir-un-compte"],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u2-l2-t2",
          type: "teach",
          title: { pt: "Os documentos e o cartão" },
          body: {
            pt: "Para abrir uma conta, o banco pede **une pièce d'identité** com foto (o passaporte serve) e, muitas vezes, **une preuve d'adresse** (um comprovante de endereço).\n\nVocê recebe **une carte de débit**. A senha dela, no Québec, é **le NIP**.",
          },
          examples: [
            {
              fr: "Vous avez une pièce d'identité avec photo ?",
              pt: "O senhor tem um documento com foto?",
            },
            { fr: "Il faut une preuve d'adresse.", pt: "É preciso um comprovante de endereço." },
            { fr: "Entrez votre NIP.", pt: "Digite sua senha." },
          ],
          notes: [
            {
              kind: "france",
              text: { pt: "Na França, a senha do cartão é *le code*." },
            },
          ],
          introduces: [
            "lex:une-piece-d-identite",
            "lex:une-preuve-d-adresse",
            "lex:une-carte-de-debit",
            "lex:le-nip",
          ],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u2-l2-a1",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Je besoin d'ouvrir un compte.",
          accept: ["J'ai besoin d'ouvrir un compte."],
          explanation: { pt: "“Precisar” é *avoir besoin*: **j'ai** besoin." },
          targets: [t("lex:avoir-besoin-de", "recall")],
        },
        {
          id: "ca-u2-l2-a2",
          type: "choice",
          instruction: { pt: "Qual é o pedido mais educado num banco?" },
          prompt: { pt: "Você quer um cartão de débito." },
          options: [
            "J'aurais besoin d'une carte de débit.",
            "Je veux une carte de débit.",
            "Une carte de débit !",
          ],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*Je veux* soa exigente. *J'aurais besoin de* é mais educado." },
            { pt: "Sem verbo e sem *s'il vous plaît* soa seco demais." },
          ],
          targets: [t("lex:j-aurais-besoin-de", "recognition")],
        },
        {
          id: "ca-u2-l2-a3",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "une pièce d'identité", right: "um documento de identidade" },
            { left: "une preuve d'adresse", right: "um comprovante de endereço" },
            { left: "une carte de débit", right: "um cartão de débito" },
            { left: "le NIP", right: "a senha do cartão" },
          ],
          targets: [
            t("lex:une-piece-d-identite", "recognition"),
            t("lex:une-preuve-d-adresse", "recognition"),
            t("lex:une-carte-de-debit", "recognition"),
            t("lex:le-nip", "recognition"),
          ],
        },
        {
          id: "ca-u2-l2-a4",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Numa agência bancária em Montréal." },
          lines: [
            {
              speaker: "Conselheira",
              text: "Bonjour ! Comment est-ce que je peux vous aider ?",
              gender: "f",
              region: "fr-CA",
            },
            {
              speaker: "Cliente",
              text: "Bonjour. J'aurais besoin d'ouvrir un compte.",
              gender: "m",
              region: "fr-CA",
            },
            {
              speaker: "Conselheira",
              text: "Parfait. Vous avez une pièce d'identité avec photo ?",
              gender: "f",
              region: "fr-CA",
            },
            { speaker: "Cliente", text: "Oui, mon passeport.", gender: "m", region: "fr-CA" },
            {
              speaker: "Conselheira",
              text: "Et une preuve d'adresse ?",
              gender: "f",
              region: "fr-CA",
            },
            { speaker: "Cliente", text: "Oui, voilà.", gender: "m", region: "fr-CA" },
          ],
          questions: [
            {
              prompt: { pt: "O que o cliente quer?" },
              options: ["Abrir uma conta", "Pedir um cartão de crédito", "Mudar de endereço"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Que documento com foto ele mostra?" },
              options: ["O passaporte", "A carteira de motorista", "Um comprovante de endereço"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:j-aurais-besoin-de", "listening"),
            t("lex:ouvrir-un-compte", "listening"),
            t("lex:une-piece-d-identite", "listening", 0.5),
          ],
        },
        {
          id: "ca-u2-l2-a5",
          type: "fill",
          instruction: say.complete,
          sentence: "J'___ besoin d'une preuve d'adresse ?",
          blanks: [{ accept: ["ai"] }],
          wordBank: ["ai", "suis", "besoin"],
          translation: "Eu preciso de um comprovante de endereço?",
          targets: [t("lex:avoir-besoin-de", "recall")],
        },
        {
          id: "ca-u2-l2-a6",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Eu precisaria de um cartão de débito." },
          accept: ["J'aurais besoin d'une carte de débit."],
          targets: [
            t("lex:j-aurais-besoin-de", "recall"),
            t("lex:une-carte-de-debit", "recall", 0.5),
          ],
        },
        {
          id: "ca-u2-l2-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Bonjour, j'aurais besoin d'ouvrir un compte.",
          translation: "Bom dia, eu precisaria abrir uma conta.",
          region: "fr-CA",
          targets: [
            t("lex:j-aurais-besoin-de", "speaking"),
            t("lex:ouvrir-un-compte", "speaking", 0.5),
          ],
        },
      ],
    },
    {
      id: "ca-u2-l3",
      title: { pt: "Procurar apartamento", fr: "Chercher un appartement" },
      objective: {
        pt: "Entender um anúncio de apartamento em Montréal e perguntar o aluguel.",
        fr: "Comprendre une annonce de logement à Montréal et demander le loyer.",
      },
      minutes: 7,
      steps: [
        {
          id: "ca-u2-l3-t1",
          type: "teach",
          title: { pt: "Os anúncios: 3 ½, 4 ½…" },
          body: {
            pt: "Em Montréal, os apartamentos são contados em cômodos, incluindo a cozinha, e o banheiro vale “meio”:\n\n**un 3 ½** (*trois et demi*): sala, cozinha, um quarto e banheiro\n**un 4 ½** (*quatre et demi*): sala, cozinha, dois quartos e banheiro\n\n*À louer* = para alugar. *Chauffé, éclairé* = aquecimento e eletricidade incluídos no aluguel — um detalhe importante no inverno.",
          },
          examples: [
            {
              fr: "4 ½ à louer, près du métro.",
              pt: "Apartamento de dois quartos para alugar, perto do metrô.",
            },
            {
              fr: "Le loyer est de 1 200 $, chauffé, éclairé.",
              pt: "O aluguel é de 1 200 $, com aquecimento e luz incluídos.",
            },
          ],
          notes: [
            {
              kind: "france",
              text: {
                pt: "Na França a conta é outra: *un deux-pièces* tem sala e um quarto, sem contar cozinha e banheiro.",
              },
            },
          ],
          introduces: ["lex:a-louer", "lex:un-quatre-et-demi", "lex:chauffe-eclaire"],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u2-l3-t2",
          type: "teach",
          title: { pt: "Aluguel, contrato, proprietário" },
          body: {
            pt: "**Le loyer** é o valor mensal do aluguel. **Le bail** é o contrato — no Québec, num formulário oficial e quase sempre de 12 meses. Quem aluga é **le/la propriétaire**.\n\nComo muitos contratos terminam em 30 de junho, o 1º de julho é o grande dia da mudança no Québec.",
          },
          examples: [
            { fr: "Le loyer, c'est combien ?", pt: "Quanto é o aluguel?" },
            { fr: "Un bail de douze mois.", pt: "Um contrato de doze meses." },
            { fr: "J'appelle le propriétaire.", pt: "Vou ligar para o proprietário." },
          ],
          introduces: [
            "lex:le-loyer",
            "lex:le-bail",
            "lex:le-proprietaire",
            "cult:premier-juillet",
          ],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u2-l3-a1",
          type: "reading",
          instruction: { pt: "Leia o anúncio e responda.", fr: "Lisez l'annonce et répondez." },
          passage: {
            title: "À louer — Rosemont",
            text: "Grand 4 ½ à louer, près du métro. Chauffé, éclairé. 1 450 $ par mois. Libre le 1er juillet. Bail de 12 mois. Pas d'animaux. Contactez le propriétaire : 514 555-0199.",
          },
          questions: [
            {
              prompt: { pt: "Quantos quartos tem o apartamento?" },
              options: ["Dois", "Quatro", "Um"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que está incluído no aluguel?" },
              options: ["Aquecimento e eletricidade", "Os móveis", "Internet"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "A partir de quando o apartamento está livre?" },
              options: ["1º de julho", "12 de julho", "Daqui a 12 meses"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:un-quatre-et-demi", "recognition"),
            t("lex:chauffe-eclaire", "recognition"),
            t("cult:premier-juillet", "recognition", 0.5),
          ],
        },
        {
          id: "ca-u2-l3-a2",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "le loyer", right: "o aluguel (valor)" },
            { left: "le bail", right: "o contrato" },
            { left: "le propriétaire", right: "o proprietário" },
            { left: "à louer", right: "para alugar" },
          ],
          targets: [
            t("lex:le-loyer", "recognition"),
            t("lex:le-bail", "recognition"),
            t("lex:le-proprietaire", "recognition"),
            t("lex:a-louer", "recognition"),
          ],
        },
        {
          id: "ca-u2-l3-a3",
          type: "listening",
          instruction: say.listen,
          context: {
            pt: "Uma ligação sobre o anúncio. *mille quatre cents* = mil e quatrocentos.",
          },
          lines: [
            {
              speaker: "Inquilina",
              text: "Allô, bonjour ! J'appelle pour le 4 ½ à louer.",
              gender: "f",
              region: "fr-CA",
            },
            {
              speaker: "Proprietário",
              text: "Bonjour ! Oui, il est encore libre.",
              gender: "m",
              region: "fr-CA",
            },
            {
              speaker: "Inquilina",
              text: "Le loyer, c'est combien ?",
              gender: "f",
              region: "fr-CA",
            },
            {
              speaker: "Proprietário",
              text: "Mille quatre cents dollars par mois, chauffé, éclairé.",
              gender: "m",
              region: "fr-CA",
            },
          ],
          questions: [
            {
              prompt: { pt: "Quanto é o aluguel?" },
              options: ["1 400 dólares", "1 450 dólares", "400 dólares"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O aquecimento está incluído?" },
              options: ["Sim, e a eletricidade também", "Não, só a eletricidade", "Não"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:le-loyer", "listening"), t("lex:chauffe-eclaire", "listening")],
        },
        {
          id: "ca-u2-l3-a4",
          type: "fill",
          instruction: say.complete,
          sentence: "Le ___ est de 1 200 $ par mois, chauffé, éclairé.",
          blanks: [{ accept: ["loyer"] }],
          wordBank: ["loyer", "bail", "propriétaire"],
          translation: "O aluguel é de 1 200 $ por mês, com aquecimento e luz.",
          targets: [t("lex:le-loyer", "recall")],
        },
        {
          id: "ca-u2-l3-a5",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Um contrato de doze meses." },
          accept: ["Un bail de douze mois.", "Un bail de 12 mois."],
          targets: [t("lex:le-bail", "recall")],
        },
        {
          id: "ca-u2-l3-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Bonjour ! J'appelle pour le quatre et demi à louer.",
          translation:
            "Bom dia! Estou ligando por causa do apartamento de dois quartos para alugar.",
          region: "fr-CA",
          targets: [t("lex:un-quatre-et-demi", "speaking"), t("lex:a-louer", "speaking", 0.5)],
        },
      ],
    },
  ],
};
