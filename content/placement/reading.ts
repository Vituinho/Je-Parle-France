import type { PlacementItemInput } from "@/lib/content/schema";

const read = { pt: "Leia o texto e responda.", fr: "Lisez le texte et répondez." };

export const readingItems: PlacementItemInput[] = [
  // ─── A0 ───
  {
    id: "pr-a0-01",
    skill: "reading",
    level: "A0",
    calibration: true,
    topic: "Apresentações",
    concepts: ["lex:je-suis-bresilien", "lex:je-m-appelle"],
    activity: {
      id: "pr-a0-01-q",
      type: "reading",
      instruction: read,
      passage: { text: "Bonjour ! Je m'appelle Lucas. Je suis brésilien. J'habite à Montréal." },
      questions: [
        {
          prompt: { pt: "De onde Lucas é?" },
          options: ["Do Brasil", "Do Canadá", "Da França", "De Portugal"],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pr-a0-02",
    skill: "reading",
    level: "A0",
    offset: 0.25,
    topic: "Cardápios e preços",
    concepts: ["lex:un-croissant"],
    activity: {
      id: "pr-a0-02-q",
      type: "reading",
      instruction: read,
      passage: {
        title: "Café du Coin",
        text: "Café : 2,50 €\nThé : 3,00 €\nCroissant : 1,80 €\nJus d'orange : 4,00 €",
      },
      questions: [
        {
          prompt: { pt: "Quanto custa o croissant?" },
          options: ["1,80 €", "2,50 €", "3,00 €", "4,00 €"],
          answer: 0,
        },
      ],
    },
  },
  // ─── A1 ───
  {
    id: "pr-a1-01",
    skill: "reading",
    level: "A1",
    offset: -0.1,
    calibration: true,
    topic: "Mensagens pessoais",
    activity: {
      id: "pr-a1-01-q",
      type: "reading",
      instruction: read,
      passage: {
        text: "Salut Marie ! Je suis à la gare. Mon train arrive à Lyon à 18 h. On dîne ensemble ce soir ? Bises, Paulo",
      },
      questions: [
        {
          prompt: { pt: "O que Paulo propõe?" },
          options: [
            "Jantar juntos hoje à noite",
            "Pegar o trem juntos",
            "Encontrar Marie na estação de manhã",
            "Viajar para Lyon amanhã",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pr-a1-02",
    skill: "reading",
    level: "A1",
    topic: "Avisos e horários",
    activity: {
      id: "pr-a1-02-q",
      type: "reading",
      instruction: read,
      passage: {
        title: "Pharmacie Centrale",
        text: "Ouverte du lundi au samedi, de 9 h à 19 h.\nFermée le dimanche.",
      },
      questions: [
        {
          prompt: { pt: "Quando a farmácia está fechada?" },
          options: [
            "No domingo",
            "No sábado à tarde",
            "Na segunda de manhã",
            "Na sexta ao meio-dia",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pr-a1-03",
    skill: "reading",
    level: "A1",
    offset: 0.3,
    region: "fr-CA",
    topic: "Anúncios de moradia (Québec)",
    activity: {
      id: "pr-a1-03-q",
      type: "reading",
      instruction: read,
      passage: {
        title: "À louer",
        text: "Grand 3 ½ au centre-ville, chauffé et éclairé. Libre le 1er juillet. 1 150 $ par mois. Animaux non acceptés.",
      },
      questions: [
        {
          prompt: { pt: "O que está incluído no aluguel?" },
          options: ["Aquecimento e eletricidade", "Móveis", "Estacionamento", "Internet"],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  // ─── A2 ───
  {
    id: "pr-a2-01",
    skill: "reading",
    level: "A2",
    calibration: true,
    topic: "E-mails formais simples",
    activity: {
      id: "pr-a2-01-q",
      type: "reading",
      instruction: read,
      passage: {
        text: "Bonjour Madame Tremblay,\n\nJe vous écris parce que le chauffage de mon appartement ne fonctionne plus depuis lundi. Pourriez-vous envoyer quelqu'un cette semaine ?\n\nMerci d'avance.\nCordialement,\nAna Souza",
      },
      questions: [
        {
          prompt: { pt: "Por que Ana escreve?" },
          options: [
            "O aquecimento parou de funcionar",
            "Ela quer pagar o aluguel",
            "Ela vai se mudar",
            "Ela quer marcar uma visita ao apartamento",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pr-a2-02",
    skill: "reading",
    level: "A2",
    offset: -0.25,
    topic: "Previsão do tempo",
    activity: {
      id: "pr-a2-02-q",
      type: "reading",
      instruction: read,
      passage: {
        title: "Météo",
        text: "Demain, la matinée sera nuageuse, avec de la pluie l'après-midi. Les températures resteront fraîches : huit degrés au maximum.",
      },
      questions: [
        {
          prompt: { pt: "Como estará o tempo amanhã à tarde?" },
          options: ["Chuvoso", "Ensolarado", "Com neve", "Muito quente"],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pr-a2-03",
    skill: "reading",
    level: "A2",
    offset: 0.2,
    region: "fr-CA",
    topic: "Ofertas de emprego",
    activity: {
      id: "pr-a2-03-q",
      type: "reading",
      instruction: read,
      passage: {
        title: "Offre d'emploi",
        text: "Café-boulangerie du quartier cherche serveur ou serveuse à temps partiel. Expérience appréciée, mais pas obligatoire. Vous devez être disponible les fins de semaine.",
      },
      questions: [
        {
          prompt: { pt: "Qual destas condições é obrigatória?" },
          options: [
            "Estar disponível nos fins de semana",
            "Ter experiência",
            "Trabalhar em tempo integral",
            "Ter diploma em gastronomia",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  // ─── B1 ───
  {
    id: "pr-b1-01",
    skill: "reading",
    level: "B1",
    calibration: true,
    topic: "Notícias locais",
    activity: {
      id: "pr-b1-01-q",
      type: "reading",
      instruction: read,
      passage: {
        text: "Dans notre quartier, de plus en plus de résidents se rendent au travail à vélo, même en hiver. D'après l'association des cyclistes du quartier, c'est surtout grâce au déneigement régulier des pistes cyclables.",
      },
      questions: [
        {
          prompt: { pt: "Segundo o texto, por que mais pessoas pedalam no inverno?" },
          options: [
            "As ciclovias são limpas da neve regularmente",
            "O transporte público ficou mais caro",
            "Os invernos estão menos frios",
            "Os carros foram proibidos no bairro",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pr-b1-02",
    skill: "reading",
    level: "B1",
    offset: -0.2,
    topic: "Cartas e mensagens pessoais",
    activity: {
      id: "pr-b1-02-q",
      type: "reading",
      instruction: read,
      passage: {
        text: "Chère Julie,\nDésolée de ne pas t'avoir répondu plus tôt : j'ai eu une semaine chargée avec le déménagement. Finalement, l'appartement est plus petit que prévu, mais le quartier me plaît beaucoup. Viens me voir quand tu veux !\nCamila",
      },
      questions: [
        {
          prompt: { pt: "O que Camila acha do novo apartamento?" },
          options: [
            "É menor do que esperava, mas ela gosta do bairro",
            "É grande e bem localizado",
            "É caro e longe do trabalho",
            "Ela ainda não se mudou",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pr-b1-03",
    skill: "reading",
    level: "B1",
    offset: 0.25,
    topic: "Regras e regulamentos",
    activity: {
      id: "pr-b1-03-q",
      type: "reading",
      instruction: read,
      passage: {
        title: "Règlement de l'immeuble",
        text: "Il est interdit de laisser des objets dans les couloirs. Les animaux sont acceptés, à condition qu'ils ne dérangent pas les voisins. Les déchets doivent être déposés dans le local prévu à cet effet.",
      },
      questions: [
        {
          prompt: { pt: "Sob qual condição os animais são aceitos?" },
          options: [
            "Se não incomodarem os vizinhos",
            "Se forem pequenos",
            "Se o dono pagar uma taxa",
            "Os animais nunca são aceitos",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  // ─── B2 ───
  {
    id: "pr-b2-01",
    skill: "reading",
    level: "B2",
    calibration: true,
    topic: "Textos argumentativos",
    activity: {
      id: "pr-b2-01-q",
      type: "reading",
      instruction: read,
      passage: {
        text: "Le télétravail, longtemps présenté comme une solution miracle, montre aujourd'hui ses limites. Si de nombreux salariés apprécient la souplesse qu'il offre, certains dénoncent un isolement croissant et une frontière de plus en plus floue entre vie professionnelle et vie privée.",
      },
      questions: [
        {
          prompt: { pt: "Qual é a posição geral do texto sobre o teletrabalho?" },
          options: [
            "Tem vantagens, mas também limites",
            "É uma solução perfeita",
            "Deveria ser proibido",
            "Os funcionários o rejeitam totalmente",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pr-b2-02",
    skill: "reading",
    level: "B2",
    offset: -0.2,
    topic: "Textos de divulgação",
    activity: {
      id: "pr-b2-02-q",
      type: "reading",
      instruction: read,
      passage: {
        text: "Contrairement à une idée reçue, apprendre une langue à l'âge adulte n'est pas voué à l'échec. Les adultes disposent même d'atouts : une meilleure capacité d'organisation et une motivation souvent plus claire. Ce qui leur manque, en revanche, c'est fréquemment le temps.",
      },
      questions: [
        {
          prompt: { pt: "Segundo o texto, o que costuma faltar aos adultos?" },
          options: ["Tempo", "Motivação", "Organização", "Talento para línguas"],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pr-b2-03",
    skill: "reading",
    level: "B2",
    offset: 0.25,
    topic: "Linguagem de contratos",
    activity: {
      id: "pr-b2-03-q",
      type: "reading",
      instruction: read,
      passage: {
        title: "Extrait d'un bail",
        text: "Le locataire s'engage à aviser le propriétaire de tout dommage dans les plus brefs délais. À défaut, il pourra être tenu responsable des réparations.",
      },
      questions: [
        {
          prompt: { pt: "O que pode acontecer se o inquilino não avisar sobre um dano?" },
          options: [
            "Ele pode ter de pagar os reparos",
            "O contrato é cancelado automaticamente",
            "O proprietário paga uma multa",
            "Nada acontece",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  // ─── C1 ───
  {
    id: "pr-c1-01",
    skill: "reading",
    level: "C1",
    topic: "Ensaios e textos de ideias",
    activity: {
      id: "pr-c1-01-q",
      type: "reading",
      instruction: read,
      passage: {
        text: "Loin de se réduire à un simple outil de communication, la langue façonne notre manière d'appréhender le monde. Encore faut-il se garder des raccourcis : affirmer qu'une langue détermine la pensée relève davantage du mythe que de la démonstration scientifique.",
      },
      questions: [
        {
          prompt: { pt: "Que ideia o autor critica?" },
          options: [
            "A de que a língua determina o pensamento",
            "A de que a língua é só um instrumento de comunicação",
            "O estudo científico das línguas",
            "O ensino de línguas estrangeiras",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
  {
    id: "pr-c1-02",
    skill: "reading",
    level: "C1",
    offset: 0.2,
    topic: "Textos de opinião",
    activity: {
      id: "pr-c1-02-q",
      type: "reading",
      instruction: read,
      passage: {
        text: "Nul n'ignore que la réforme a suscité de vives réactions. Reste à savoir si le gouvernement saura en tirer les leçons ou s'il s'obstinera, au risque d'envenimer davantage le climat social.",
      },
      questions: [
        {
          prompt: { pt: "O que o autor sugere?" },
          options: [
            "Que o governo pode piorar a situação se insistir",
            "Que a reforma foi bem recebida",
            "Que o governo já aprendeu a lição",
            "Que a reforma não gerou reações",
          ],
          optionsLang: "pt",
          answer: 0,
        },
      ],
    },
  },
];
