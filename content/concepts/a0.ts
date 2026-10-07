import type { ConceptInput } from "@/lib/content/schema";

/**
 * A0 concepts. IPA follows standard (Parisian) French; regional notes say where
 * Québec differs. Meanings are contextual Brazilian Portuguese.
 */
export const a0Concepts: ConceptInput[] = [
  // ─── Greetings ───
  {
    id: "lex:bonjour",
    kind: "lexical",
    level: "A0",
    french: "bonjour",
    pos: "interjection",
    ipa: "/bɔ̃.ʒuʁ/",
    meaning: "bom dia, boa tarde, olá",
    examples: [
      { fr: "Bonjour, madame !", pt: "Bom dia, senhora!" },
      { fr: "Bonjour, ça va ?", pt: "Olá, tudo bem?" },
    ],
    tags: ["cumprimentos"],
  },
  {
    id: "lex:salut",
    kind: "lexical",
    level: "A0",
    french: "salut",
    pos: "interjection",
    ipa: "/sa.ly/",
    meaning: "oi; tchau (informal)",
    register: "informal",
    examples: [{ fr: "Salut, Marie !", pt: "Oi, Marie!" }],
    tags: ["cumprimentos"],
  },
  {
    id: "lex:bonsoir",
    kind: "lexical",
    level: "A0",
    french: "bonsoir",
    pos: "interjection",
    ipa: "/bɔ̃.swaʁ/",
    meaning: "boa noite (ao chegar, a partir do fim da tarde)",
    examples: [{ fr: "Bonsoir, monsieur.", pt: "Boa noite, senhor." }],
    tags: ["cumprimentos"],
  },
  {
    id: "lex:au-revoir",
    kind: "lexical",
    level: "A0",
    french: "au revoir",
    pos: "expression",
    ipa: "/o ʁə.vwaʁ/",
    meaning: "tchau, até logo",
    examples: [{ fr: "Merci, au revoir !", pt: "Obrigado, até logo!" }],
    tags: ["cumprimentos"],
  },
  {
    id: "lex:a-bientot",
    kind: "lexical",
    level: "A0",
    french: "à bientôt",
    pos: "expression",
    ipa: "/a bjɛ̃.to/",
    meaning: "até breve",
    examples: [{ fr: "Au revoir, à bientôt !", pt: "Tchau, até breve!" }],
    tags: ["cumprimentos"],
  },
  {
    id: "lex:bonne-journee",
    kind: "lexical",
    level: "A0",
    french: "bonne journée",
    pos: "expression",
    ipa: "/bɔn ʒuʁ.ne/",
    meaning: "tenha um bom dia (na despedida)",
    examples: [{ fr: "Merci, bonne journée !", pt: "Obrigado, tenha um bom dia!" }],
    tags: ["cumprimentos"],
  },
  {
    id: "cult:bonjour-social",
    kind: "culture",
    level: "A0",
    title: { pt: "O bonjour não é opcional", fr: "Le bonjour n'est pas facultatif" },
    body: {
      pt: "Na França, entrar numa loja, padaria ou consultório sem dizer *bonjour* é visto como falta de educação — muitas vezes o atendimento só começa depois dele. No Québec o cumprimento também é esperado, num tom geralmente mais descontraído.",
    },
    tags: ["cultura", "cumprimentos"],
  },

  // ─── Politeness ───
  {
    id: "lex:merci",
    kind: "lexical",
    level: "A0",
    french: "merci",
    pos: "interjection",
    ipa: "/mɛʁ.si/",
    meaning: "obrigado, obrigada",
    examples: [{ fr: "Merci, monsieur.", pt: "Obrigado, senhor." }],
    notes: [
      {
        kind: "brazil",
        text: {
          pt: "Em francês não muda com o gênero de quem fala: homens e mulheres dizem *merci*.",
        },
      },
    ],
    tags: ["cortesia"],
  },
  {
    id: "lex:merci-beaucoup",
    kind: "lexical",
    level: "A0",
    french: "merci beaucoup",
    pos: "expression",
    ipa: "/mɛʁ.si bo.ku/",
    meaning: "muito obrigado(a)",
    examples: [
      { fr: "Merci beaucoup, c'est gentil.", pt: "Muito obrigado, é gentil da sua parte." },
    ],
    tags: ["cortesia"],
  },
  {
    id: "lex:s-il-vous-plait",
    kind: "lexical",
    level: "A0",
    french: "s'il vous plaît",
    pos: "expression",
    ipa: "/sil vu plɛ/",
    meaning: "por favor (formal ou para várias pessoas)",
    register: "formal",
    examples: [{ fr: "Un café, s'il vous plaît.", pt: "Um café, por favor." }],
    tags: ["cortesia"],
  },
  {
    id: "lex:s-il-te-plait",
    kind: "lexical",
    level: "A0",
    french: "s'il te plaît",
    pos: "expression",
    ipa: "/sil tə plɛ/",
    meaning: "por favor (informal, com quem você trata por tu)",
    register: "informal",
    examples: [{ fr: "Tu peux m'aider, s'il te plaît ?", pt: "Você pode me ajudar, por favor?" }],
    tags: ["cortesia"],
  },
  {
    id: "lex:de-rien",
    kind: "lexical",
    level: "A0",
    french: "de rien",
    pos: "expression",
    ipa: "/də ʁjɛ̃/",
    meaning: "de nada",
    examples: [{ fr: "Merci ! — De rien.", pt: "Obrigado! — De nada." }],
    notes: [
      {
        kind: "quebec",
        text: {
          pt: "No Québec você vai ouvir muito *bienvenue* como resposta a *merci*, no sentido de “de nada”.",
          fr: "Au Québec, on entend souvent « bienvenue » pour répondre à « merci ».",
        },
      },
    ],
    tags: ["cortesia"],
  },
  {
    id: "lex:je-vous-en-prie",
    kind: "lexical",
    level: "A0",
    french: "je vous en prie",
    pos: "expression",
    ipa: "/ʒə vu.z‿ɑ̃ pʁi/",
    meaning: "de nada; por favor, fique à vontade (formal)",
    register: "formal",
    examples: [
      { fr: "Merci, madame. — Je vous en prie.", pt: "Obrigado, senhora. — Não há de quê." },
    ],
    tags: ["cortesia"],
  },
  {
    id: "lex:excusez-moi",
    kind: "lexical",
    level: "A0",
    french: "excusez-moi",
    pos: "expression",
    ipa: "/ɛk.sky.ze mwa/",
    meaning: "com licença; desculpe (para chamar a atenção ou pedir desculpa)",
    register: "formal",
    examples: [{ fr: "Excusez-moi, où est la gare ?", pt: "Com licença, onde fica a estação?" }],
    tags: ["cortesia"],
  },

  // ─── Introductions ───
  {
    id: "lex:je-m-appelle",
    kind: "lexical",
    level: "A0",
    french: "je m'appelle",
    pos: "expression",
    ipa: "/ʒə ma.pɛl/",
    meaning: "eu me chamo, meu nome é",
    examples: [{ fr: "Je m'appelle Ana.", pt: "Eu me chamo Ana." }],
    notes: [
      {
        kind: "brazil",
        text: {
          pt: "É a mesma lógica do português “eu **me** chamo”: *je **m'**appelle*. O *me* vira *m'* antes de vogal.",
        },
      },
    ],
    tags: ["apresentação"],
  },
  {
    id: "lex:enchante",
    kind: "lexical",
    level: "A0",
    french: "enchanté(e)",
    pos: "adjective",
    ipa: "/ɑ̃.ʃɑ̃.te/",
    meaning: "muito prazer",
    forms: ["enchanté", "enchantée"],
    examples: [{ fr: "Enchanté, je m'appelle Paulo.", pt: "Muito prazer, eu me chamo Paulo." }],
    notes: [
      {
        kind: "tip",
        text: {
          pt: "Uma mulher escreve *enchantée*, com e no final — mas a pronúncia é a mesma.",
        },
      },
    ],
    tags: ["apresentação"],
  },
  {
    id: "lex:je-suis-bresilien",
    kind: "lexical",
    level: "A0",
    french: "je suis brésilien / brésilienne",
    pos: "expression",
    ipa: "/ʒə sɥi bʁe.zi.ljɛ̃ ~ bʁe.zi.ljɛn/",
    meaning: "eu sou brasileiro / brasileira",
    forms: ["je suis brésilien", "je suis brésilienne"],
    examples: [
      { fr: "Je suis brésilien.", pt: "Eu sou brasileiro." },
      { fr: "Je suis brésilienne.", pt: "Eu sou brasileira." },
    ],
    notes: [
      {
        kind: "brazil",
        text: {
          pt: "No masculino, *brésilien* termina num som nasal, sem pronunciar o n. No feminino, *brésilienne*, o n é pronunciado e a vogal deixa de ser nasal.",
        },
      },
    ],
    tags: ["apresentação", "nacionalidade"],
  },
  {
    id: "lex:je-viens-du-bresil",
    kind: "lexical",
    level: "A0",
    french: "je viens du Brésil",
    pos: "expression",
    ipa: "/ʒə vjɛ̃ dy bʁe.zil/",
    meaning: "eu venho do Brasil, sou do Brasil",
    examples: [{ fr: "Je viens du Brésil, de São Paulo.", pt: "Sou do Brasil, de São Paulo." }],
    notes: [
      {
        kind: "brazil",
        text: {
          pt: "*Du* = *de* + *le*: o Brasil é masculino em francês (*le Brésil*), como em português.",
        },
      },
    ],
    tags: ["apresentação", "nacionalidade"],
  },
  {
    id: "lex:et-vous",
    kind: "lexical",
    level: "A0",
    french: "et vous ? / et toi ?",
    pos: "expression",
    ipa: "/e vu / e twa/",
    meaning: "e você? / e o senhor, a senhora?",
    forms: ["et vous ?", "et toi ?"],
    examples: [{ fr: "Je m'appelle Ana. Et vous ?", pt: "Eu me chamo Ana. E o senhor?" }],
    tags: ["apresentação"],
  },
  {
    id: "lex:ca-va",
    kind: "lexical",
    level: "A0",
    french: "ça va ?",
    pos: "expression",
    ipa: "/sa va/",
    meaning: "tudo bem?",
    examples: [
      { fr: "Salut ! Ça va ?", pt: "Oi! Tudo bem?" },
      { fr: "Ça va bien, et toi ?", pt: "Tudo bem, e você?" },
    ],
    tags: ["apresentação", "cumprimentos"],
  },
  {
    id: "lex:comment-allez-vous",
    kind: "lexical",
    level: "A0",
    french: "comment allez-vous ?",
    pos: "expression",
    ipa: "/kɔ.mɑ̃.t‿a.le vu/",
    meaning: "como vai o senhor / a senhora?",
    register: "formal",
    examples: [
      { fr: "Bonjour, madame. Comment allez-vous ?", pt: "Bom dia, senhora. Como vai?" },
      { fr: "Je vais bien, merci.", pt: "Vou bem, obrigado." },
    ],
    tags: ["apresentação"],
  },
  {
    id: "lex:comment-tu-t-appelles",
    kind: "lexical",
    level: "A0",
    french: "comment tu t'appelles ?",
    pos: "expression",
    ipa: "/kɔ.mɑ̃ ty ta.pɛl/",
    meaning: "como você se chama? (informal)",
    register: "informal",
    prerequisites: ["lex:je-m-appelle"],
    examples: [{ fr: "Salut ! Comment tu t'appelles ?", pt: "Oi! Como você se chama?" }],
    tags: ["apresentação"],
  },
  {
    id: "lex:comment-vous-appelez-vous",
    kind: "lexical",
    level: "A0",
    french: "comment vous appelez-vous ?",
    pos: "expression",
    ipa: "/kɔ.mɑ̃ vu.z‿a.ple vu/",
    meaning: "como o senhor / a senhora se chama?",
    register: "formal",
    prerequisites: ["lex:je-m-appelle"],
    examples: [{ fr: "Bonjour, comment vous appelez-vous ?", pt: "Bom dia, qual é o seu nome?" }],
    tags: ["apresentação"],
  },
  {
    id: "gram:tu-vous",
    kind: "grammar",
    level: "A0",
    title: { pt: "Tu ou vous?", fr: "Tu ou vous ?" },
    summary: {
      pt: "*Tu* é informal e singular; *vous* é formal (o senhor, a senhora) ou plural (vocês).",
      fr: "« Tu » est familier ; « vous » est poli ou pluriel.",
    },
    explanation: {
      pt: [
        "Em francês você precisa escolher entre *tu* e *vous* sempre que fala com alguém. *Tu* é para amigos, família, crianças e colegas próximos. *Vous* é para desconhecidos, clientes, chefes, pessoas mais velhas — e também para falar com mais de uma pessoa.",
        "Na dúvida, comece com *vous*. Se a pessoa quiser, ela mesma propõe: *On peut se tutoyer ?* (“A gente pode se tratar por tu?”).",
        "O verbo muda junto: *tu t'appelles* / *vous vous appelez*, *s'il te plaît* / *s'il vous plaît*, *ça va ?* / *comment allez-vous ?*.",
      ],
      fr: [
        "« Tu » s'utilise avec les amis, la famille et les enfants. « Vous » s'utilise avec les inconnus, dans le travail et pour parler à plusieurs personnes.",
      ],
    },
    brazilianNote:
      "Em português o “você” cobre os dois casos. Em francês a escolha é obrigatória — e usar *tu* com um desconhecido pode soar rude na França.",
    examples: [
      { fr: "Tu t'appelles comment ?", pt: "Como você se chama? (informal)" },
      { fr: "Comment vous appelez-vous ?", pt: "Como o senhor se chama?" },
      { fr: "Vous êtes brésiliens ?", pt: "Vocês são brasileiros?" },
    ],
    commonMistakes: [
      {
        wrong: "Bonjour madame, comment tu t'appelles ?",
        right: "Bonjour madame, comment vous appelez-vous ?",
        why: "Com uma desconhecida chamada de *madame*, o natural é *vous*.",
      },
    ],
    notes: [
      {
        kind: "quebec",
        text: {
          pt: "No Québec o *tu* é bem mais comum, inclusive entre colegas de trabalho e às vezes no atendimento. Mesmo assim, comece com *vous* com pessoas mais velhas ou em situações formais.",
        },
      },
    ],
    dimensions: ["recognition", "writing", "speaking"],
    tags: ["registro", "pronomes"],
  },

  // ─── Sounds ───
  {
    id: "pron:y-vs-u",
    kind: "pronunciation",
    level: "A0",
    title: { pt: "/y/ e /u/: tu ou tout?", fr: "/y/ et /u/ : tu ou tout ?" },
    ipa: "/y/ – /u/",
    description: {
      pt: "O francês distingue dois sons que, para o ouvido brasileiro, parecem um só: /y/ (escrito u: *tu, rue, vu*) e /u/ (escrito ou: *tout, roue, vous*).",
    },
    articulation: [
      "Para /u/ (ou): é o “u” do português, lábios arredondados e língua para trás.",
      "Para /y/ (u): diga “i” e, sem mexer a língua, arredonde os lábios como se fosse assobiar. A língua fica na frente, encostada nos dentes de baixo.",
      "Teste: diga “iiii” e vá fechando os lábios em biquinho — o som muda para /y/.",
    ],
    brazilianNote:
      "O português não tem /y/, então a tendência é dizer *tu* como “tu” do português — que em francês é *tout* (“tudo”). *Rue* (rua) vira *roue* (roda) e *vu* (visto) vira *vous* (vocês).",
    examples: [
      { word: "tu", ipa: "/ty/", pt: "você" },
      { word: "rue", ipa: "/ʁy/", pt: "rua" },
      { word: "vu", ipa: "/vy/", pt: "visto" },
      { word: "tout", ipa: "/tu/", pt: "tudo" },
      { word: "vous", ipa: "/vu/", pt: "vocês" },
    ],
    minimalPairs: [
      [
        { word: "tu", ipa: "/ty/", pt: "você" },
        { word: "tout", ipa: "/tu/", pt: "tudo" },
      ],
      [
        { word: "rue", ipa: "/ʁy/", pt: "rua" },
        { word: "roue", ipa: "/ʁu/", pt: "roda" },
      ],
      [
        { word: "vu", ipa: "/vy/", pt: "visto" },
        { word: "vous", ipa: "/vu/", pt: "vocês" },
      ],
      [
        { word: "dessus", ipa: "/də.sy/", pt: "em cima" },
        { word: "dessous", ipa: "/də.su/", pt: "embaixo" },
      ],
    ],
    tags: ["vogais"],
  },
  {
    id: "pron:silent-final-consonants",
    kind: "pronunciation",
    level: "A0",
    title: { pt: "Letras finais que não se pronunciam", fr: "Les consonnes finales muettes" },
    ipa: "Paris /pa.ʁi/",
    description: {
      pt: "Em francês, a consoante no fim da palavra normalmente não se pronuncia: *Paris*, *petit*, *beaucoup*, *vous*. O -ent dos verbos no plural também é mudo: *ils parlent* soa como *il parle*.",
    },
    articulation: [
      "Pare a palavra na última vogal: *petit* = “pe-ti”.",
      "Exceções frequentes: c, r, f e l finais costumam soar — *avec, bonjour, neuf, Brésil*. Uma forma de lembrar: CaReFuL.",
      "Um e final sem acento faz a consoante anterior soar: *petit* /pə.ti/ × *petite* /pə.tit/.",
    ],
    brazilianNote:
      "Brasileiros tendem a pronunciar todas as letras e ainda acrescentar um “i”: *Paris* vira “Parisi”, *petit* vira “petiti”. Segure a consoante final — ou não a pronuncie.",
    examples: [
      { word: "Paris", ipa: "/pa.ʁi/" },
      { word: "petit", ipa: "/pə.ti/", pt: "pequeno" },
      { word: "petite", ipa: "/pə.tit/", pt: "pequena" },
      { word: "beaucoup", ipa: "/bo.ku/", pt: "muito" },
      { word: "avec", ipa: "/a.vɛk/", pt: "com" },
    ],
    minimalPairs: [
      [
        { word: "petit", ipa: "/pə.ti/", pt: "pequeno" },
        { word: "petite", ipa: "/pə.tit/", pt: "pequena" },
      ],
      [
        { word: "grand", ipa: "/ɡʁɑ̃/", pt: "grande (m.)" },
        { word: "grande", ipa: "/ɡʁɑ̃d/", pt: "grande (f.)" },
      ],
    ],
    tags: ["consoantes"],
  },
  {
    id: "pron:nasal-vowels",
    kind: "pronunciation",
    level: "A0",
    title: { pt: "As vogais nasais", fr: "Les voyelles nasales" },
    ipa: "/ɑ̃/ /ɔ̃/ /ɛ̃/",
    description: {
      pt: "O francês tem três vogais nasais principais: /ɔ̃/ (*on*: bon, nom), /ɑ̃/ (*an, en*: an, vent, enfant) e /ɛ̃/ (*in, ain, un*: vin, pain).",
    },
    articulation: [
      "Deixe o ar sair pelo nariz e pela boca ao mesmo tempo, sem fechar com um “n” ou “m” no final.",
      "/ɔ̃/ (bon): lábios arredondados, como um “o” nasal.",
      "/ɑ̃/ (vent): boca aberta, mais para trás, como o “ã” de “cã”, mas mais aberto.",
      "/ɛ̃/ (vin): boca aberta e esticada, perto do “ẽ” de “bem”, sem o “i” final.",
    ],
    brazilianNote:
      "O português também tem vogais nasais, o que ajuda! O cuidado: em francês não há “n” nem “i” depois da vogal (*bon* não é “bõn”, *vin* não é “vĩn”). E quando o n vem seguido de vogal, a vogal deixa de ser nasal: *bon* /bɔ̃/ × *bonne* /bɔn/.",
    examples: [
      { word: "bon", ipa: "/bɔ̃/", pt: "bom" },
      { word: "vent", ipa: "/vɑ̃/", pt: "vento" },
      { word: "vin", ipa: "/vɛ̃/", pt: "vinho" },
      { word: "bonne", ipa: "/bɔn/", pt: "boa" },
    ],
    minimalPairs: [
      [
        { word: "bon", ipa: "/bɔ̃/", pt: "bom" },
        { word: "bonne", ipa: "/bɔn/", pt: "boa" },
      ],
      [
        { word: "vin", ipa: "/vɛ̃/", pt: "vinho" },
        { word: "vent", ipa: "/vɑ̃/", pt: "vento" },
      ],
      [
        { word: "vent", ipa: "/vɑ̃/", pt: "vento" },
        { word: "vont", ipa: "/vɔ̃/", pt: "vão" },
      ],
    ],
    tags: ["vogais"],
  },
  {
    id: "pron:french-r",
    kind: "pronunciation",
    level: "A0",
    title: { pt: "O R francês", fr: "Le R français" },
    ipa: "/ʁ/",
    description: {
      pt: "O R francês padrão é pronunciado no fundo da garganta, com a parte de trás da língua perto da úvula — em qualquer posição da palavra: *rue, Paris, merci, très*.",
    },
    articulation: [
      "Comece pelo seu “rr” de “carro” ou de “rato” (no sotaque carioca ou paulistano), mas mais suave e com a voz vibrando.",
      "A ponta da língua fica parada atrás dos dentes de baixo.",
      "Nunca use o “r” fraco de “caro” (o toque da ponta da língua): *Paris* não é “Pa-ri” com esse r.",
    ],
    brazilianNote:
      "Boa notícia: muitos brasileiros já produzem um som próximo no “rr” de “carro”. O desafio é usá-lo também entre vogais (*Paris, arriver*) e depois de consoante (*très, trois*), onde o português usa o r fraco.",
    examples: [
      { word: "rue", ipa: "/ʁy/", pt: "rua" },
      { word: "Paris", ipa: "/pa.ʁi/" },
      { word: "merci", ipa: "/mɛʁ.si/", pt: "obrigado" },
      { word: "très", ipa: "/tʁɛ/", pt: "muito" },
      { word: "trois", ipa: "/tʁwa/", pt: "três" },
    ],
    minimalPairs: [],
    tags: ["consoantes"],
  },

  // ─── Numbers ───
  {
    id: "lex:nombres-0-10",
    kind: "lexical",
    level: "A0",
    french: "zéro, un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix",
    pos: "number",
    ipa: "/ze.ʁo œ̃ dø tʁwa katʁ sɛ̃k sis sɛt ɥit nœf dis/",
    meaning: "os números de 0 a 10",
    examples: [
      { fr: "J'ai deux enfants.", pt: "Tenho dois filhos." },
      { fr: "Le bus numéro huit.", pt: "O ônibus número oito." },
    ],
    notes: [
      {
        kind: "tip",
        text: {
          pt: "*Six*, *huit* e *dix* perdem a consoante final antes de um substantivo que começa com consoante: *six livres* /si livʁ/. Contando, pronuncie: /sis/, /ɥit/, /dis/.",
        },
      },
    ],
    dimensions: ["recognition", "recall", "listening", "speaking"],
    tags: ["números"],
  },
  {
    id: "lex:nombres-11-20",
    kind: "lexical",
    level: "A0",
    french: "onze, douze, treize, quatorze, quinze, seize, dix-sept, dix-huit, dix-neuf, vingt",
    pos: "number",
    ipa: "/ɔ̃z duz tʁɛz ka.tɔʁz kɛ̃z sɛz di.sɛt di.zɥit diz.nœf vɛ̃/",
    meaning: "os números de 11 a 20",
    prerequisites: ["lex:nombres-0-10"],
    examples: [
      { fr: "Elle a seize ans.", pt: "Ela tem dezesseis anos." },
      { fr: "Ça fait quinze euros.", pt: "Dá quinze euros." },
    ],
    notes: [
      {
        kind: "brazil",
        text: {
          pt: "Como em português, de 17 a 19 se diz “dez-e-sete”: *dix-sept, dix-huit, dix-neuf*. O t de *vingt* não se pronuncia: /vɛ̃/.",
        },
      },
    ],
    tags: ["números"],
  },
  {
    id: "gram:age-avoir",
    kind: "grammar",
    level: "A0",
    title: { pt: "A idade se diz com avoir", fr: "L'âge avec le verbe avoir" },
    summary: {
      pt: "Em francês se *tem* uma idade: *j'ai vingt ans* — nunca *je suis vingt ans*.",
      fr: "On dit « j'ai vingt ans », avec le verbe avoir.",
    },
    explanation: {
      pt: [
        "Para dizer a idade, o francês usa o verbo *avoir* (ter) + número + *ans*: *j'ai 25 ans*, *tu as 30 ans*, *il a 8 ans*.",
        "A palavra *ans* (anos) é obrigatória: *j'ai 25* sozinho não basta.",
        "Para perguntar: *Tu as quel âge ?* (informal) ou *Quel âge avez-vous ?* (formal).",
      ],
    },
    brazilianNote:
      "Aqui o português ajuda: nós também “temos” anos. O erro aparece quando se pensa no inglês “I am 20” — em francês, *je suis 20 ans* não existe.",
    examples: [
      { fr: "J'ai vingt-huit ans.", pt: "Tenho vinte e oito anos." },
      { fr: "Tu as quel âge ?", pt: "Quantos anos você tem?" },
      { fr: "Mon fils a six ans.", pt: "Meu filho tem seis anos." },
    ],
    commonMistakes: [
      { wrong: "Je suis 20 ans.", right: "J'ai 20 ans.", why: "A idade usa avoir (ter)." },
      { wrong: "J'ai 20.", right: "J'ai 20 ans.", why: "A palavra ans é obrigatória." },
    ],
    tags: ["avoir", "idade"],
  },
  {
    id: "lex:quel-age",
    kind: "lexical",
    level: "A0",
    french: "tu as quel âge ? / quel âge avez-vous ?",
    pos: "expression",
    ipa: "/ty a kɛl ɑʒ/",
    meaning: "quantos anos você tem?",
    forms: ["tu as quel âge ?", "quel âge as-tu ?", "quel âge avez-vous ?"],
    prerequisites: ["gram:age-avoir"],
    examples: [{ fr: "Quel âge avez-vous ?", pt: "Quantos anos o senhor tem?" }],
    tags: ["idade"],
  },

  // ─── Café ───
  {
    id: "lex:je-voudrais",
    kind: "lexical",
    level: "A0",
    french: "je voudrais",
    pos: "expression",
    ipa: "/ʒə vu.dʁɛ/",
    meaning: "eu gostaria, eu queria (pedido educado)",
    examples: [
      { fr: "Je voudrais un café, s'il vous plaît.", pt: "Eu queria um café, por favor." },
      { fr: "Je voudrais l'addition.", pt: "Eu gostaria da conta." },
    ],
    notes: [
      {
        kind: "brazil",
        text: {
          pt: "Assim como dizemos “eu queria” em vez de “eu quero” para soar educado, em francês use *je voudrais*. *Je veux* (eu quero) soa exigente num café ou numa loja.",
        },
      },
    ],
    tags: ["café", "pedidos"],
  },
  {
    id: "lex:un-cafe",
    kind: "lexical",
    level: "A0",
    french: "un café",
    pos: "noun",
    gender: "m",
    plural: "des cafés",
    ipa: "/œ̃ ka.fe/",
    meaning: "um café",
    examples: [
      { fr: "Un café et un croissant, s'il vous plaît.", pt: "Um café e um croissant, por favor." },
    ],
    notes: [
      {
        kind: "france",
        text: {
          pt: "Na França, *un café* é um expresso pequeno. Para algo maior, peça *un café allongé* ou *un café crème*.",
        },
      },
    ],
    tags: ["café"],
  },
  {
    id: "lex:un-the",
    kind: "lexical",
    level: "A0",
    french: "un thé",
    pos: "noun",
    gender: "m",
    ipa: "/œ̃ te/",
    meaning: "um chá",
    examples: [{ fr: "Un thé, s'il vous plaît.", pt: "Um chá, por favor." }],
    tags: ["café"],
  },
  {
    id: "lex:un-croissant",
    kind: "lexical",
    level: "A0",
    french: "un croissant",
    pos: "noun",
    gender: "m",
    ipa: "/œ̃ kʁwa.sɑ̃/",
    meaning: "um croissant",
    examples: [{ fr: "Deux croissants, s'il vous plaît.", pt: "Dois croissants, por favor." }],
    tags: ["café"],
  },
  {
    id: "lex:de-l-eau",
    kind: "lexical",
    level: "A0",
    french: "de l'eau",
    pos: "noun",
    gender: "f",
    ipa: "/də lo/",
    meaning: "água",
    examples: [
      { fr: "De l'eau, s'il vous plaît.", pt: "Água, por favor." },
      { fr: "Une carafe d'eau, s'il vous plaît.", pt: "Uma jarra de água, por favor." },
    ],
    notes: [
      {
        kind: "france",
        text: {
          pt: "Nos restaurantes franceses, *une carafe d'eau* (água da torneira) é gratuita.",
        },
      },
    ],
    tags: ["café"],
  },
  {
    id: "gram:articles-indefinis",
    kind: "grammar",
    level: "A0",
    title: { pt: "Un, une, des", fr: "Les articles indéfinis" },
    summary: {
      pt: "*Un* (masculino), *une* (feminino) e *des* (plural) correspondem a “um, uma, uns, umas”.",
      fr: "un (masculin), une (féminin), des (pluriel).",
    },
    explanation: {
      pt: [
        "Todo substantivo francês tem gênero. Aprenda cada palavra junto com o artigo: *un café*, *une bière*, *un croissant*, *une baguette*.",
        "No plural, *des* serve para os dois gêneros: *des cafés*, *des bières*.",
        "Diferente do português, o plural *des* quase nunca some: em “quero croissants” o francês diz *je voudrais des croissants*.",
      ],
    },
    brazilianNote:
      "Muitas palavras têm o mesmo gênero do português (*un café*, *une table*), mas não todas: *le lait* (o leite) é masculino, mas *la mer* (o mar) é feminino. Memorize sempre com o artigo.",
    examples: [
      { fr: "Un café, s'il vous plaît.", pt: "Um café, por favor." },
      { fr: "Une bière, s'il vous plaît.", pt: "Uma cerveja, por favor." },
      { fr: "Des croissants.", pt: "(Uns) croissants." },
    ],
    commonMistakes: [
      {
        wrong: "Je voudrais croissants.",
        right: "Je voudrais des croissants.",
        why: "O artigo é obrigatório em francês.",
      },
    ],
    tags: ["artigos", "gênero"],
  },
  {
    id: "lex:c-est-combien",
    kind: "lexical",
    level: "A0",
    french: "c'est combien ? / ça fait combien ?",
    pos: "expression",
    ipa: "/sɛ kɔ̃.bjɛ̃ / sa fɛ kɔ̃.bjɛ̃/",
    meaning: "quanto é? / quanto dá?",
    forms: ["c'est combien ?", "ça fait combien ?", "ça coûte combien ?"],
    examples: [
      { fr: "Le croissant, c'est combien ?", pt: "Quanto é o croissant?" },
      { fr: "Ça fait combien ? — Ça fait quatre euros.", pt: "Quanto dá? — Dá quatro euros." },
    ],
    tags: ["café", "compras"],
  },
  {
    id: "lex:euro",
    kind: "lexical",
    level: "A0",
    french: "un euro / des euros",
    pos: "noun",
    gender: "m",
    ipa: "/œ̃.n‿ø.ʁo/",
    meaning: "euro(s)",
    forms: ["un euro", "euro", "des euros"],
    examples: [
      { fr: "Deux euros cinquante.", pt: "Dois euros e cinquenta." },
      { fr: "Un dollar, deux dollars.", pt: "Um dólar, dois dólares." },
    ],
    notes: [
      {
        kind: "tip",
        text: {
          pt: "Atenção às ligações: *deux euros* /dø.z‿ø.ʁo/, *trois euros* /tʁwa.z‿ø.ʁo/. No Canadá, a moeda é o *dollar* (*un dollar*, *dix dollars*).",
        },
      },
    ],
    tags: ["compras"],
  },
  {
    id: "lex:l-addition",
    kind: "lexical",
    level: "A0",
    french: "l'addition",
    pos: "noun",
    gender: "f",
    ipa: "/la.di.sjɔ̃/",
    meaning: "a conta (no restaurante, no café)",
    examples: [{ fr: "L'addition, s'il vous plaît.", pt: "A conta, por favor." }],
    notes: [
      {
        kind: "quebec",
        text: {
          pt: "No Québec se diz também *la facture* para a conta do restaurante.",
          fr: "Au Québec, on dit aussi « la facture ».",
        },
      },
    ],
    tags: ["café", "pagamento"],
  },
  {
    id: "lex:par-carte",
    kind: "lexical",
    level: "A0",
    french: "par carte",
    pos: "expression",
    ipa: "/paʁ kaʁt/",
    meaning: "no cartão",
    examples: [{ fr: "Je peux payer par carte ?", pt: "Posso pagar no cartão?" }],
    tags: ["pagamento"],
  },
  {
    id: "lex:en-especes",
    kind: "lexical",
    level: "A0",
    french: "en espèces",
    pos: "expression",
    ipa: "/ɑ̃.n‿ɛs.pɛs/",
    meaning: "em dinheiro (vivo)",
    examples: [{ fr: "Je vais payer en espèces.", pt: "Vou pagar em dinheiro." }],
    notes: [
      {
        kind: "quebec",
        text: {
          pt: "No Québec você também ouvirá *comptant* (*payer comptant*) e, informalmente, *cash*.",
        },
      },
    ],
    tags: ["pagamento"],
  },
  {
    id: "lex:sur-place-ou-a-emporter",
    kind: "lexical",
    level: "A0",
    french: "sur place ou à emporter ?",
    pos: "expression",
    ipa: "/syʁ plas u a ɑ̃.pɔʁ.te/",
    meaning: "para comer aqui ou para levar?",
    forms: ["sur place ou à emporter ?"],
    examples: [
      {
        fr: "Sur place ou à emporter ? — Sur place.",
        pt: "Para comer aqui ou para levar? — Aqui.",
      },
    ],
    notes: [
      {
        kind: "quebec",
        text: {
          pt: "No Québec a pergunta costuma ser *pour ici ou pour emporter ?*",
          fr: "Au Québec : « pour ici ou pour emporter ? »",
        },
      },
    ],
    tags: ["café"],
  },
];
