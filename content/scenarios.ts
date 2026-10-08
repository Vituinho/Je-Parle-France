import type { ScenarioInput } from "@/lib/content/schema";

/**
 * Roleplay scenarios for the AI tutor. `aiRole` is written in French for the
 * model; everything shown to the learner is localized.
 */
export const scenarios: ScenarioInput[] = [
  {
    id: "scn-first-meeting",
    track: "core",
    minLevel: "A0",
    title: { pt: "Primeiro encontro", fr: "Première rencontre" },
    setting: {
      pt: "Numa festa de boas-vindas, você conhece alguém pela primeira vez.",
      fr: "À une fête d'accueil, vous rencontrez quelqu'un pour la première fois.",
    },
    aiRole:
      "Tu es Camille, une personne sympathique qui rencontre l'apprenant à une fête. Tu te présentes, tu demandes son prénom, d'où il vient et comment il va.",
    learnerGoal: {
      pt: "Cumprimentar, dizer seu nome e de onde você é, e perguntar o mesmo.",
      fr: "Saluer, dire votre prénom et d'où vous venez, et poser les mêmes questions.",
    },
    openingLine: "Salut ! Moi, c'est Camille. Et toi, tu t'appelles comment ?",
    keyConcepts: ["lex:je-m-appelle", "lex:je-viens-du-bresil", "lex:ca-va", "lex:enchante"],
  },
  {
    id: "scn-directions",
    track: "core",
    minLevel: "A1",
    title: { pt: "Pedir informação na rua", fr: "Demander son chemin" },
    setting: {
      pt: "Você acabou de se mudar e procura uma farmácia, um banco e a estação. Uma pessoa na rua ajuda.",
      fr: "Vous venez d'arriver dans le quartier et cherchez une pharmacie, une banque et la gare.",
    },
    aiRole:
      "Tu es une personne sympathique du quartier. L'apprenant cherche des lieux (pharmacie, banque, gare, épicerie, parc). Tu expliques simplement où ils sont avec « près de », « à côté de », « en face de », « tout droit », « à gauche », « à droite ». Tu vouvoies et tu parles lentement.",
    learnerGoal: {
      pt: "Perguntar se tem um lugar perto, entender onde fica e agradecer.",
      fr: "Demander s'il y a un lieu près d'ici, comprendre où il se trouve et remercier.",
    },
    openingLine: "Bonjour ! Vous cherchez quelque chose ?",
    keyConcepts: [
      "gram:il-y-a",
      "gram:contractions-a-de",
      "lex:ou-est",
      "lex:pres-de",
      "lex:a-cote-de",
      "lex:en-face-de",
    ],
  },
  {
    id: "scn-cafe-paris",
    track: "france",
    region: "fr-FR",
    minLevel: "A0",
    title: { pt: "Num café em Paris", fr: "Dans un café à Paris" },
    setting: {
      pt: "Você está num café parisiense e quer pedir algo, perguntar o preço e pagar.",
      fr: "Vous êtes dans un café parisien : commandez, demandez le prix et payez.",
    },
    aiRole:
      "Tu es un serveur dans un café à Paris. Tu es poli et efficace, tu vouvoies le client. Tu proposes la carte (café, thé, croissant, jus d'orange), tu annonces les prix en euros et tu demandes comment il veut payer.",
    learnerGoal: {
      pt: "Pedir educadamente, perguntar quanto custa e pagar.",
      fr: "Commander poliment, demander le prix et payer.",
    },
    openingLine: "Bonjour ! Qu'est-ce que je vous sers ?",
    keyConcepts: ["lex:je-voudrais", "lex:c-est-combien", "lex:l-addition", "lex:par-carte"],
  },
  {
    id: "scn-cafe-montreal",
    track: "canada",
    region: "fr-CA",
    minLevel: "A0",
    title: { pt: "Num café em Montréal", fr: "Dans un café à Montréal" },
    setting: {
      pt: "Num café de Montréal: peça algo para levar e pague.",
      fr: "Dans un café de Montréal : commandez pour emporter et payez.",
    },
    aiRole:
      "Tu es un barista dans un café de Montréal. Tu es chaleureux, tu peux tutoyer ou vouvoyer selon le client. Tu demandes « pour ici ou pour emporter ? », tu annonces les prix en dollars et tu proposes de payer par carte.",
    learnerGoal: {
      pt: "Pedir uma bebida, dizer se é para levar e pagar.",
      fr: "Commander une boisson, préciser pour emporter et payer.",
    },
    openingLine: "Bonjour ! Qu'est-ce que je peux faire pour vous ?",
    keyConcepts: ["lex:je-voudrais", "lex:sur-place-ou-a-emporter", "lex:par-carte"],
  },
  {
    id: "scn-airport-canada",
    track: "canada",
    region: "fr-CA",
    minLevel: "A1",
    title: { pt: "Chegada ao aeroporto", fr: "Arrivée à l'aéroport" },
    setting: {
      pt: "Você acaba de chegar ao aeroporto de Montréal e fala com um agente de imigração.",
      fr: "Vous arrivez à l'aéroport de Montréal et parlez à un agent des services frontaliers.",
    },
    aiRole:
      "Tu es un agent des services frontaliers à l'aéroport de Montréal-Trudeau. Tu es professionnel et tu vouvoies. Tu poses des questions simples : le but du voyage, la durée du séjour, l'adresse au Canada, la profession. Tu parles lentement et clairement.",
    learnerGoal: {
      pt: "Responder às perguntas básicas de imigração com frases simples.",
      fr: "Répondre aux questions de base avec des phrases simples.",
    },
    openingLine: "Bonjour. Votre passeport, s'il vous plaît. Quel est le but de votre voyage ?",
    keyConcepts: [
      "lex:le-passeport",
      "lex:le-but-du-voyage",
      "lex:je-suis-ici-pour",
      "lex:combien-de-temps",
      "lex:un-permis-de-travail",
    ],
  },
  {
    id: "scn-bank-canada",
    track: "canada",
    region: "fr-CA",
    minLevel: "A1",
    title: { pt: "Abrir uma conta no banco", fr: "Ouvrir un compte à la banque" },
    setting: {
      pt: "Você vai a uma agência bancária em Montréal para abrir sua primeira conta.",
      fr: "Vous allez dans une succursale bancaire à Montréal pour ouvrir votre premier compte.",
    },
    aiRole:
      "Tu es conseiller ou conseillère dans une banque à Montréal. Tu aides un nouvel arrivant à ouvrir un compte chèques. Tu demandes une pièce d'identité avec photo et une preuve d'adresse, tu expliques la carte de débit et tu restes patient.",
    learnerGoal: {
      pt: "Dizer o que você precisa, entender os documentos pedidos e fazer perguntas.",
      fr: "Expliquer ce dont vous avez besoin, comprendre les documents demandés et poser des questions.",
    },
    openingLine: "Bonjour ! Bienvenue. Comment est-ce que je peux vous aider aujourd'hui ?",
    keyConcepts: [
      "lex:avoir-besoin-de",
      "lex:ouvrir-un-compte",
      "lex:j-aurais-besoin-de",
      "lex:une-piece-d-identite",
      "lex:une-carte-de-debit",
    ],
  },
  {
    id: "scn-boulangerie",
    track: "france",
    region: "fr-FR",
    minLevel: "A0",
    title: { pt: "Na boulangerie", fr: "À la boulangerie" },
    setting: {
      pt: "Numa padaria francesa, compre pão e algo para o café da manhã.",
      fr: "Dans une boulangerie française, achetez du pain et quelque chose pour le petit-déjeuner.",
    },
    aiRole:
      "Tu es boulangère dans un quartier de Lyon. Tu vouvoies, tu proposes baguette, pain au chocolat, croissant, et tu annonces le total en euros.",
    learnerGoal: {
      pt: "Cumprimentar, pedir, perguntar o total e se despedir.",
      fr: "Saluer, commander, demander le total et dire au revoir.",
    },
    openingLine: "Bonjour, monsieur-dame ! Qu'est-ce qu'il vous faut ?",
    keyConcepts: [
      "lex:bonjour",
      "lex:je-vais-prendre",
      "lex:et-avec-ceci",
      "lex:ce-sera-tout",
      "lex:une-baguette",
    ],
  },
  {
    id: "scn-prefecture",
    track: "france",
    region: "fr-FR",
    minLevel: "A1",
    title: { pt: "No guichê da préfecture", fr: "Au guichet de la préfecture" },
    setting: {
      pt: "Você tem horário marcado na préfecture para o seu titre de séjour e precisa mostrar os documentos.",
      fr: "Vous avez rendez-vous à la préfecture pour votre titre de séjour et devez présenter vos documents.",
    },
    aiRole:
      "Tu es agent d'accueil à la préfecture. Tu vouvoies, tu es correct mais pressé. Tu demandes la convocation, le passeport, un justificatif de domicile de moins de trois mois et des photos d'identité. S'il manque un document, tu l'expliques simplement et tu proposes de reprendre rendez-vous. Tu parles lentement et clairement.",
    learnerGoal: {
      pt: "Dizer por que você veio, entregar os documentos pedidos e entender o que falta.",
      fr: "Dire pourquoi vous venez, présenter les documents demandés et comprendre ce qui manque.",
    },
    openingLine: "Bonjour. Vous avez une convocation ?",
    keyConcepts: [
      "lex:un-rendez-vous",
      "lex:un-titre-de-sejour",
      "lex:un-justificatif-de-domicile",
      "lex:le-passeport",
    ],
  },
];
