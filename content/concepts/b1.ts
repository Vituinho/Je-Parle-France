import type { ConceptInput } from "@/lib/content/schema";

/**
 * B1 core concepts. Grammar ids match the placement bank (hypotheses with
 * si, present subjunctive, reported speech).
 */
export const b1Concepts: ConceptInput[] = [
  // ─── Unit 1: conditionnel présent ───
  {
    id: "gram:conditionnel-present",
    kind: "grammar",
    level: "B1",
    title: { pt: "O condicional: j'aimerais, pourriez-vous", fr: "Le conditionnel présent" },
    summary: {
      pt: "Radical do futuro + terminações do *imparfait*: *j'aimer**ais***, *vous pourr**iez***. Serve para pedir com cortesia, desejar e imaginar — como o nosso “gostaria, poderia”.",
    },
    explanation: {
      pt: [
        "Formação: **radical do futuro** + **-ais, -ais, -ait, -ions, -iez, -aient**: *aimer → j'aimer**ais***, *pouvoir → je pourr**ais***, *être → je ser**ais***, *avoir → j'aur**ais***, *faire → je fer**ais***, *aller → j'ir**ais***.",
        "Usos: **cortesia** (*Pourriez-vous m'aider ?*), **desejo** (*J'aimerais vivre à Québec*), **conselho** (*tu devrais*, que você já conhece) e **hipótese** (próxima unidade).",
        "*Je voudrais*, que você usa desde o A0, já é condicional!",
      ],
    },
    brazilianNote:
      "Aqui o português ajuda: “gostaria” = *j'aimerais*, “poderia” = *pourrais*, “seria” = *serait*. Na fala brasileira usamos muito o imperfeito no lugar (“eu queria”, “podia”); em francês, para soar educado, use o condicional.",
    examples: [
      {
        fr: "J'aimerais travailler dans une entreprise québécoise.",
        pt: "Eu gostaria de trabalhar numa empresa quebequense.",
      },
      {
        fr: "Pourriez-vous répéter plus lentement ?",
        pt: "O senhor poderia repetir mais devagar?",
      },
      { fr: "Ce serait plus simple en ligne.", pt: "Seria mais simples on-line." },
    ],
    commonMistakes: [
      { wrong: "Je aimerais…", right: "J'aimerais…", why: "Antes de vogal: *j'*." },
      {
        wrong: "Vous pouviez m'aider ?",
        right: "Pourriez-vous m'aider ? / Vous pourriez m'aider ?",
        why: "O pedido educado usa o condicional (*pourriez*), não o imperfeito.",
      },
    ],
    prerequisites: ["gram:futur-simple", "gram:imparfait"],
    tags: ["verbos", "cortesia"],
  },
  {
    id: "lex:j-aimerais",
    kind: "lexical",
    level: "B1",
    french: "j'aimerais",
    pos: "expression",
    ipa: "/ʒɛm.ʁɛ/",
    meaning: "eu gostaria (de)",
    forms: ["j'aimerais"],
    examples: [
      {
        fr: "J'aimerais un rendez-vous, s'il vous plaît.",
        pt: "Eu gostaria de marcar um horário, por favor.",
      },
    ],
    tags: ["cortesia", "desejos"],
  },
  {
    id: "lex:pourriez-vous",
    kind: "lexical",
    level: "B1",
    french: "pourriez-vous… ?",
    pos: "expression",
    ipa: "/pu.ʁje.vu/",
    meaning: "o senhor / a senhora poderia…?",
    forms: ["pourriez-vous", "vous pourriez"],
    examples: [
      {
        fr: "Pourriez-vous m'envoyer le document ?",
        pt: "O senhor poderia me enviar o documento?",
      },
    ],
    tags: ["cortesia"],
  },

  // ─── Unit 2: hypotheses with si ───
  {
    id: "gram:hypothese-si-imparfait",
    kind: "grammar",
    level: "B1",
    title: { pt: "Si j'avais…: hipóteses", fr: "L'hypothèse avec si" },
    summary: {
      pt: "Para imaginar: **si** + *imparfait*, condicional — *Si j'**avais** le temps, je **voyagerais***. Onde o português usa o subjuntivo (“se eu **tivesse**”), o francês usa o *imparfait*.",
    },
    explanation: {
      pt: [
        "Hipótese imaginária: **si + imparfait**, **condicional**: *Si je **parlais** mieux, je **chercherais** un autre travail.*",
        "Hipótese real/provável: **si + presente**, **futuro**: *Si tu **viens**, on **ira** au parc.*",
        "Regra de ouro: **nunca condicional nem futuro logo depois de *si***. *Si j'aurais* não existe.",
      ],
    },
    brazilianNote:
      "“Se eu **tivesse**”, “se eu **fosse**”: em francês, *si j'**avais***, *si j'**étais*** — o *imparfait*, não um subjuntivo. E nunca *si j'aurais* (erro comum até de francófonos, mas considerado errado).",
    examples: [
      {
        fr: "Si j'avais plus de temps, j'apprendrais le piano.",
        pt: "Se eu tivesse mais tempo, aprenderia piano.",
      },
      { fr: "Si j'étais toi, j'accepterais l'offre.", pt: "Se eu fosse você, aceitaria a oferta." },
      { fr: "Si tu as besoin d'aide, appelle-moi.", pt: "Se você precisar de ajuda, me liga." },
    ],
    commonMistakes: [
      {
        wrong: "Si j'aurais le temps, je viendrais.",
        right: "Si j'avais le temps, je viendrais.",
        why: "Depois de *si*: *imparfait*, nunca condicional.",
      },
      {
        wrong: "Si j'aurai le temps, je viendrai.",
        right: "Si j'ai le temps, je viendrai.",
        why: "Depois de *si*: presente, nunca futuro.",
      },
    ],
    prerequisites: ["gram:conditionnel-present"],
    tags: ["hipótese", "verbos"],
  },
  {
    id: "lex:si-j-etais-toi",
    kind: "lexical",
    level: "B1",
    french: "si j'étais toi / à ta place",
    pos: "expression",
    ipa: "/si ʒe.tɛ twa/",
    meaning: "se eu fosse você / no seu lugar",
    forms: ["si j'étais toi", "à ta place", "si j'étais vous", "à votre place"],
    examples: [
      { fr: "À ta place, je prendrais le CDI.", pt: "No seu lugar, eu pegaria o contrato fixo." },
    ],
    tags: ["conselho", "hipótese"],
  },

  // ─── Unit 3: present subjunctive ───
  {
    id: "gram:subjonctif-present",
    kind: "grammar",
    level: "B1",
    title: { pt: "Il faut que je…: o subjuntivo", fr: "Le subjonctif présent" },
    summary: {
      pt: "Depois de **il faut que**, **vouloir que**, **avant que**, **pour que**, **bien que**… o verbo vai para o subjuntivo: *il faut que je **parte***. O português também usa: “é preciso que eu **vá**”.",
    },
    explanation: {
      pt: [
        "Formação regular: radical de **ils** no presente (*ils parl**ent** → parl-*) + **-e, -es, -e, -ions, -iez, -ent**: *que je parl**e**, que nous parl**ions***.",
        "Irregulares frequentes: *être → que je **sois*** · *avoir → que j'**aie*** · *aller → que j'**aille*** · *faire → que je **fasse*** · *pouvoir → que je **puisse*** · *savoir → que je **sache*** · *vouloir → que je **veuille***.",
        "Quando? Depois de expressões de **necessidade** (*il faut que*), **vontade** (*je veux que*), **emoção** (*je suis content que*), **finalidade** (*pour que*) e de *avant que*, *bien que*.",
        "Com o mesmo sujeito, use o infinitivo: *je veux **partir*** (não *je veux que je parte*).",
      ],
    },
    brazilianNote:
      "Boa notícia: o português também tem subjuntivo nesses casos — “é preciso que você **venha**”, “quero que ele **saiba**”. Se em português há subjuntivo depois de “que”, em francês quase sempre também há.",
    examples: [
      { fr: "Il faut que tu viennes demain.", pt: "É preciso que você venha amanhã." },
      {
        fr: "Je veux que mes enfants parlent français.",
        pt: "Quero que meus filhos falem francês.",
      },
      { fr: "Je te le dis pour que tu saches.", pt: "Estou te contando para que você saiba." },
    ],
    commonMistakes: [
      {
        wrong: "Il faut que tu viens.",
        right: "Il faut que tu viennes.",
        why: "Depois de *il faut que*: subjuntivo, *viennes*.",
      },
      {
        wrong: "Je veux que je parte.",
        right: "Je veux partir.",
        why: "Mesmo sujeito: infinitivo.",
      },
    ],
    prerequisites: ["gram:il-faut-devoir"],
    tags: ["subjuntivo", "verbos"],
  },
  {
    id: "lex:il-faut-que",
    kind: "lexical",
    level: "B1",
    french: "il faut que…",
    pos: "expression",
    ipa: "/il fo kə/",
    meaning: "é preciso que…",
    forms: ["il faut que", "il faut qu'"],
    examples: [
      {
        fr: "Il faut que je renouvelle mon permis.",
        pt: "É preciso que eu renove a minha autorização.",
      },
    ],
    tags: ["subjuntivo", "obrigação"],
  },

  // ─── Unit 4: reported speech ───
  {
    id: "gram:discours-indirect",
    kind: "grammar",
    level: "B1",
    title: { pt: "Il m'a dit que…: discurso indireto", fr: "Le discours indirect" },
    summary: {
      pt: "Para relatar o que alguém disse ou perguntou: *Il dit **que** le bureau ferme à 17 h.* / *Elle m'a demandé **si** j'avais un garant.* / *Il veut savoir **où** j'habite.*",
    },
    explanation: {
      pt: [
        "Afirmação: **dire que** + frase: *Le propriétaire dit **que** le loyer augmente.*",
        "Pergunta sim/não: **demander si**: *Elle m'a demandé **si** j'étais disponible.*",
        "Pergunta com palavra interrogativa: ela se mantém, sem *est-ce que* e sem inversão: *Il veut savoir **où** tu habites / **quand** tu arrives.* Para *qu'est-ce que* → **ce que**: *Il m'a demandé **ce que** je faisais.*",
        "Com o verbo introdutor no passado (*il a dit que…*), o presente costuma virar *imparfait*: *« Je suis fatigué » → Il a dit qu'il **était** fatigué.*",
      ],
    },
    brazilianNote:
      "O português faz o mesmo (“ele disse que **estava** cansado”). Dois cuidados: “se” de pergunta indireta é **si** (*il m'a demandé si…*), e “o que” vira **ce que** (*je ne sais pas ce que tu veux*).",
    examples: [
      { fr: "Il m'a dit qu'il était en retard.", pt: "Ele me disse que estava atrasado." },
      { fr: "Elle m'a demandé si j'avais un garant.", pt: "Ela me perguntou se eu tinha fiador." },
      { fr: "Je ne sais pas ce qu'il veut.", pt: "Não sei o que ele quer." },
    ],
    commonMistakes: [
      {
        wrong: "Il m'a demandé est-ce que j'habite ici.",
        right: "Il m'a demandé si j'habitais ici.",
        why: "Pergunta sim/não indireta: *si*, sem *est-ce que*.",
      },
      {
        wrong: "Je ne sais pas qu'est-ce qu'il veut.",
        right: "Je ne sais pas ce qu'il veut.",
        why: "No indireto, *qu'est-ce que* vira *ce que*.",
      },
    ],
    prerequisites: ["gram:imparfait", "gram:questions"],
    tags: ["discurso", "narração"],
  },

  // ─── Unit 5: giving an opinion ───
  {
    id: "gram:exprimer-opinion",
    kind: "grammar",
    level: "B1",
    title: { pt: "Dar a sua opinião", fr: "Exprimer son opinion" },
    summary: {
      pt: "*Je pense que* / *je trouve que* + indicativo; *je ne pense pas que* + **subjuntivo**. E os conectores para argumentar: *d'un côté… de l'autre*, *par contre*, *pourtant*, *donc*.",
    },
    explanation: {
      pt: [
        "Opinião afirmativa — **indicativo**: *Je pense que c'**est** une bonne idée.* · *À mon avis, …* · *Je trouve que…*",
        "Opinião negativa ou dúvida — **subjuntivo**: *Je ne pense pas que ce **soit** une bonne idée.* · *Je doute que…*",
        "Para argumentar: **d'un côté… de l'autre** (por um lado… por outro) · **par contre / en revanche** (por outro lado, em compensação) · **pourtant** (no entanto) · **donc** (portanto).",
      ],
    },
    brazilianNote:
      "Igual ao português: “acho que **é**” (indicativo) × “não acho que **seja**” (subjuntivo). E cuidado: *par contre* é “em compensação, já”, não “por contra”.",
    examples: [
      {
        fr: "À mon avis, Montréal est plus agréable que Toronto.",
        pt: "Na minha opinião, Montréal é mais agradável que Toronto.",
      },
      { fr: "Je ne pense pas que ce soit trop cher.", pt: "Não acho que seja caro demais." },
      {
        fr: "Le loyer est élevé ; par contre, le quartier est très calme.",
        pt: "O aluguel é alto; em compensação, o bairro é muito tranquilo.",
      },
    ],
    commonMistakes: [
      {
        wrong: "Je pense que ce soit une bonne idée.",
        right: "Je pense que c'est une bonne idée.",
        why: "Opinião afirmativa: indicativo.",
      },
      {
        wrong: "Je ne pense pas que c'est vrai.",
        right: "Je ne pense pas que ce soit vrai.",
        why: "Opinião negativa: subjuntivo.",
      },
    ],
    prerequisites: ["gram:subjonctif-present"],
    tags: ["opinião", "argumentação"],
  },
  {
    id: "lex:a-mon-avis",
    kind: "lexical",
    level: "B1",
    french: "à mon avis",
    pos: "expression",
    ipa: "/a mɔ̃.n‿a.vi/",
    meaning: "na minha opinião",
    examples: [{ fr: "À mon avis, il faut essayer.", pt: "Na minha opinião, vale tentar." }],
    tags: ["opinião"],
  },
  {
    id: "lex:par-contre",
    kind: "lexical",
    level: "B1",
    french: "par contre / en revanche",
    pos: "expression",
    ipa: "/paʁ kɔ̃tʁ/, /ɑ̃ ʁə.vɑ̃ʃ/",
    meaning: "em compensação, por outro lado",
    forms: ["par contre", "en revanche"],
    examples: [
      {
        fr: "Le salaire est bas ; par contre, l'ambiance est super.",
        pt: "O salário é baixo; em compensação, o ambiente é ótimo.",
      },
    ],
    tags: ["argumentação", "conectores"],
  },
  {
    id: "lex:pourtant",
    kind: "lexical",
    level: "B1",
    french: "pourtant",
    pos: "adverb",
    ipa: "/puʁ.tɑ̃/",
    meaning: "no entanto, mesmo assim",
    examples: [
      {
        fr: "Il a beaucoup étudié, pourtant il a raté l'examen.",
        pt: "Ele estudou muito; no entanto, foi reprovado.",
      },
    ],
    tags: ["argumentação", "conectores"],
  },
];
