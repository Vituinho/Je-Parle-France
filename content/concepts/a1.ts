import type { ConceptInput } from "@/lib/content/schema";

/**
 * A1 core concepts. Grammar ids match the placement bank, so gaps found by
 * the diagnosis connect to these lessons and their reviews.
 */
export const a1Concepts: ConceptInput[] = [
  // ─── Unit 1: être, avoir, professions ───
  {
    id: "gram:etre-present",
    kind: "grammar",
    level: "A1",
    title: { pt: "O verbo être no presente", fr: "Le verbe être au présent" },
    summary: {
      pt: "*Être* é “ser” e “estar” ao mesmo tempo: *je suis, tu es, il est, nous sommes, vous êtes, ils sont*.",
    },
    explanation: {
      pt: [
        "O francês usa um só verbo para “ser” e “estar”: **être**.\n\n*je suis* · *tu es* · *il / elle / on est* · *nous sommes* · *vous êtes* · *ils / elles sont*",
        "*On* (“a gente”) usa a forma de *il*: *on est brésiliens* — muito comum na fala.",
        "Atenção às pronúncias: *tu es* e *il est* soam iguais (/ɛ/); em *ils sont*, o *s* final não se pronuncia.",
      ],
      fr: [
        "Le verbe **être** : je suis, tu es, il/elle/on est, nous sommes, vous êtes, ils/elles sont.",
      ],
    },
    brazilianNote:
      "Para idade e para sensações como fome e sede, o francês **não** usa *être*: *j'ai 30 ans* (tenho 30 anos), *j'ai faim* (estou com fome). *Je suis 30 ans* é um erro clássico de brasileiros.",
    examples: [
      { fr: "Je suis brésilienne.", pt: "Sou brasileira." },
      { fr: "Nous sommes à Montréal.", pt: "Estamos em Montréal." },
      { fr: "Vous êtes étudiant ?", pt: "O senhor é estudante?" },
      { fr: "Ils sont fatigués.", pt: "Eles estão cansados." },
    ],
    commonMistakes: [
      {
        wrong: "Je suis 30 ans.",
        right: "J'ai 30 ans.",
        why: "Idade se diz com *avoir*: “tenho 30 anos”.",
      },
      {
        wrong: "Nous sont brésiliens.",
        right: "Nous sommes brésiliens.",
        why: "Com *nous*, a forma é *sommes*.",
      },
    ],
    prerequisites: ["gram:tu-vous"],
    tags: ["verbos", "presente"],
  },
  {
    id: "gram:avoir-present",
    kind: "grammar",
    level: "A1",
    title: { pt: "O verbo avoir no presente", fr: "Le verbe avoir au présent" },
    summary: {
      pt: "*Avoir* é “ter”: *j'ai, tu as, il a, nous avons, vous avez, ils ont*. Também serve para idade, fome, sede, frio…",
    },
    explanation: {
      pt: [
        "**avoir** = ter.\n\n*j'ai* · *tu as* · *il / elle / on a* · *nous avons* · *vous avez* · *ils / elles ont*",
        "*Je* vira *j'* antes de vogal: **j'ai**, nunca *je ai*.",
        "Ouça a diferença: *ils ont* (/il.z‿ɔ̃/, com som de **z**, “eles têm”) e *ils sont* (/il sɔ̃/, com som de **s**, “eles são”).",
      ],
    },
    brazilianNote:
      "Onde dizemos “estar com fome / sede / frio / calor / medo”, o francês diz “ter”: *j'ai faim*, *j'ai soif*, *j'ai froid*, *j'ai chaud*, *j'ai peur*.",
    examples: [
      { fr: "J'ai deux enfants.", pt: "Tenho dois filhos." },
      { fr: "Tu as faim ?", pt: "Você está com fome?" },
      { fr: "Nous avons un rendez-vous.", pt: "Temos um horário marcado." },
      { fr: "Ils ont froid.", pt: "Eles estão com frio." },
    ],
    commonMistakes: [
      {
        wrong: "Je ai faim.",
        right: "J'ai faim.",
        why: "*Je* perde o *e* antes de vogal: *j'ai*.",
      },
      {
        wrong: "Je suis faim.",
        right: "J'ai faim.",
        why: "Fome se “tem” em francês: *avoir faim*.",
      },
    ],
    prerequisites: ["gram:age-avoir"],
    tags: ["verbos", "presente"],
  },
  {
    id: "gram:feminin-professions",
    kind: "grammar",
    level: "A1",
    title: { pt: "Profissões no masculino e no feminino", fr: "Les professions au féminin" },
    summary: {
      pt: "*Je suis étudiant / étudiante*: a profissão concorda com quem fala, e vem **sem artigo** depois de *être*.",
    },
    explanation: {
      pt: [
        "Depois de *je suis*, a profissão vem **sem artigo**, como em português: *je suis ingénieure* (sou engenheira).",
        "O feminino costuma acrescentar **-e** (*étudiant → étudiante*, *ingénieur → ingénieure*). Algumas terminações mudam: *-ier → -ière* (*infirmier → infirmière*), *-eur → -euse* (*développeur → développeuse*). *Médecin* não muda.",
        "Pergunta típica: *Qu'est-ce que vous faites dans la vie ?* — o que você faz (da vida)?",
      ],
    },
    brazilianNote:
      "Em português também dizemos “sou engenheira” sem artigo — aqui as duas línguas combinam. Só use artigo quando houver um adjetivo: *c'est une bonne médecin*.",
    examples: [
      { fr: "Je suis infirmière.", pt: "Sou enfermeira." },
      { fr: "Il est développeur.", pt: "Ele é desenvolvedor." },
      { fr: "Elle est professeure.", pt: "Ela é professora." },
    ],
    commonMistakes: [
      {
        wrong: "Je suis une ingénieure.",
        right: "Je suis ingénieure.",
        why: "Depois de *être*, a profissão vem sem artigo.",
      },
    ],
    notes: [
      {
        kind: "quebec",
        text: {
          pt: "O Québec adotou cedo as formas femininas em *-eure*: *professeure*, *auteure*, *ingénieure*. Na França elas também são aceitas hoje.",
        },
      },
    ],
    prerequisites: ["gram:etre-present"],
    tags: ["trabalho", "gênero"],
  },
  {
    id: "lex:avoir-faim",
    kind: "lexical",
    level: "A1",
    french: "avoir faim",
    pos: "expression",
    ipa: "/a.vwaʁ fɛ̃/",
    meaning: "estar com fome",
    forms: ["avoir faim", "j'ai faim"],
    examples: [{ fr: "J'ai faim !", pt: "Estou com fome!" }],
    tags: ["sensações"],
  },
  {
    id: "lex:avoir-soif",
    kind: "lexical",
    level: "A1",
    french: "avoir soif",
    pos: "expression",
    ipa: "/a.vwaʁ swaf/",
    meaning: "estar com sede",
    forms: ["avoir soif", "j'ai soif"],
    examples: [{ fr: "Tu as soif ?", pt: "Você está com sede?" }],
    tags: ["sensações"],
  },
  {
    id: "lex:avoir-froid",
    kind: "lexical",
    level: "A1",
    french: "avoir froid",
    pos: "expression",
    ipa: "/a.vwaʁ fʁwa/",
    meaning: "estar com frio",
    forms: ["avoir froid", "j'ai froid"],
    examples: [
      {
        fr: "En janvier, on a froid à Montréal.",
        pt: "Em janeiro, a gente sente frio em Montréal.",
      },
    ],
    tags: ["sensações"],
  },
  {
    id: "lex:etudiant",
    kind: "lexical",
    level: "A1",
    french: "étudiant(e)",
    pos: "noun",
    gender: "mf",
    ipa: "/e.ty.djɑ̃/, /e.ty.djɑ̃t/",
    meaning: "estudante (universitário)",
    examples: [{ fr: "Je suis étudiante à l'université.", pt: "Sou estudante na universidade." }],
    tags: ["trabalho", "profissões"],
  },
  {
    id: "lex:ingenieur",
    kind: "lexical",
    level: "A1",
    french: "ingénieur(e)",
    pos: "noun",
    gender: "mf",
    ipa: "/ɛ̃.ʒe.njœʁ/",
    meaning: "engenheiro, engenheira",
    examples: [{ fr: "Elle est ingénieure.", pt: "Ela é engenheira." }],
    tags: ["trabalho", "profissões"],
  },
  {
    id: "lex:infirmier",
    kind: "lexical",
    level: "A1",
    french: "infirmier / infirmière",
    pos: "noun",
    gender: "mf",
    ipa: "/ɛ̃.fiʁ.mje/, /ɛ̃.fiʁ.mjɛʁ/",
    meaning: "enfermeiro, enfermeira",
    examples: [{ fr: "Je suis infirmier.", pt: "Sou enfermeiro." }],
    tags: ["trabalho", "profissões", "saúde"],
  },
  {
    id: "lex:developpeur",
    kind: "lexical",
    level: "A1",
    french: "développeur / développeuse",
    pos: "noun",
    gender: "mf",
    ipa: "/de.vlɔ.pœʁ/, /de.vlɔ.pøz/",
    meaning: "desenvolvedor, desenvolvedora (de software)",
    examples: [{ fr: "Il est développeur web.", pt: "Ele é desenvolvedor web." }],
    tags: ["trabalho", "profissões"],
  },
  {
    id: "lex:medecin",
    kind: "lexical",
    level: "A1",
    french: "médecin",
    pos: "noun",
    gender: "mf",
    ipa: "/med.sɛ̃/",
    meaning: "médico, médica",
    forms: ["médecin", "un médecin", "une médecin"],
    examples: [{ fr: "Ma sœur est médecin.", pt: "Minha irmã é médica." }],
    tags: ["trabalho", "profissões", "saúde"],
  },
  {
    id: "lex:professeur",
    kind: "lexical",
    level: "A1",
    french: "professeur(e)",
    pos: "noun",
    gender: "mf",
    ipa: "/pʁɔ.fɛ.sœʁ/",
    meaning: "professor, professora",
    examples: [{ fr: "Je suis professeure de maths.", pt: "Sou professora de matemática." }],
    tags: ["trabalho", "profissões"],
  },
  {
    id: "lex:qu-est-ce-que-vous-faites",
    kind: "lexical",
    level: "A1",
    french: "qu'est-ce que vous faites dans la vie ?",
    pos: "expression",
    ipa: "/kɛs.kə vu fɛt dɑ̃ la vi/",
    meaning: "o que você faz da vida? (profissão)",
    forms: [
      "qu'est-ce que vous faites dans la vie ?",
      "qu'est-ce que vous faites dans la vie",
      "qu'est-ce que tu fais dans la vie ?",
    ],
    examples: [
      { fr: "Qu'est-ce que vous faites dans la vie ?", pt: "O que o senhor faz da vida?" },
    ],
    tags: ["trabalho", "apresentação"],
  },
];
