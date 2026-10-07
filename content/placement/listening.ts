import type { PlacementItemInput } from "@/lib/content/schema";

const listen = { pt: "Ouça e responda.", fr: "Écoutez et répondez." };

export const listeningItems: PlacementItemInput[] = [
  // ─── A0 ───
  {
    id: "pl-a0-01",
    skill: "listening",
    level: "A0",
    topic: "Nomes e apresentações",
    concepts: ["lex:je-m-appelle"],
    activity: {
      id: "pl-a0-01-q",
      type: "listening",
      instruction: listen,
      lines: [{ speaker: "Sophie", text: "Bonjour ! Je m'appelle Sophie. Et vous ?", gender: "f" }],
      questions: [
        {
          prompt: { pt: "Como ela se chama?" },
          options: ["Sophie", "Sylvie", "Sonia", "Julie"],
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pl-a0-02",
    skill: "listening",
    level: "A0",
    offset: 0.25,
    topic: "Preços",
    concepts: ["lex:nombres-0-10", "lex:c-est-combien"],
    activity: {
      id: "pl-a0-02-q",
      type: "listening",
      instruction: listen,
      lines: [
        { speaker: "Cliente", text: "Un café, s'il vous plaît. C'est combien ?", gender: "f" },
        { speaker: "Garçom", text: "Deux euros.", gender: "m" },
      ],
      questions: [
        {
          prompt: { pt: "Quanto custa o café?" },
          options: ["2 €", "12 €", "10 €", "3 €"],
          answer: 0,
        },
      ],
    },
  },
  // ─── A1 ───
  {
    id: "pl-a1-01",
    skill: "listening",
    level: "A1",
    offset: -0.1,
    topic: "Direções",
    activity: {
      id: "pl-a1-01-q",
      type: "listening",
      instruction: listen,
      lines: [
        { speaker: "Turista", text: "Excusez-moi, la gare, c'est loin ?", gender: "f" },
        {
          speaker: "Passante",
          text: "Non, c'est à cinq minutes à pied. Vous allez tout droit, puis à gauche.",
          gender: "m",
        },
      ],
      questions: [
        {
          prompt: { pt: "Como chegar à estação?" },
          options: [
            "Seguir reto e depois virar à esquerda",
            "Virar à direita e depois seguir reto",
            "Pegar o ônibus",
            "Seguir reto por quinze minutos",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pl-a1-02",
    skill: "listening",
    level: "A1",
    offset: 0.2,
    region: "fr-CA",
    topic: "Planos para o fim de semana (Québec)",
    activity: {
      id: "pl-a1-02-q",
      type: "listening",
      instruction: listen,
      lines: [
        {
          speaker: "Julie",
          text: "Salut ! Qu'est-ce que tu fais en fin de semaine ?",
          gender: "f",
          region: "fr-CA",
        },
        {
          speaker: "Marc",
          text: "Samedi, je travaille, mais dimanche, je vais faire du ski avec mon frère.",
          gender: "m",
          region: "fr-CA",
        },
      ],
      questions: [
        {
          prompt: { pt: "O que Marc vai fazer no domingo?" },
          options: ["Esquiar com o irmão", "Trabalhar", "Ficar em casa", "Fazer compras"],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pl-a1-03",
    skill: "listening",
    level: "A1",
    topic: "Marcar horários",
    activity: {
      id: "pl-a1-03-q",
      type: "listening",
      instruction: listen,
      lines: [
        {
          speaker: "Paciente",
          text: "Je voudrais un rendez-vous avec le docteur Martin, s'il vous plaît.",
          gender: "m",
        },
        { speaker: "Secretária", text: "Mardi à dix heures, ça vous va ?", gender: "f" },
        { speaker: "Paciente", text: "Oui, parfait. Merci.", gender: "m" },
      ],
      questions: [
        {
          prompt: { pt: "Quando é a consulta?" },
          options: ["Terça às 10 h", "Quarta às 10 h", "Terça às 2 h", "Quinta às 12 h"],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  // ─── A2 ───
  {
    id: "pl-a2-01",
    skill: "listening",
    level: "A2",
    region: "fr-CA",
    topic: "Telefonemas sobre moradia",
    activity: {
      id: "pl-a2-01-q",
      type: "listening",
      instruction: listen,
      lines: [
        {
          speaker: "Ana",
          text: "Bonjour, j'appelle pour l'appartement sur la rue Saint-Denis. Est-ce qu'il est encore disponible ?",
          gender: "f",
          region: "fr-CA",
        },
        {
          speaker: "Proprietário",
          text: "Oui, il est libre à partir du premier août. Le loyer, c'est mille trois cents dollars par mois, chauffage inclus.",
          gender: "m",
          region: "fr-CA",
        },
      ],
      questions: [
        {
          prompt: { pt: "O que está incluído no aluguel?" },
          options: ["O aquecimento", "A eletricidade", "A internet", "O estacionamento"],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pl-a2-02",
    skill: "listening",
    level: "A2",
    offset: -0.2,
    topic: "Opiniões no passado",
    activity: {
      id: "pl-a2-02-q",
      type: "listening",
      instruction: listen,
      lines: [
        { speaker: "Léa", text: "Tu as vu le film hier soir ?", gender: "f" },
        {
          speaker: "Tom",
          text: "Oui, mais franchement, je me suis ennuyé. C'était beaucoup trop long.",
          gender: "m",
        },
      ],
      questions: [
        {
          prompt: { pt: "O que Tom achou do filme?" },
          options: ["Chato e longo demais", "Excelente", "Engraçado", "Curto demais"],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pl-a2-03",
    skill: "listening",
    level: "A2",
    offset: 0.25,
    topic: "Avisos públicos",
    activity: {
      id: "pl-a2-03-q",
      type: "listening",
      instruction: listen,
      lines: [
        {
          speaker: "Aviso",
          text: "Mesdames et messieurs, le train à destination de Bordeaux partira avec un retard d'environ vingt minutes. Nous vous prions de nous excuser pour ce désagrément.",
          gender: "f",
        },
      ],
      questions: [
        {
          prompt: { pt: "O que acontece com o trem?" },
          options: [
            "Vai atrasar cerca de 20 minutos",
            "Foi cancelado",
            "Mudou de plataforma",
            "Vai partir mais cedo",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  // ─── B1 ───
  {
    id: "pl-b1-01",
    skill: "listening",
    level: "B1",
    topic: "Entrevistas de emprego",
    activity: {
      id: "pl-b1-01-q",
      type: "listening",
      instruction: listen,
      lines: [
        { speaker: "Amiga", text: "Alors, comment s'est passé ton entretien ?", gender: "f" },
        {
          speaker: "Rafael",
          text: "Plutôt bien, je crois. Ils m'ont posé beaucoup de questions sur mon expérience au Brésil. Ils doivent me rappeler d'ici la fin de la semaine.",
          gender: "m",
        },
      ],
      questions: [
        {
          prompt: { pt: "O que deve acontecer até o fim da semana?" },
          options: [
            "A empresa vai ligar de volta",
            "Rafael vai começar a trabalhar",
            "Rafael vai ao Brasil",
            "Rafael terá outra entrevista amanhã",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pl-b1-02",
    skill: "listening",
    level: "B1",
    offset: -0.2,
    region: "fr-CA",
    topic: "Banco (Canadá)",
    activity: {
      id: "pl-b1-02-q",
      type: "listening",
      instruction: listen,
      lines: [
        {
          speaker: "Cliente",
          text: "Bonjour, j'aimerais ouvrir un compte chèques. Je viens d'arriver au Canada.",
          gender: "f",
          region: "fr-CA",
        },
        {
          speaker: "Conselheiro",
          text: "Parfait. Avez-vous une pièce d'identité avec photo et une preuve d'adresse ?",
          gender: "m",
          region: "fr-CA",
        },
      ],
      questions: [
        {
          prompt: { pt: "O que o conselheiro pede?" },
          options: [
            "Documento com foto e comprovante de endereço",
            "Só o passaporte",
            "Um depósito inicial",
            "Uma carta do empregador",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pl-b1-03",
    skill: "listening",
    level: "B1",
    offset: 0.2,
    topic: "Conversas cotidianas",
    activity: {
      id: "pl-b1-03-q",
      type: "listening",
      instruction: listen,
      lines: [
        {
          speaker: "Inès",
          text: "Je trouve que les transports en commun sont trop chers ici.",
          gender: "f",
        },
        {
          speaker: "Karim",
          text: "C'est vrai, mais si tu prends un abonnement mensuel, ça revient beaucoup moins cher.",
          gender: "m",
        },
      ],
      questions: [
        {
          prompt: { pt: "O que Karim sugere?" },
          options: [
            "Comprar um passe mensal",
            "Ir a pé",
            "Usar o carro",
            "Reclamar com a prefeitura",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  // ─── B2 ───
  {
    id: "pl-b2-01",
    skill: "listening",
    level: "B2",
    offset: -0.2,
    region: "fr-CA",
    topic: "Reportagens",
    activity: {
      id: "pl-b2-01-q",
      type: "listening",
      instruction: listen,
      lines: [
        {
          speaker: "Repórter",
          text: "Selon les spécialistes, la pénurie de main-d'œuvre risque de s'aggraver au cours des prochaines années, en particulier dans les secteurs de la santé et de la construction.",
          gender: "m",
          region: "fr-CA",
        },
      ],
      questions: [
        {
          prompt: { pt: "Quais setores são mencionados?" },
          options: [
            "Saúde e construção",
            "Educação e saúde",
            "Tecnologia e comércio",
            "Construção e turismo",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pl-b2-02",
    skill: "listening",
    level: "B2",
    topic: "Opiniões matizadas",
    activity: {
      id: "pl-b2-02-q",
      type: "listening",
      instruction: listen,
      lines: [
        {
          speaker: "Entrevistada",
          text: "Moi, je ne suis pas contre la réforme en soi. Ce qui me dérange, c'est la façon dont elle a été imposée, sans aucune consultation.",
          gender: "f",
        },
      ],
      questions: [
        {
          prompt: { pt: "O que incomoda a entrevistada?" },
          options: [
            "A forma como a reforma foi imposta",
            "O conteúdo da reforma",
            "O custo da reforma",
            "O atraso da reforma",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pl-b2-03",
    skill: "listening",
    level: "B2",
    offset: 0.3,
    topic: "Fala informal e reduzida",
    activity: {
      id: "pl-b2-03-q",
      type: "listening",
      instruction: listen,
      lines: [
        {
          speaker: "Hugo",
          text: "Écoute, je dis pas que t'as tort, mais avoue que t'aurais pu prévenir avant de tout annuler.",
          gender: "m",
        },
      ],
      questions: [
        {
          prompt: { pt: "O que Hugo critica?" },
          options: [
            "Não ter sido avisado antes do cancelamento",
            "A outra pessoa estar errada",
            "O cancelamento ter sido tarde demais",
            "Ninguém ter confessado o erro",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  // ─── C1 ───
  {
    id: "pl-c1-01",
    skill: "listening",
    level: "C1",
    topic: "Discurso analítico",
    activity: {
      id: "pl-c1-01-q",
      type: "listening",
      instruction: listen,
      lines: [
        {
          speaker: "Economista",
          text: "Il serait réducteur d'attribuer cette baisse uniquement à la conjoncture économique ; des facteurs démographiques entrent aussi en ligne de compte.",
          gender: "f",
        },
      ],
      questions: [
        {
          prompt: { pt: "O que a economista afirma?" },
          options: [
            "Fatores demográficos também explicam a queda",
            "A queda se deve só à economia",
            "A demografia não tem importância",
            "A economia vai melhorar em breve",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pl-c1-02",
    skill: "listening",
    level: "C1",
    offset: 0.25,
    topic: "Expressões idiomáticas na fala",
    activity: {
      id: "pl-c1-02-q",
      type: "listening",
      instruction: listen,
      lines: [
        {
          speaker: "Gerente",
          text: "Bon, on va pas se mentir : le projet battait de l'aile depuis des mois, et tout le monde le savait sans oser le dire.",
          gender: "m",
        },
      ],
      questions: [
        {
          prompt: { pt: "Qual era a situação do projeto?" },
          options: [
            "Ia mal havia meses",
            "Estava perto de terminar",
            "Era um grande sucesso",
            "Ainda não tinha começado",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
];
