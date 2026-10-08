import type { PlacementItemInput } from "@/lib/content/schema";

const write = { pt: "Escreva em francês.", fr: "Écrivez en français." };
const fix = { pt: "Corrija a frase.", fr: "Corrigez la phrase." };

/** Constrained written production, graded deterministically (plus AI-graded open writing). */
export const writingItems: PlacementItemInput[] = [
  {
    id: "pw-a0-01",
    skill: "writing",
    level: "A0",
    offset: -0.2,
    topic: "Cortesia por escrito",
    concepts: ["lex:merci"],
    activity: {
      id: "pw-a0-01-q",
      type: "type",
      instruction: write,
      prompt: { pt: "Obrigado!" },
      accept: ["Merci !"],
    },
  },
  {
    id: "pw-a0-02",
    skill: "writing",
    level: "A0",
    offset: 0.2,
    topic: "Se apresentar por escrito",
    concepts: ["lex:je-m-appelle"],
    activity: {
      id: "pw-a0-02-q",
      type: "type",
      instruction: write,
      prompt: { pt: "Eu me chamo Ana." },
      accept: ["Je m'appelle Ana."],
    },
  },
  {
    id: "pw-a1-01",
    skill: "writing",
    level: "A1",
    topic: "Idade com avoir",
    concepts: ["gram:age-avoir"],
    activity: {
      id: "pw-a1-01-q",
      type: "type",
      instruction: write,
      prompt: { pt: "Eu tenho 30 anos." },
      accept: ["J'ai 30 ans.", "J'ai trente ans."],
    },
  },
  {
    id: "pw-a1-02",
    skill: "writing",
    level: "A1",
    offset: -0.2,
    topic: "Ordem da negação",
    concepts: ["gram:negation-ne-pas"],
    activity: {
      id: "pw-a1-02-q",
      type: "order",
      instruction: { pt: "Monte a frase.", fr: "Remettez les mots dans l'ordre." },
      tokens: ["Je", "ne", "parle", "pas", "anglais."],
      translation: "Eu não falo inglês.",
    },
  },
  {
    id: "pw-a1-03",
    skill: "writing",
    level: "A1",
    offset: 0.3,
    topic: "Erros típicos de brasileiros",
    concepts: ["gram:age-avoir"],
    activity: {
      id: "pw-a1-03-q",
      type: "error_correction",
      instruction: fix,
      sentence: "Je suis 25 ans.",
      accept: ["J'ai 25 ans.", "J'ai vingt-cinq ans."],
    },
  },
  {
    id: "pw-a2-01",
    skill: "writing",
    level: "A2",
    topic: "Passé composé por escrito",
    concepts: ["gram:passe-compose-etre"],
    activity: {
      id: "pw-a2-01-q",
      type: "type",
      instruction: write,
      prompt: { pt: "Ontem nós fomos ao mercado." },
      accept: [
        "Hier, nous sommes allés au marché.",
        "Hier, nous sommes allées au marché.",
        "Nous sommes allés au marché hier.",
        "Nous sommes allées au marché hier.",
        "Hier, nous sommes allés au supermarché.",
        "Hier, nous sommes allées au supermarché.",
        "Nous sommes allés au supermarché hier.",
        "Hier, on est allés au marché.",
        "Hier, on est allé au marché.",
      ],
    },
  },
  {
    id: "pw-a2-02",
    skill: "writing",
    level: "A2",
    offset: -0.2,
    topic: "Elisão",
    concepts: ["lex:avoir-besoin-de"],
    activity: {
      id: "pw-a2-02-q",
      type: "error_correction",
      instruction: fix,
      sentence: "J'ai besoin de un rendez-vous.",
      accept: ["J'ai besoin d'un rendez-vous."],
    },
  },
  {
    id: "pw-a2-03",
    skill: "writing",
    level: "A2",
    offset: 0.25,
    topic: "Partitivo na negação",
    concepts: ["gram:partitif"],
    activity: {
      id: "pw-a2-03-q",
      type: "error_correction",
      instruction: fix,
      sentence: "Je n'ai pas du pain.",
      accept: ["Je n'ai pas de pain."],
    },
  },
  {
    id: "pw-b1-01",
    skill: "writing",
    level: "B1",
    topic: "Hipóteses por escrito",
    concepts: ["gram:hypothese-si-imparfait"],
    activity: {
      id: "pw-b1-01-q",
      type: "type",
      instruction: write,
      prompt: { pt: "Se eu tivesse dinheiro, eu viajaria." },
      accept: ["Si j'avais de l'argent, je voyagerais.", "Je voyagerais si j'avais de l'argent."],
    },
  },
  {
    id: "pw-b1-02",
    skill: "writing",
    level: "B1",
    offset: -0.15,
    topic: "Subjuntivo por escrito",
    concepts: ["gram:subjonctif-present"],
    activity: {
      id: "pw-b1-02-q",
      type: "error_correction",
      instruction: fix,
      sentence: "Il faut que tu fais tes devoirs.",
      accept: ["Il faut que tu fasses tes devoirs."],
    },
  },
  {
    id: "pw-b1-03",
    skill: "writing",
    level: "B1",
    offset: 0.3,
    topic: "Pronome relativo dont",
    concepts: ["gram:relatif-dont"],
    activity: {
      id: "pw-b1-03-q",
      type: "fill",
      instruction: {
        pt: "Complete com o pronome relativo.",
        fr: "Complétez avec le pronom relatif.",
      },
      sentence: "C'est le livre ___ je t'ai parlé.",
      blanks: [{ accept: ["dont"] }],
      translation: "É o livro de que te falei.",
    },
  },
  {
    id: "pw-b2-01",
    skill: "writing",
    level: "B2",
    offset: -0.15,
    topic: "Subjuntivo com bien que",
    concepts: ["gram:subjonctif-concession"],
    activity: {
      id: "pw-b2-01-q",
      type: "error_correction",
      instruction: fix,
      sentence: "Bien qu'il est fatigué, il continue à travailler.",
      accept: ["Bien qu'il soit fatigué, il continue à travailler."],
    },
  },
  {
    id: "pw-b2-02",
    skill: "writing",
    level: "B2",
    offset: 0.2,
    topic: "Concordância do particípio",
    concepts: ["gram:accord-participe-avoir"],
    activity: {
      id: "pw-b2-02-q",
      type: "error_correction",
      instruction: fix,
      sentence: "Les erreurs que j'ai fait sont graves.",
      accept: ["Les erreurs que j'ai faites sont graves."],
    },
  },
  {
    id: "pw-c1-01",
    skill: "writing",
    level: "C1",
    topic: "Norma culta",
    activity: {
      id: "pw-c1-01-q",
      type: "error_correction",
      instruction: { pt: "Reescreva na norma culta.", fr: "Réécrivez selon la norme soutenue." },
      sentence: "Malgré qu'il pleuve, ils sont sortis.",
      accept: [
        "Bien qu'il pleuve, ils sont sortis.",
        "Quoiqu'il pleuve, ils sont sortis.",
        "Malgré la pluie, ils sont sortis.",
      ],
    },
  },
  {
    id: "pw-c1-02",
    skill: "writing",
    level: "C1",
    offset: 0.25,
    topic: "Modo depois de après que",
    activity: {
      id: "pw-c1-02-q",
      type: "error_correction",
      instruction: { pt: "Reescreva na norma culta.", fr: "Réécrivez selon la norme soutenue." },
      sentence: "Après qu'il soit parti, nous avons dîné.",
      accept: ["Après qu'il est parti, nous avons dîné.", "Après son départ, nous avons dîné."],
    },
  },
  {
    id: "pw-a2-ow",
    skill: "writing",
    level: "A2",
    offset: 0.1,
    topic: "Produção livre: relato pessoal",
    activity: {
      id: "pw-a2-ow-q",
      type: "open_writing",
      prompt: {
        pt: "Conte em 40 a 60 palavras o que você fez no último fim de semana.",
        fr: "Racontez en 40 à 60 mots ce que vous avez fait le week-end dernier.",
      },
      minWords: 30,
      modelAnswer:
        "Samedi, je me suis levé tard. L'après-midi, je suis allé au parc avec des amis et nous avons joué au foot. Le soir, nous avons mangé une pizza. Dimanche, je suis resté à la maison : j'ai lu un livre et j'ai appelé ma famille au Brésil.",
      focus: ["Passé composé com avoir e être", "Marcadores de tempo", "Clareza da sequência"],
      rubric: {
        version: 1,
        expectedLevel: "A2",
        taskRequirements: [
          "Relatar atividades pessoais do último fim de semana",
          "Organizar os acontecimentos em uma sequência compreensível",
          "Usar frases simples sobre o passado; aceitar tentativas de estruturas mais avançadas",
        ],
      },
    },
  },
  {
    id: "pw-b1-ow",
    skill: "writing",
    level: "B1",
    offset: 0.1,
    topic: "Produção livre: mensagem profissional",
    activity: {
      id: "pw-b1-ow-q",
      type: "open_writing",
      prompt: {
        pt: "Escreva uma mensagem (60 a 80 palavras) a um colega explicando por que você não poderá ir à reunião de amanhã e propondo outra data.",
        fr: "Écrivez un message (60 à 80 mots) à un collègue pour expliquer pourquoi vous ne pourrez pas assister à la réunion de demain et proposer une autre date.",
      },
      minWords: 50,
      modelAnswer:
        "Bonjour Julien, je suis désolé, mais je ne pourrai pas assister à la réunion de demain : j'ai un rendez-vous médical que je ne peux pas déplacer. Est-ce qu'on pourrait la reporter à jeudi après-midi ? Je serai disponible à partir de 14 h. Je peux aussi t'envoyer mes notes avant, si tu veux. Merci de ta compréhension et à bientôt, Rafael",
      focus: [
        "Registro adequado a um colega",
        "Justificativa clara",
        "Proposta concreta",
        "Futuro e condicional de cortesia",
      ],
      rubric: {
        version: 1,
        expectedLevel: "B1",
        taskRequirements: [
          "Avisar um colega que não poderá ir à reunião de amanhã",
          "Apresentar uma justificativa compreensível",
          "Propor outra data concreta",
          "Usar registro adequado a um colega; aceitar variantes regionais",
        ],
      },
    },
  },
];

