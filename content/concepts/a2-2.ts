import type { ConceptInput } from "@/lib/content/schema";

/** A2.2 core concepts (second A2 module). */
export const a22Concepts: ConceptInput[] = [
  // ─── Unit 6: passé composé or imparfait ───
  {
    id: "gram:pc-imparfait",
    kind: "grammar",
    level: "A2",
    title: { pt: "Passé composé ou imparfait?", fr: "Passé composé ou imparfait ?" },
    summary: {
      pt: "Numa história, o *imparfait* pinta o **cenário** (como era, o que estava acontecendo) e o *passé composé* conta os **fatos** (o que aconteceu): *Il pleuvait quand je suis arrivé.*",
    },
    explanation: {
      pt: [
        "**imparfait** — o pano de fundo: descrição, estado, ação em andamento, hábito. *Il **faisait** froid. Je **marchais** dans la rue.*",
        "**passé composé** — os acontecimentos, pontuais, que fazem a história avançar. *Soudain, mon téléphone **a sonné**.*",
        "Juntos: *Je **regardais** la télé quand Marc **a appelé**.* (Eu estava vendo TV quando o Marc ligou.)",
      ],
    },
    brazilianNote:
      "O português faz a mesma divisão: “eu **estava** vendo TV (imperfeito) quando ele **ligou** (perfeito)”. Se em português você usaria “-ava / -ia / estava + -ndo”, em francês é *imparfait*; se usaria “-ei / -ou”, é *passé composé*.",
    examples: [
      { fr: "Il pleuvait quand je suis arrivé.", pt: "Estava chovendo quando eu cheguei." },
      {
        fr: "Je dormais quand le téléphone a sonné.",
        pt: "Eu estava dormindo quando o telefone tocou.",
      },
      {
        fr: "Pendant que je cuisinais, les enfants jouaient.",
        pt: "Enquanto eu cozinhava, as crianças brincavam.",
      },
    ],
    commonMistakes: [
      {
        wrong: "J'ai regardé la télé quand Marc appelait.",
        right: "Je regardais la télé quand Marc a appelé.",
        why: "A ação em andamento é *imparfait*; a que interrompe é *passé composé*.",
      },
      {
        wrong: "Hier, il a fait beau et je me promenais une fois.",
        right: "Hier, il faisait beau et je me suis promené.",
        why: "O cenário (o tempo) é *imparfait*; o passeio, um fato, é *passé composé*.",
      },
    ],
    prerequisites: ["gram:imparfait", "gram:passe-compose-etre"],
    tags: ["passado", "narração"],
  },
  {
    id: "lex:soudain",
    kind: "lexical",
    level: "A2",
    french: "soudain / tout à coup",
    pos: "adverb",
    ipa: "/su.dɛ̃/, /tu.t‿a ku/",
    meaning: "de repente",
    forms: ["soudain", "tout à coup"],
    examples: [{ fr: "Soudain, la lumière s'est éteinte.", pt: "De repente, a luz se apagou." }],
    tags: ["narração"],
  },
  {
    id: "lex:pendant-que",
    kind: "lexical",
    level: "A2",
    french: "pendant que",
    pos: "conjunction",
    ipa: "/pɑ̃.dɑ̃ kə/",
    meaning: "enquanto",
    examples: [
      { fr: "Pendant que je travaillais, il dormait.", pt: "Enquanto eu trabalhava, ele dormia." },
    ],
    tags: ["narração", "conectores"],
  },

  // ─── Unit 7: object pronouns ───
  {
    id: "gram:pronoms-cod",
    kind: "grammar",
    level: "A2",
    title: { pt: "Le, la, les: “o, a, os” objeto", fr: "Les pronoms COD" },
    summary: {
      pt: "Para não repetir a coisa ou a pessoa: *Tu vois Marie ? — Oui, je **la** vois.* O pronome vem **antes do verbo** — e nunca *je vois elle*.",
    },
    explanation: {
      pt: [
        "Objeto direto (sem preposição): **le** (o) · **la** (a) · **l'** (antes de vogal) · **les** (os, as). E *me, te, nous, vous* para as pessoas da conversa.",
        "Posição: **antes do verbo conjugado**: *je **le** connais*, *je ne **la** vois pas*. No passé composé, antes do auxiliar: *je **l'**ai vu*.",
        "Com um infinitivo, antes do infinitivo: *je vais **le** faire*.",
      ],
    },
    brazilianNote:
      "No Brasil falamos “eu vi **ele**”, “conheço **ela**”. Em francês isso não funciona: *je vois lui* / *je connais elle* estão errados. Use o pronome antes do verbo: *je **l'**ai vu*, *je **la** connais*.",
    examples: [
      {
        fr: "Tu connais Paulo ? — Oui, je le connais.",
        pt: "Você conhece o Paulo? — Conheço (ele).",
      },
      { fr: "Où sont mes clés ? Je ne les trouve pas.", pt: "Cadê minhas chaves? Não acho." },
      { fr: "Le film ? Je l'ai vu hier.", pt: "O filme? Vi ontem." },
    ],
    commonMistakes: [
      {
        wrong: "J'ai vu lui hier.",
        right: "Je l'ai vu hier.",
        why: "O objeto vira pronome antes do auxiliar: *je l'ai vu*.",
      },
      {
        wrong: "Je connais elle.",
        right: "Je la connais.",
        why: "O pronome objeto vem antes do verbo: *je la connais*.",
      },
    ],
    prerequisites: ["gram:passe-compose-avoir"],
    tags: ["pronomes"],
  },
  {
    id: "gram:pronoms-coi",
    kind: "grammar",
    level: "A2",
    title: { pt: "Lui, leur: “para ele, para eles”", fr: "Les pronoms COI" },
    summary: {
      pt: "Com verbos que pedem **à** (*parler à, téléphoner à, demander à, donner à*), a pessoa vira **lui** (a ele / a ela) ou **leur** (a eles / a elas): *Je **lui** ai téléphoné.*",
    },
    explanation: {
      pt: [
        "Objeto indireto (pessoa, com *à*): **lui** — para ele **ou** para ela · **leur** — para eles / para elas. E *me, te, nous, vous*.",
        "Mesma posição dos outros pronomes: antes do verbo, ou do auxiliar: *je **lui** parle*, *je **leur** ai écrit*.",
        "Verbos comuns com *à*: *parler à, téléphoner à, écrire à, demander à, donner à, répondre à, dire à*.",
      ],
    },
    brazilianNote:
      "“Liguei **pra ela**”, “mandei uma mensagem **pra eles**”: em francês, *je **lui** ai téléphoné*, *je **leur** ai envoyé un message*. Atenção: *lui* serve para homem **e** mulher.",
    examples: [
      {
        fr: "Tu as appelé ta mère ? — Oui, je lui ai téléphoné hier.",
        pt: "Você ligou pra sua mãe? — Liguei pra ela ontem.",
      },
      { fr: "Je leur écris tous les dimanches.", pt: "Escrevo pra eles todo domingo." },
      { fr: "Qu'est-ce que tu lui as dit ?", pt: "O que você disse pra ele?" },
    ],
    commonMistakes: [
      {
        wrong: "J'ai téléphoné à elle.",
        right: "Je lui ai téléphoné.",
        why: "*Téléphoner à* + pessoa → *lui*, antes do auxiliar.",
      },
      {
        wrong: "Je la parle.",
        right: "Je lui parle.",
        why: "*Parler à* pede objeto indireto: *lui*.",
      },
    ],
    prerequisites: ["gram:pronoms-cod"],
    tags: ["pronomes"],
  },

  // ─── Unit 8: futur simple ───
  {
    id: "gram:futur-simple",
    kind: "grammar",
    level: "A2",
    title: { pt: "O futuro simples: je parlerai", fr: "Le futur simple" },
    summary: {
      pt: "*je parlerai, tu parleras, il parlera…* Para planos mais distantes, previsões e promessas — e depois de **quand**: *Quand j'arriverai, je t'appellerai.*",
    },
    explanation: {
      pt: [
        "Formação: **infinitivo** + **-ai, -as, -a, -ons, -ez, -ont**: *parler → je parler**ai**, nous parler**ons***. Verbos em *-re* perdem o *e*: *prendre → je prendr**ai***.",
        "Irregulares para decorar (mesmas terminações): *être → **ser**ai* · *avoir → **aur**ai* · *aller → **ir**ai* · *faire → **fer**ai* · *pouvoir → **pourr**ai* · *venir → **viendr**ai* · *voir → **verr**ai*.",
        "Depois de **quand** falando do futuro, o francês usa o futuro: *quand je **serai** au Canada…*",
      ],
    },
    brazilianNote:
      "Onde o português usa o futuro do subjuntivo — “quando eu **chegar**”, “quando você **tiver** tempo” —, o francês usa o futuro simples: *quand j'**arriverai***, *quand tu **auras** le temps*. Nunca o presente.",
    examples: [
      {
        fr: "L'année prochaine, j'habiterai à Montréal.",
        pt: "Ano que vem vou morar em Montréal.",
      },
      { fr: "Quand j'arriverai, je t'appellerai.", pt: "Quando eu chegar, te ligo." },
      { fr: "Il fera beau demain.", pt: "Vai fazer tempo bom amanhã." },
    ],
    commonMistakes: [
      {
        wrong: "Quand j'arrive au Canada, je chercherai un travail.",
        right: "Quand j'arriverai au Canada, je chercherai un travail.",
        why: "Depois de *quand* com sentido de futuro: futuro simples.",
      },
      {
        wrong: "Je serai content si tu viendras.",
        right: "Je serai content si tu viens.",
        why: "Depois de *si*, presente — nunca futuro.",
      },
    ],
    prerequisites: ["gram:futur-proche"],
    tags: ["futuro", "verbos"],
  },
  {
    id: "lex:l-annee-prochaine",
    kind: "lexical",
    level: "A2",
    french: "l'année prochaine",
    pos: "expression",
    ipa: "/la.ne pʁɔ.ʃɛn/",
    meaning: "o ano que vem",
    forms: ["l'année prochaine", "année prochaine"],
    examples: [
      { fr: "L'année prochaine, je passerai le TCF.", pt: "Ano que vem vou fazer o TCF." },
    ],
    tags: ["tempo", "futuro"],
  },
  {
    id: "lex:un-jour",
    kind: "lexical",
    level: "A2",
    french: "un jour",
    pos: "expression",
    ipa: "/œ̃ ʒuʁ/",
    meaning: "um dia (no futuro)",
    forms: ["un jour"],
    examples: [{ fr: "Un jour, je parlerai couramment.", pt: "Um dia vou falar fluentemente." }],
    tags: ["tempo", "futuro"],
  },

  // ─── Unit 9: obligation and advice ───
  {
    id: "gram:il-faut-devoir",
    kind: "grammar",
    level: "A2",
    title: { pt: "Il faut, devoir: obrigação e conselho", fr: "Il faut et devoir" },
    summary: {
      pt: "**il faut** + infinitivo = “é preciso” (geral); **devoir** = “ter que / dever” (pessoal); **tu devrais** = “você deveria” (conselho).",
    },
    explanation: {
      pt: [
        "**il faut** + infinitivo ou nome — impessoal, sempre com *il*: *il faut réserver*, *il faut un passeport*. Negação: *il ne faut pas fumer* (não se pode fumar).",
        "**devoir** (irregular): *je dois · tu dois · il doit · nous devons · vous devez · ils doivent* + infinitivo: *je dois partir* (tenho que ir).",
        "Para aconselhar com gentileza: **tu devrais / vous devriez** + infinitivo — *vous devriez prendre rendez-vous*.",
      ],
    },
    brazilianNote:
      "“Precisa reservar?” → *Il faut réserver ?* O *il* não é ninguém: é impessoal, como “é preciso”. E *il ne faut pas* não é “não precisa” — é “não pode / não se deve”. “Não precisa” é *ce n'est pas nécessaire* ou *pas besoin*.",
    examples: [
      { fr: "Il faut un passeport pour voyager.", pt: "É preciso passaporte para viajar." },
      { fr: "Je dois travailler samedi.", pt: "Tenho que trabalhar no sábado." },
      { fr: "Tu devrais te reposer.", pt: "Você deveria descansar." },
    ],
    commonMistakes: [
      {
        wrong: "Je faut partir.",
        right: "Il faut partir. / Je dois partir.",
        why: "*Falloir* só existe com *il*. Para uma pessoa, use *devoir*.",
      },
      {
        wrong: "Il ne faut pas réserver. (querendo dizer “não precisa”)",
        right: "Ce n'est pas nécessaire de réserver.",
        why: "*Il ne faut pas* é proibição (“não se deve”). “Não precisa” é outra coisa.",
      },
    ],
    prerequisites: ["gram:vouloir-pouvoir"],
    tags: ["verbos", "obrigação"],
  },
  {
    id: "lex:pas-besoin",
    kind: "lexical",
    level: "A2",
    french: "pas besoin / ce n'est pas nécessaire",
    pos: "expression",
    ipa: "/pa bə.zwɛ̃/",
    meaning: "não precisa",
    forms: ["pas besoin", "ce n'est pas nécessaire", "pas nécessaire"],
    examples: [
      { fr: "Pas besoin de réserver, il y a de la place.", pt: "Não precisa reservar, tem lugar." },
    ],
    tags: ["obrigação", "conversa"],
  },

  // ─── Unit 10: relative pronouns ───
  {
    id: "gram:qui-que",
    kind: "grammar",
    level: "A2",
    title: { pt: "Qui ou que?", fr: "Les relatifs qui et que" },
    summary: {
      pt: "O “que” português vira **qui** quando é o **sujeito** do verbo seguinte (*l'homme **qui** habite ici*) e **que** quando é o **objeto** (*le livre **que** j'ai lu*).",
    },
    explanation: {
      pt: [
        "**qui** = sujeito: logo depois vem o **verbo**. *La femme **qui parle** est ma professeure.*",
        "**que** = objeto: logo depois vem **outro sujeito**. *Le film **que j'**ai vu était super.* Antes de vogal: **qu'**.",
        "Dica rápida: depois de *qui* vem verbo; depois de *que* vem sujeito (*je, tu, il, Marie…*).",
      ],
    },
    brazilianNote:
      "Em português é tudo “que”: “o homem **que** mora aqui”, “o livro **que** eu li”. Em francês, olhe o que vem depois: verbo → *qui*; sujeito → *que*.",
    examples: [
      { fr: "J'ai un ami qui habite à Lyon.", pt: "Tenho um amigo que mora em Lyon." },
      { fr: "C'est le livre que je lis.", pt: "É o livro que estou lendo." },
      { fr: "La ville qu'il préfère, c'est Québec.", pt: "A cidade que ele prefere é Québec." },
    ],
    commonMistakes: [
      {
        wrong: "L'homme que habite ici.",
        right: "L'homme qui habite ici.",
        why: "Depois vem o verbo (*habite*): *qui*.",
      },
      {
        wrong: "Le film qui j'ai vu.",
        right: "Le film que j'ai vu.",
        why: "Depois vem um sujeito (*j'*): *que*.",
      },
    ],
    prerequisites: ["gram:passe-compose-avoir"],
    tags: ["relativos"],
  },
  {
    id: "gram:relatif-ou",
    kind: "grammar",
    level: "A2",
    title: { pt: "Où: “onde” e “em que”", fr: "Le relatif où" },
    summary: {
      pt: "**où** retoma um **lugar** (*la ville **où** j'habite*) e também um **momento** (*le jour **où** je suis arrivé* — o dia **em que** cheguei).",
    },
    explanation: {
      pt: [
        "Lugar: *Le quartier **où** j'habite est calme.* (O bairro onde moro é tranquilo.)",
        "Tempo: *Le jour **où** je suis arrivé, il neigeait.* (No dia **em que** cheguei, estava nevando.) — aqui o português usa “em que”, o francês usa *où*.",
      ],
    },
    brazilianNote:
      "“O dia em que”, “o ano em que”, “o momento em que”: em francês, sempre **où** — *le jour où*, *l'année où*. Nunca *le jour que*.",
    examples: [
      { fr: "C'est le café où on s'est rencontrés.", pt: "É o café onde a gente se conheceu." },
      {
        fr: "L'année où je suis arrivé, il a beaucoup neigé.",
        pt: "No ano em que cheguei, nevou muito.",
      },
    ],
    commonMistakes: [
      {
        wrong: "Le jour que je suis arrivé.",
        right: "Le jour où je suis arrivé.",
        why: "Para tempo (“em que”), *où*.",
      },
    ],
    prerequisites: ["gram:qui-que"],
    tags: ["relativos"],
  },
];
