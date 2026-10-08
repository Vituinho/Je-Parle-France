import type { ConceptInput } from "@/lib/content/schema";

/**
 * A2 core concepts. Grammar ids match the placement bank where it already
 * tests the topic (passé composé with être, imparfait, y, en).
 */
export const a2Concepts: ConceptInput[] = [
  // ─── Unit 1: passé composé with avoir ───
  {
    id: "gram:passe-compose-avoir",
    kind: "grammar",
    level: "A2",
    title: { pt: "O passado com avoir: j'ai parlé", fr: "Le passé composé avec avoir" },
    summary: {
      pt: "Para contar o que aconteceu, o francês falado usa **avoir + particípio**: *j'ai parlé* (falei), *j'ai mangé* (comi), *j'ai fait* (fiz).",
    },
    explanation: {
      pt: [
        "**avoir** no presente + **particípio passado**:\n\n*j'ai parlé* · *tu as parlé* · *il a parlé* · *nous avons parlé* · *vous avez parlé* · *ils ont parlé*",
        "Verbos em **-er** fazem o particípio em **-é**: *parler → parlé*, *manger → mangé*, *travailler → travaillé*.",
        "Irregulares para decorar: *faire → **fait*** · *prendre → **pris*** · *avoir → **eu*** (/y/) · *être → **été*** · *voir → **vu*** · *boire → **bu*** · *lire → **lu*** · *écrire → **écrit***",
        "Na negação, *ne… pas* abraça o **avoir**: *je **n'**ai **pas** mangé*.",
      ],
    },
    brazilianNote:
      "Em português, “falei” é uma palavra só. Em francês, na fala, o passado é quase sempre composto: *j'ai parlé*. O passado simples (*je parlai*) só aparece em livros — você vai reconhecê-lo, mas não precisa usá-lo.",
    examples: [
      {
        fr: "Hier, j'ai travaillé jusqu'à vingt heures.",
        pt: "Ontem trabalhei até as oito da noite.",
      },
      { fr: "Tu as fait les courses ?", pt: "Você fez as compras?" },
      { fr: "Nous avons pris le train.", pt: "Pegamos o trem." },
      { fr: "Je n'ai pas vu le film.", pt: "Não vi o filme." },
    ],
    commonMistakes: [
      {
        wrong: "Hier, je parle avec elle.",
        right: "Hier, j'ai parlé avec elle.",
        why: "Para o passado, *avoir + particípio*.",
      },
      {
        wrong: "J'ai prendu le bus.",
        right: "J'ai pris le bus.",
        why: "O particípio de *prendre* é *pris*.",
      },
      {
        wrong: "Je ai pas mangé.",
        right: "Je n'ai pas mangé.",
        why: "*Je* vira *j'*, e a negação abraça *ai*: *je n'ai pas mangé*.",
      },
    ],
    prerequisites: ["gram:avoir-present", "gram:verbes-er-present"],
    tags: ["passado", "verbos"],
  },
  {
    id: "lex:hier",
    kind: "lexical",
    level: "A2",
    french: "hier",
    pos: "adverb",
    ipa: "/jɛʁ/",
    meaning: "ontem",
    examples: [{ fr: "Hier, il a plu toute la journée.", pt: "Ontem choveu o dia todo." }],
    tags: ["tempo", "passado"],
  },
  {
    id: "lex:la-semaine-derniere",
    kind: "lexical",
    level: "A2",
    french: "la semaine dernière",
    pos: "expression",
    ipa: "/la sə.mɛn dɛʁ.njɛʁ/",
    meaning: "a semana passada",
    forms: ["la semaine dernière", "semaine dernière"],
    examples: [
      {
        fr: "La semaine dernière, j'ai commencé un nouveau travail.",
        pt: "Semana passada comecei num trabalho novo.",
      },
    ],
    tags: ["tempo", "passado"],
  },
  {
    id: "lex:il-y-a-duree",
    kind: "lexical",
    level: "A2",
    french: "il y a (+ duração)",
    pos: "expression",
    ipa: "/i.l‿j‿a/",
    meaning: "há (tempo atrás)",
    forms: ["il y a deux jours", "il y a un an", "il y a"],
    examples: [{ fr: "Je suis arrivé il y a trois mois.", pt: "Cheguei há três meses." }],
    notes: [
      {
        kind: "tip",
        text: {
          pt: "Com uma duração, *il y a* significa “há… atrás”: *il y a deux jours* (há dois dias). Sem duração, é o “tem / há” de existência que você já conhece.",
        },
      },
    ],
    tags: ["tempo", "passado"],
  },

  // ─── Unit 2: passé composé with être ───
  {
    id: "gram:passe-compose-etre",
    kind: "grammar",
    level: "A2",
    title: { pt: "O passado com être: je suis allé", fr: "Le passé composé avec être" },
    summary: {
      pt: "Alguns verbos — quase todos de movimento — fazem o passado com **être**: *je suis allé(e)*, *elle est partie*. O particípio concorda com o sujeito, como um adjetivo.",
    },
    explanation: {
      pt: [
        "Usam **être** os verbos de deslocamento e mudança de estado: *aller, venir, arriver, partir, entrer, sortir, monter, descendre, rester, tomber, naître, mourir, retourner* (e *revenir, rentrer, devenir*).",
        "O particípio **concorda** com o sujeito: *il est allé* · *elle est allé**e*** · *ils sont allé**s*** · *elles sont allé**es***. Na fala, quase sempre não se ouve a diferença; na escrita, sim.",
        "Todos os verbos **pronominais** também usam *être*: *je **me suis** levé(e)*, *nous **nous sommes** reposés*.",
        "Particípios irregulares: *venir → venu* · *naître → né* · *mourir → mort*.",
      ],
    },
    brazilianNote:
      "Em português todo passado é “fui, cheguei, saí” — sem auxiliar. Em francês, decore a lista de verbos com *être*. Pense em quem **se desloca**: *je suis allé, je suis arrivé, je suis parti*.",
    examples: [
      { fr: "Je suis arrivé à Montréal en janvier.", pt: "Cheguei a Montréal em janeiro." },
      { fr: "Elle est partie hier.", pt: "Ela foi embora ontem." },
      { fr: "Nous sommes restés à la maison.", pt: "Ficamos em casa." },
      { fr: "Je me suis levée tôt.", pt: "Eu me levantei cedo. (mulher falando)" },
    ],
    commonMistakes: [
      {
        wrong: "J'ai allé au cinéma.",
        right: "Je suis allé au cinéma.",
        why: "*Aller* faz o passado com *être*.",
      },
      {
        wrong: "Elle est arrivé.",
        right: "Elle est arrivée.",
        why: "Com *être*, o particípio concorda: *arrivée*.",
      },
      { wrong: "Je m'ai levé.", right: "Je me suis levé.", why: "Verbos pronominais usam *être*." },
    ],
    prerequisites: ["gram:passe-compose-avoir", "gram:verbes-pronominaux"],
    tags: ["passado", "verbos"],
  },
  {
    id: "lex:arriver",
    kind: "lexical",
    level: "A2",
    french: "arriver",
    pos: "verb",
    ipa: "/a.ʁi.ve/",
    meaning: "chegar",
    forms: ["arriver", "je suis arrivé", "je suis arrivée"],
    examples: [{ fr: "Le train est arrivé en retard.", pt: "O trem chegou atrasado." }],
    verb: {
      auxiliary: "être",
      participle: "arrivé",
      present: [
        "j'arrive",
        "tu arrives",
        "il/elle arrive",
        "nous arrivons",
        "vous arrivez",
        "ils/elles arrivent",
      ],
    },
    tags: ["verbos", "movimento"],
  },
  {
    id: "lex:partir",
    kind: "lexical",
    level: "A2",
    french: "partir",
    pos: "verb",
    ipa: "/paʁ.tiʁ/",
    meaning: "partir, ir embora, viajar",
    forms: ["partir", "je suis parti", "je suis partie"],
    examples: [{ fr: "Ils sont partis en vacances.", pt: "Eles saíram de férias." }],
    verb: {
      auxiliary: "être",
      participle: "parti",
      present: [
        "je pars",
        "tu pars",
        "il/elle part",
        "nous partons",
        "vous partez",
        "ils/elles partent",
      ],
    },
    tags: ["verbos", "movimento"],
  },
  {
    id: "lex:sortir",
    kind: "lexical",
    level: "A2",
    french: "sortir",
    pos: "verb",
    ipa: "/sɔʁ.tiʁ/",
    meaning: "sair",
    forms: ["sortir", "je suis sorti", "je suis sortie"],
    examples: [{ fr: "Samedi soir, nous sommes sortis.", pt: "Sábado à noite, nós saímos." }],
    verb: {
      auxiliary: "être",
      participle: "sorti",
      present: [
        "je sors",
        "tu sors",
        "il/elle sort",
        "nous sortons",
        "vous sortez",
        "ils/elles sortent",
      ],
    },
    tags: ["verbos", "movimento"],
  },
  {
    id: "lex:rester",
    kind: "lexical",
    level: "A2",
    french: "rester",
    pos: "verb",
    ipa: "/ʁɛs.te/",
    meaning: "ficar, permanecer",
    forms: ["rester", "je suis resté", "je suis restée"],
    examples: [{ fr: "Je suis resté deux semaines à Paris.", pt: "Fiquei duas semanas em Paris." }],
    falseFriend: {
      looksLike: "restar",
      warning:
        "*Rester* é “ficar” (num lugar, numa situação). “Restar, sobrar” se diz *il reste…* — *il reste du pain* (sobrou pão).",
    },
    verb: {
      auxiliary: "être",
      participle: "resté",
      present: [
        "je reste",
        "tu restes",
        "il/elle reste",
        "nous restons",
        "vous restez",
        "ils/elles restent",
      ],
    },
    tags: ["verbos", "movimento"],
  },
  {
    id: "lex:venir",
    kind: "lexical",
    level: "A2",
    french: "venir",
    pos: "verb",
    ipa: "/və.niʁ/",
    meaning: "vir",
    forms: ["venir", "je suis venu", "je suis venue"],
    examples: [{ fr: "Ma mère est venue me voir.", pt: "Minha mãe veio me visitar." }],
    verb: {
      auxiliary: "être",
      participle: "venu",
      present: [
        "je viens",
        "tu viens",
        "il/elle vient",
        "nous venons",
        "vous venez",
        "ils/elles viennent",
      ],
    },
    tags: ["verbos", "movimento"],
  },
  // ─── Unit 3: imparfait ───
  {
    id: "gram:imparfait",
    kind: "grammar",
    level: "A2",
    title: { pt: "O imparfait: quando eu era criança", fr: "L'imparfait" },
    summary: {
      pt: "O *imparfait* descreve o passado — como era, o que se fazia sempre: *quand j'étais petit, j'habitais à Recife*. É o nosso pretérito imperfeito (“eu era, eu morava”).",
    },
    explanation: {
      pt: [
        "Formação: pegue a forma de **nous** no presente, tire **-ons** e acrescente **-ais, -ais, -ait, -ions, -iez, -aient**:\n\n*nous parlons → je parl**ais**, tu parl**ais**, il parl**ait**, nous parl**ions**, vous parl**iez**, ils parl**aient***",
        "Única exceção: **être** → *j'**étais**, tu étais, il était, nous étions, vous étiez, ils étaient*.",
        "Usos: **descrição** (*il faisait beau*, *la maison était grande*) e **hábito** no passado (*le dimanche, nous allions chez mes grands-parents*).",
        "Na fala, *-ais, -ait* e *-aient* soam igual: /ɛ/.",
      ],
    },
    brazilianNote:
      "Aqui o português ajuda muito: o *imparfait* corresponde ao nosso imperfeito — “eu era, eu morava, a gente ia”. Se em português você diria “-ava / -ia”, em francês é *imparfait*.",
    examples: [
      {
        fr: "Quand j'étais petit, j'habitais à Recife.",
        pt: "Quando eu era pequeno, morava em Recife.",
      },
      { fr: "Il faisait très chaud.", pt: "Fazia muito calor." },
      { fr: "Le dimanche, nous allions à la plage.", pt: "Aos domingos, a gente ia à praia." },
    ],
    commonMistakes: [
      {
        wrong: "Quand j'ai été petit, j'ai habité à Recife.",
        right: "Quand j'étais petit, j'habitais à Recife.",
        why: "Descrição e hábito no passado: *imparfait* (“eu era, eu morava”).",
      },
      {
        wrong: "Nous parlaions.",
        right: "Nous parlions.",
        why: "Com *nous*, a terminação é *-ions*.",
      },
    ],
    prerequisites: ["gram:passe-compose-avoir"],
    tags: ["passado", "verbos"],
  },
  {
    id: "lex:quand-j-etais-petit",
    kind: "lexical",
    level: "A2",
    french: "quand j'étais petit(e)",
    pos: "expression",
    ipa: "/kɑ̃ ʒe.tɛ pə.ti/",
    meaning: "quando eu era criança, quando eu era pequeno(a)",
    forms: ["quand j'étais petit", "quand j'étais petite"],
    examples: [
      {
        fr: "Quand j'étais petite, je voulais être médecin.",
        pt: "Quando eu era pequena, queria ser médica.",
      },
    ],
    tags: ["passado", "infância"],
  },
  {
    id: "lex:avant",
    kind: "lexical",
    level: "A2",
    french: "avant",
    pos: "adverb",
    ipa: "/a.vɑ̃/",
    meaning: "antes, antigamente",
    examples: [
      {
        fr: "Avant, j'habitais au Brésil ; maintenant, j'habite au Canada.",
        pt: "Antes eu morava no Brasil; agora moro no Canadá.",
      },
    ],
    tags: ["tempo", "passado"],
  },
  {
    id: "lex:maintenant",
    kind: "lexical",
    level: "A2",
    french: "maintenant",
    pos: "adverb",
    ipa: "/mɛ̃t.nɑ̃/",
    meaning: "agora",
    examples: [
      { fr: "Maintenant, je parle un peu français.", pt: "Agora falo um pouco de francês." },
    ],
    tags: ["tempo"],
  },

  // ─── Unit 4: y and en ───
  {
    id: "gram:pronom-y",
    kind: "grammar",
    level: "A2",
    title: { pt: "O pronome y: “lá”", fr: "Le pronom y" },
    summary: {
      pt: "**y** substitui um lugar já mencionado (com *à, au, en, chez…*): *Tu vas à Montréal ? — Oui, j'**y** vais.* (Sim, vou **lá**.)",
    },
    explanation: {
      pt: [
        "**y** = “lá, ali”, para não repetir um lugar: *Tu vas **à la banque** ? — Oui, j'**y** vais.*",
        "Ele vem **antes do verbo**: *j'y vais*, *on y va !*, *tu y habites*. No passado, antes do auxiliar: *j'**y** suis allé*.",
        "Na negação: *je **n'y** vais **pas***.",
        "Expressão muito útil: **On y va !** — Vamos!",
      ],
    },
    brazilianNote:
      "O português não tem esse pronome: dizemos “vou” ou “vou lá”. Em francês, *je vais* sozinho soa incompleto — diga *j'y vais*. Comece por *on y va !* e *j'y vais*.",
    examples: [
      {
        fr: "Tu vas au marché ? — Oui, j'y vais samedi.",
        pt: "Você vai à feira? — Vou, no sábado.",
      },
      {
        fr: "Tu habites à Québec ? — Oui, j'y habite depuis deux ans.",
        pt: "Você mora em Québec? — Moro, há dois anos.",
      },
      { fr: "On y va !", pt: "Vamos!" },
    ],
    commonMistakes: [
      { wrong: "Oui, je vais.", right: "Oui, j'y vais.", why: "Para retomar o lugar: *j'y vais*." },
      { wrong: "Je vais y.", right: "J'y vais.", why: "*y* vem antes do verbo." },
    ],
    prerequisites: ["gram:aller-present"],
    tags: ["pronomes"],
  },
  {
    id: "gram:pronom-en",
    kind: "grammar",
    level: "A2",
    title: { pt: "O pronome en: “disso”, “deles”", fr: "Le pronom en" },
    summary: {
      pt: "**en** substitui algo com partitivo ou quantidade: *Tu veux du café ? — Oui, j'**en** veux.* / *Tu as des enfants ? — Oui, j'**en** ai deux.*",
    },
    explanation: {
      pt: [
        "**en** retoma um nome com *du, de la, des, de* ou uma quantidade: *Tu as **des frères** ? — Oui, j'**en** ai deux.*",
        "Com números e quantidades, o número fica no fim: *j'**en** ai **trois***, *j'**en** veux **un kilo***.",
        "Vem **antes do verbo**: *j'en veux*, *il en a*. Na negação: *je **n'en** ai **pas***.",
      ],
    },
    brazilianNote:
      "Onde o português simplesmente omite (“Você tem filhos? — Tenho dois.”), o francês exige **en**: *J'**en** ai deux.* Sem ele, a resposta fica faltando um pedaço.",
    examples: [
      { fr: "Tu veux du café ? — Oui, j'en veux bien.", pt: "Quer café? — Quero, sim." },
      {
        fr: "Vous avez des enfants ? — Oui, j'en ai deux.",
        pt: "O senhor tem filhos? — Tenho dois.",
      },
      { fr: "Il n'y a plus de lait ? — Non, il n'y en a plus.", pt: "Acabou o leite? — Acabou." },
    ],
    commonMistakes: [
      {
        wrong: "Oui, j'ai deux.",
        right: "Oui, j'en ai deux.",
        why: "Com quantidade, o francês retoma o nome com *en*.",
      },
      {
        wrong: "Je ne en veux pas.",
        right: "Je n'en veux pas.",
        why: "*ne* vira *n'* antes de *en*.",
      },
    ],
    prerequisites: ["gram:partitif"],
    tags: ["pronomes"],
  },
  {
    id: "lex:on-y-va",
    kind: "lexical",
    level: "A2",
    french: "on y va !",
    pos: "expression",
    ipa: "/ɔ̃.n‿i va/",
    meaning: "vamos! (bora!)",
    forms: ["on y va", "on y va !"],
    examples: [{ fr: "Tout le monde est prêt ? On y va !", pt: "Todo mundo pronto? Vamos!" }],
    tags: ["conversa", "pronomes"],
  },

  // ─── Unit 5: comparing and describing ───
  {
    id: "gram:comparatif",
    kind: "grammar",
    level: "A2",
    title: { pt: "Plus, moins, aussi… que: comparar", fr: "Le comparatif" },
    summary: {
      pt: "*plus… que* (mais… que), *moins… que* (menos… que), *aussi… que* (tão… quanto). E os irregulares: *meilleur* (melhor, adjetivo) e *mieux* (melhor, advérbio).",
    },
    explanation: {
      pt: [
        "**plus** + adjetivo + **que**: *Montréal est **plus** grande **que** Québec.*\n**moins** + adjetivo + **que**: *Le bus est **moins** rapide **que** le métro.*\n**aussi** + adjetivo + **que**: *Il est **aussi** grand **que** son frère.*",
        "Irregulares: *bon → **meilleur*** (um lugar, uma coisa: *ce café est meilleur*) e *bien → **mieux*** (um jeito de fazer: *tu parles mieux français*).",
        "Com nomes: **plus de / moins de / autant de** + nome: *il y a plus **de** neige à Québec*.",
      ],
    },
    brazilianNote:
      "Nunca *plus bon*: diga *meilleur* — como “mais bom” em português. E cuidado com *mieux* × *meilleur*: “melhor” com verbo é *mieux* (*je dors mieux*); com nome é *meilleur* (*un meilleur salaire*).",
    examples: [
      {
        fr: "Le loyer est plus cher à Paris qu'à Lyon.",
        pt: "O aluguel é mais caro em Paris do que em Lyon.",
      },
      { fr: "L'hiver est plus long au Québec.", pt: "O inverno é mais longo no Québec." },
      { fr: "Tu parles mieux français maintenant !", pt: "Você fala francês melhor agora!" },
    ],
    commonMistakes: [
      {
        wrong: "C'est plus bon.",
        right: "C'est meilleur.",
        why: "*Bon* tem comparativo irregular: *meilleur*.",
      },
      {
        wrong: "Il parle meilleur que moi.",
        right: "Il parle mieux que moi.",
        why: "Com verbo, “melhor” é *mieux*.",
      },
    ],
    prerequisites: ["gram:articles-definis"],
    tags: ["comparação", "adjetivos"],
  },
  {
    id: "gram:adjectifs",
    kind: "grammar",
    level: "A2",
    title: { pt: "Adjetivos: concordância e posição", fr: "Les adjectifs : accord et place" },
    summary: {
      pt: "O adjetivo concorda em gênero e número (*un appartement petit*, *une maison petite*) e geralmente vem **depois** do nome — mas alguns curtos e muito comuns vêm **antes**: *un grand appartement*, *une belle ville*.",
    },
    explanation: {
      pt: [
        "Concordância: feminino com **-e** (*grand → grande*), plural com **-s** (*grands, grandes*). Alguns mudam mais: *beau → belle*, *nouveau → nouvelle*, *vieux → vieille*, *bon → bonne*.",
        "Posição: a maioria vem **depois** do nome, como em português: *une ville **moderne***, *un appartement **calme***.",
        "Alguns adjetivos curtos vêm **antes** — beleza, idade, bondade, tamanho: ***beau**, **joli**, **jeune**, **vieux**, **nouveau**, **bon**, **mauvais**, **grand**, **petit***: *un **petit** appartement*, *une **belle** vue*.",
      ],
    },
    brazilianNote:
      "Em português também dizemos “um grande amigo” e “uma bela vista”, então a posição antes do nome não é estranha. O que muda é o feminino irregular: *beau → belle*, *vieux → vieille*.",
    examples: [
      { fr: "Un petit appartement calme.", pt: "Um apartamento pequeno e tranquilo." },
      { fr: "Une belle ville moderne.", pt: "Uma cidade bonita e moderna." },
      { fr: "Mes nouveaux voisins sont sympathiques.", pt: "Meus vizinhos novos são simpáticos." },
    ],
    commonMistakes: [
      {
        wrong: "une maison beau",
        right: "une belle maison",
        why: "*Beau* vem antes e faz feminino *belle*.",
      },
      {
        wrong: "un appartement grand",
        right: "un grand appartement",
        why: "*Grand* é dos adjetivos que vêm antes do nome.",
      },
    ],
    prerequisites: ["gram:articles-definis"],
    tags: ["adjetivos", "descrição"],
  },
  {
    id: "lex:cher",
    kind: "lexical",
    level: "A2",
    french: "cher / chère",
    pos: "adjective",
    ipa: "/ʃɛʁ/",
    meaning: "caro, cara (preço); querido (no início de cartas)",
    forms: ["cher", "chère", "chers", "chères"],
    examples: [{ fr: "C'est trop cher !", pt: "É caro demais!" }],
    tags: ["descrição", "compras"],
  },
  {
    id: "lex:calme-bruyant",
    kind: "lexical",
    level: "A2",
    french: "calme / bruyant",
    pos: "adjective",
    ipa: "/kalm/, /bʁɥi.jɑ̃/",
    meaning: "tranquilo / barulhento",
    forms: ["calme", "bruyant", "bruyante"],
    examples: [
      {
        fr: "Le quartier est calme, mais la rue est bruyante.",
        pt: "O bairro é tranquilo, mas a rua é barulhenta.",
      },
    ],
    tags: ["descrição", "moradia"],
  },
];