/** Pronunciation measured through perception (minimal pairs) — no speech service needed. */
export const pronunciationItems: PlacementItemInput[] = [
  {
    id: "pp-a0-01",
    skill: "pronunciation",
    level: "A0",
    offset: -0.1,
    topic: "Sons /y/ e /u/",
    concepts: ["pron:y-vs-u"],
    activity: {
      id: "pp-a0-01-q",
      type: "minimal_pair",
      instruction: { pt: "Qual palavra você ouviu?", fr: "Quel mot avez-vous entendu ?" },
      pair: [
        { word: "tu", ipa: "/ty/", pt: "você" },
        { word: "tout", ipa: "/tu/", pt: "tudo" },
      ],
      answer: 0,
    },
  },
  {
    id: "pp-a0-02",
    skill: "pronunciation",
    level: "A0",
    offset: 0.3,
    topic: "Sons /y/ e /u/",
    concepts: ["pron:y-vs-u"],
    activity: {
      id: "pp-a0-02-q",
      type: "minimal_pair",
      instruction: { pt: "Qual palavra você ouviu?", fr: "Quel mot avez-vous entendu ?" },
      pair: [
        { word: "vu", ipa: "/vy/", pt: "visto" },
        { word: "vous", ipa: "/vu/", pt: "vocês / o senhor" },
      ],
      answer: 1,
    },
  },
  {
    id: "pp-a1-01",
    skill: "pronunciation",
    level: "A1",
    offset: -0.2,
    topic: "Sons /y/ e /u/",
    concepts: ["pron:y-vs-u"],
    activity: {
      id: "pp-a1-01-q",
      type: "minimal_pair",
      instruction: { pt: "Qual palavra você ouviu?", fr: "Quel mot avez-vous entendu ?" },
      pair: [
        { word: "rue", ipa: "/ʁy/", pt: "rua" },
        { word: "roue", ipa: "/ʁu/", pt: "roda" },
      ],
      answer: 0,
    },
  },
  {
    id: "pp-a1-02",
    skill: "pronunciation",
    level: "A1",
    topic: "Vogais nasais",
    concepts: ["pron:nasal-vowels"],
    activity: {
      id: "pp-a1-02-q",
      type: "minimal_pair",
      instruction: { pt: "Qual palavra você ouviu?", fr: "Quel mot avez-vous entendu ?" },
      pair: [
        { word: "bon", ipa: "/bɔ̃/", pt: "bom" },
        { word: "bonne", ipa: "/bɔn/", pt: "boa" },
      ],
      answer: 1,
    },
  },
  {
    id: "pp-a1-03",
    skill: "pronunciation",
    level: "A1",
    offset: 0.3,
    topic: "Vogais nasais",
    concepts: ["pron:nasal-vowels"],
    activity: {
      id: "pp-a1-03-q",
      type: "minimal_pair",
      instruction: { pt: "Qual palavra você ouviu?", fr: "Quel mot avez-vous entendu ?" },
      pair: [
        { word: "vent", ipa: "/vɑ̃/", pt: "vento" },
        { word: "vin", ipa: "/vɛ̃/", pt: "vinho" },
      ],
      answer: 1,
    },
  },
  {
    id: "pp-a2-01",
    skill: "pronunciation",
    level: "A2",
    topic: "Vogal /ø/",
    activity: {
      id: "pp-a2-01-q",
      type: "minimal_pair",
      instruction: { pt: "Qual palavra você ouviu?", fr: "Quel mot avez-vous entendu ?" },
      pair: [
        { word: "deux", ipa: "/dø/", pt: "dois" },
        { word: "des", ipa: "/de/", pt: "uns, umas" },
      ],
      answer: 0,
    },
  },
  {
    id: "pp-a2-02",
    skill: "pronunciation",
    level: "A2",
    offset: 0.3,
    topic: "Sons /y/ e /u/",
    concepts: ["pron:y-vs-u"],
    activity: {
      id: "pp-a2-02-q",
      type: "minimal_pair",
      instruction: { pt: "Qual palavra você ouviu?", fr: "Quel mot avez-vous entendu ?" },
      pair: [
        { word: "dessus", ipa: "/də.sy/", pt: "em cima" },
        { word: "dessous", ipa: "/də.su/", pt: "embaixo" },
      ],
      answer: 1,
    },
  },
  {
    id: "pp-b1-01",
    skill: "pronunciation",
    level: "B1",
    offset: -0.2,
    topic: "Vogal /œ/",
    activity: {
      id: "pp-b1-01-q",
      type: "minimal_pair",
      instruction: { pt: "Qual palavra você ouviu?", fr: "Quel mot avez-vous entendu ?" },
      pair: [
        { word: "peur", ipa: "/pœʁ/", pt: "medo" },
        { word: "pour", ipa: "/puʁ/", pt: "para" },
      ],
      answer: 0,
    },
  },
  {
    id: "pp-b1-02",
    skill: "pronunciation",
    level: "B1",
    offset: 0.2,
    topic: "Singular e plural ouvidos no artigo",
    activity: {
      id: "pp-b1-02-q",
      type: "minimal_pair",
      instruction: { pt: "Qual frase você ouviu?", fr: "Quelle phrase avez-vous entendue ?" },
      pair: [
        { word: "le livre", ipa: "/lə livʁ/", pt: "o livro" },
        { word: "les livres", ipa: "/le livʁ/", pt: "os livros" },
      ],
      answer: 1,
    },
  },
  {
    id: "pp-b2-01",
    skill: "pronunciation",
    level: "B2",
    topic: "Liaison e h aspirado",
    activity: {
      id: "pp-b2-01-q",
      type: "minimal_pair",
      instruction: {
        pt: "Qual expressão você ouviu?",
        fr: "Quelle expression avez-vous entendue ?",
      },
      pair: [
        { word: "les héros", ipa: "/le e.ʁo/", pt: "os heróis" },
        { word: "les zéros", ipa: "/le ze.ʁo/", pt: "os zeros" },
      ],
      answer: 0,
    },
  },
];

