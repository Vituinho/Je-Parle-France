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
    id: "scn-weekend-plans",
    track: "core",
    minLevel: "A1",
    title: { pt: "Planos para o fim de semana", fr: "Des projets pour le week-end" },
    setting: {
      pt: "Um colega de trabalho quer saber o que você vai fazer no fim de semana e propõe um programa.",
      fr: "Un collègue vous demande ce que vous faites ce week-end et propose une sortie.",
    },
    aiRole:
      "Tu es un collègue sympathique. Tu demandes à l'apprenant ce qu'il va faire ce week-end (futur proche : « tu vas… ? »), tu poses des questions avec où, quand, avec qui, pourquoi, et tu proposes une activité simple (cinéma, parc, restaurant, marché). Tu tutoies, phrases courtes.",
    learnerGoal: {
      pt: "Contar seus planos com “je vais…”, fazer perguntas e combinar dia e hora.",
      fr: "Dire vos projets avec « je vais… », poser des questions et fixer un jour et une heure.",
    },
    openingLine: "Salut ! Qu'est-ce que tu vas faire ce week-end ?",
    keyConcepts: [
      "gram:futur-proche",
      "gram:aller-present",
      "gram:questions",
      "lex:quand",
      "lex:il-est-heures",
    ],
  },
  {
    id: "scn-marche",
    track: "core",
    minLevel: "A1",
    title: { pt: "Compras na feira", fr: "Au marché" },
    setting: {
      pt: "Numa banca de feira, você compra frutas, legumes e queijo para a semana.",
      fr: "À un stand du marché, vous achetez des fruits, des légumes et du fromage pour la semaine.",
    },
    aiRole:
      "Tu es marchand ou marchande au marché. Tu vends des fruits, des légumes et du fromage. Tu demandes « qu'est-ce que je vous sers ? », « et avec ça ? », tu proposes des quantités (un kilo, une barquette, un morceau), tu annonces le prix et tu dis parfois qu'un produit manque aujourd'hui. Tu vouvoies, phrases courtes.",
    learnerGoal: {
      pt: "Pedir quantidades com o partitivo, perguntar o preço e dizer o que você não quer.",
      fr: "Demander des quantités, demander le prix et dire ce que vous ne voulez pas.",
    },
    openingLine: "Bonjour ! Qu'est-ce que je vous sers aujourd'hui ?",
    keyConcepts: [
      "gram:partitif",
      "lex:un-kilo-de",
      "lex:les-fruits",
      "lex:les-legumes",
      "lex:le-fromage",
    ],
  },
  {
    id: "scn-pharmacie",
    track: "core",
    minLevel: "A1",
    title: { pt: "Na farmácia", fr: "À la pharmacie" },
    setting: {
      pt: "Você não está bem e vai à farmácia explicar os sintomas e pedir um remédio.",
      fr: "Vous ne vous sentez pas bien et vous allez à la pharmacie.",
    },
    aiRole:
      "Tu es pharmacien ou pharmacienne. Tu demandes où le client a mal, depuis quand, s'il a de la fièvre et s'il a une ordonnance. Tu proposes un médicament simple sans ordonnance, tu expliques la posologie (deux fois par jour, pendant trois jours) et tu conseilles de voir un médecin si les symptômes durent. Tu ne poses jamais de vrai diagnostic. Tu vouvoies, phrases courtes et claires.",
    learnerGoal: {
      pt: "Dizer onde dói e desde quando, responder às perguntas e entender como tomar o remédio.",
      fr: "Dire où vous avez mal, répondre aux questions et comprendre la posologie.",
    },
    openingLine: "Bonjour, qu'est-ce qui ne va pas ?",
    keyConcepts: [
      "gram:avoir-mal-a",
      "lex:avoir-de-la-fievre",
      "lex:une-ordonnance",
      "lex:un-medicament",
    ],
  },
  {
    id: "scn-weekend-recap",
    track: "core",
    minLevel: "A2",
    title: { pt: "Como foi o seu fim de semana?", fr: "Ton week-end, c'était comment ?" },
    setting: {
      pt: "Segunda de manhã, um colega quer saber o que você fez no fim de semana.",
      fr: "Lundi matin, un collègue vous demande ce que vous avez fait ce week-end.",
    },
    aiRole:
      "Tu es un collègue curieux et sympathique. Tu demandes à l'apprenant ce qu'il a fait ce week-end, avec qui, où il est allé, et tu racontes aussi ton week-end au passé composé. Tu poses des questions de relance (« Et après ? », « C'était bien ? »). Tu tutoies, phrases simples.",
    learnerGoal: {
      pt: "Contar o que você fez com o passé composé (avoir e être) e fazer perguntas sobre o fim de semana do colega.",
      fr: "Raconter votre week-end au passé composé et poser des questions.",
    },
    openingLine: "Salut ! Alors, qu'est-ce que tu as fait ce week-end ?",
    keyConcepts: ["gram:passe-compose-avoir", "gram:passe-compose-etre", "lex:hier"],
  },
  {
    id: "scn-comparer-villes",
    track: "core",
    minLevel: "A2",
    title: { pt: "Lá e aqui", fr: "Là-bas et ici" },
    setting: {
      pt: "Um vizinho curioso pergunta como era a sua vida no Brasil e o que muda na cidade nova.",
      fr: "Un voisin vous demande comment était votre vie au Brésil et ce qui change ici.",
    },
    aiRole:
      "Tu es un voisin curieux et bienveillant. Tu demandes à l'apprenant où il habitait avant, comment c'était (imparfait), et ce qui est différent maintenant : le climat, les logements, les prix, les gens. Tu utilises des comparaisons simples (plus… que, moins… que, meilleur, mieux). Tu vouvoies d'abord, puis tu proposes de te tutoyer.",
    learnerGoal: {
      pt: "Descrever como era antes (imparfait) e comparar com agora (plus, moins, meilleur, mieux).",
      fr: "Décrire votre vie d'avant et la comparer avec aujourd'hui.",
    },
    openingLine: "Bonjour ! Vous êtes nouveau dans l'immeuble ? Vous habitiez où avant ?",
    keyConcepts: [
      "gram:imparfait",
      "gram:comparatif",
      "gram:adjectifs",
      "lex:avant",
      "lex:maintenant",
    ],
  },
  {
    id: "scn-entrevue-montreal",
    track: "canada",
    region: "fr-CA",
    minLevel: "A2",
    title: { pt: "Entrevista de emprego em Montréal", fr: "Une entrevue d'embauche à Montréal" },
    setting: {
      pt: "Você está numa entrevista para uma vaga de atendimento numa empresa de Montréal.",
      fr: "Vous passez une entrevue pour un poste au service à la clientèle à Montréal.",
    },
    aiRole:
      "Tu es gestionnaire dans une entreprise de Montréal et tu fais passer une entrevue d'embauche courte et bienveillante. Tu demandes : « Parlez-vous de vous », l'expérience au Brésil, les disponibilités (temps plein ou partiel, fins de semaine), quand la personne peut commencer, et si elle a des questions. Tu vouvoies, tu parles clairement, avec des expressions québécoises légères.",
    learnerGoal: {
      pt: "Apresentar-se, contar sua experiência no passé composé e dizer sua disponibilidade.",
      fr: "Vous présenter, parler de votre expérience et de vos disponibilités.",
    },
    openingLine: "Bonjour, bienvenue ! Merci d'être venu à l'entrevue. Parlez-moi un peu de vous.",
    keyConcepts: ["lex:une-entrevue", "lex:temps-plein-partiel", "lex:un-cv"],
  },
  {
    id: "scn-entretien-paris",
    track: "france",
    region: "fr-FR",
    minLevel: "A2",
    title: { pt: "Entrevista de emprego em Paris", fr: "Un entretien d'embauche à Paris" },
    setting: {
      pt: "Você tem uma entrevista para um CDD numa empresa em Paris.",
      fr: "Vous passez un entretien d'embauche pour un CDD dans une entreprise parisienne.",
    },
    aiRole:
      "Tu es responsable des ressources humaines dans une entreprise à Paris. Tu fais passer un entretien d'embauche pour un CDD de six mois. Tu demandes une présentation, l'expérience professionnelle, pourquoi la personne veut ce poste et quand elle peut commencer. Tu expliques brièvement le contrat (CDD, possibilité de CDI ensuite). Tu vouvoies, ton professionnel mais bienveillant, phrases claires.",
    learnerGoal: {
      pt: "Apresentar-se, falar da sua experiência e fazer perguntas sobre o contrato.",
      fr: "Vous présenter, parler de votre expérience et poser des questions sur le contrat.",
    },
    openingLine: "Bonjour, asseyez-vous. Alors, présentez-vous en quelques mots.",
    keyConcepts: ["lex:un-entretien-d-embauche", "lex:un-cdi-cdd", "lex:un-cv"],
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