/** Spoken items — only served when a speech-to-text provider is configured. */
export const speakingItems: PlacementItemInput[] = [
  ["ps-a0-01", "A0", 0, "read", "Bonjour, je m'appelle Paulo.", "Leitura em voz alta"],
  ["ps-a1-01", "A1", -0.1, "read", "J'habite à Montréal depuis deux ans.", "Leitura em voz alta"],
  ["ps-a1-02", "A1", 0.2, "repeat", "Je voudrais un café, s'il vous plaît.", "Repetição"],
  [
    "ps-a2-01",
    "A2",
    0,
    "read",
    "Hier soir, nous sommes allés au cinéma avec des amis.",
    "Leitura em voz alta",
  ],
  [
    "ps-a2-02",
    "A2",
    0.25,
    "repeat",
    "Est-ce que vous pourriez répéter plus lentement ?",
    "Repetição",
  ],
  [
    "ps-b1-01",
    "B1",
    0,
    "read",
    "Si j'avais su que le magasin était fermé, je ne serais pas venu.",
    "Leitura em voz alta",
  ],
  [
    "ps-b1-02",
    "B1",
    0.25,
    "repeat",
    "Il faudrait qu'on en parle avant la réunion de jeudi.",
    "Repetição",
  ],
  [
    "ps-b2-01",
    "B2",
    0,
    "read",
    "Bien que la situation se soit améliorée, de nombreux problèmes persistent.",
    "Leitura em voz alta",
  ],
  [
    "ps-c1-01",
    "C1",
    0,
    "read",
    "Quoi qu'il en soit, il conviendrait d'examiner ces hypothèses avec davantage de rigueur.",
    "Leitura em voz alta",
  ],
].map(
  ([id, level, offset, mode, text, topic]) =>
    ({
      id: id as string,
      skill: "speaking",
      level: level as "A0",
      offset: offset as number,
      topic: topic as string,
      activity: {
        id: `${id as string}-q`,
        type: "speak",
        mode: mode as "read" | "repeat",
        text: text as string,
        instruction:
          mode === "read"
            ? { pt: "Leia em voz alta.", fr: "Lisez à voix haute." }
            : { pt: "Ouça e repita.", fr: "Écoutez et répétez." },
      },
    }) satisfies PlacementItemInput,
);

const CAN_DO: Record<"speaking" | "writing", [string, string, string][]> = {
  speaking: [
    [
      "A0",
      "Consigo cumprimentar alguém e dizer meu nome.",
      "Je peux saluer quelqu'un et dire mon nom.",
    ],
    [
      "A1",
      "Consigo me apresentar e responder a perguntas simples sobre mim, como onde moro e o que faço.",
      "Je peux me présenter et répondre à des questions simples sur moi.",
    ],
    [
      "A2",
      "Consigo resolver situações simples do dia a dia, como pedir comida ou comprar uma passagem.",
      "Je peux me débrouiller dans des situations simples de la vie quotidienne.",
    ],
    [
      "B1",
      "Consigo conversar sem preparação sobre temas do cotidiano e contar uma experiência.",
      "Je peux discuter sans préparation de sujets familiers et raconter une expérience.",
    ],
    [
      "B2",
      "Consigo participar de discussões no trabalho ou nos estudos e defender minha opinião com argumentos.",
      "Je peux participer à une discussion et défendre mon point de vue.",
    ],
    [
      "C1",
      "Consigo me expressar com fluência e precisão, adaptando o registro a situações profissionais.",
      "Je peux m'exprimer avec aisance et précision en adaptant mon registre.",
    ],
  ],
  writing: [
    [
      "A0",
      "Consigo escrever meu nome, minha nacionalidade e palavras simples.",
      "Je peux écrire mon nom, ma nationalité et des mots simples.",
    ],
    [
      "A1",
      "Consigo preencher um formulário simples e escrever uma mensagem curta.",
      "Je peux remplir un formulaire simple et écrire un message court.",
    ],
    [
      "A2",
      "Consigo escrever uma mensagem pessoal simples contando o que fiz.",
      "Je peux écrire un message personnel simple pour raconter ce que j'ai fait.",
    ],
    [
      "B1",
      "Consigo escrever um texto simples e coerente sobre um assunto conhecido ou uma experiência.",
      "Je peux écrire un texte simple et cohérent sur un sujet familier.",
    ],
    [
      "B2",
      "Consigo escrever um texto claro e detalhado, argumentando a favor ou contra uma ideia.",
      "Je peux écrire un texte clair et détaillé pour défendre une idée.",
    ],
    [
      "C1",
      "Consigo escrever textos bem estruturados sobre temas complexos, com estilo adequado ao leitor.",
      "Je peux écrire des textes bien structurés sur des sujets complexes.",
    ],
  ],
};

/** Can-do self-assessment (paraphrasing the spirit of CEFR descriptors, not their text). */
export const selfAssessmentItems: PlacementItemInput[] = (["speaking", "writing"] as const).flatMap(
  (skill) =>
    CAN_DO[skill].map(([level, pt, fr]) => {
      const id = `psa-${skill === "speaking" ? "s" : "w"}-${level.toLowerCase()}`;
      return {
        id,
        skill,
        level: level as "A0",
        topic: "Autoavaliação",
        activity: {
          id: `${id}-q`,
          type: "self_assess",
          statement: { pt, fr },
        },
      } satisfies PlacementItemInput;
    }),
);
