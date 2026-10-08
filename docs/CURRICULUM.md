# Curriculum

How the course is organised, what exists today and how it grows. Teaching principles are in
[PEDAGOGY.md](PEDAGOGY.md); authoring rules in [CONTENT-GUIDELINES.md](CONTENT-GUIDELINES.md).

## Structure

```
Course
├── Concepts        lexical · grammar · pronunciation · culture   (content/concepts/)
├── Paths           core · canada · france                        (content/curriculum/)
│   └── Module (one CEFR level, one path)
│       └── Unit (one can-do objective, optional tutor mission)
│           └── Lesson (5–8 min: teach → recognise → produce)
│               └── Activity (15 types, each targets concept × dimension)
├── Placement bank  125 calibrated items                          (content/placement/)
└── Scenarios       tutor roleplays tied to units                 (content/scenarios.ts)
```

- **Concepts** are the unit of memory. Lessons *introduce* concepts on teaching cards and
  *target* concept × dimension pairs in activities; FSRS schedules each pair separately
  ([MASTERY.md](MASTERY.md)).
- **Paths** are ordered sequences of lessons. The **core** path is the language itself, in order.
  The **destination tracks** (*Vivre au Canada*, *Vivre en France*) cover the situations and the
  regional usage of each destination.
- A **unit** is defined by its can-do statement, written from the learner's point of view, and
  may end with a **mission**: a tutor scenario that reuses the unit in a free conversation.

## How the paths are combined

The daily planner ([ARCHITECTURE.md](ARCHITECTURE.md), `lib/learning/planner`) takes the next
lessons from the core path, starting at the learner's start lesson (placement result or the first
lesson), and the next lessons of the destination tracks:

| Destination (onboarding) | Tracks |
| --- | --- |
| Canada / Québec | canada |
| França | france |
| Os dois | canada, then france |
| Ainda não sei | none (international core only) |

Learners who are relocating get one track lesson right after the first core lesson of a session,
at most one per session. Track lessons are eligible up to one level above the learner's estimated
level, and only once the learner has met every concept the lesson practises without teaching it
(`lessonDependencies`). Every lesson stays browsable on the course map (`/curso`).

**Tracks are self-contained.** A track lesson only practises concepts introduced earlier in the
same track (enforced by `content/course.test.ts`), so a track can start after the very first core
lesson. When later track units genuinely need core grammar, the runtime gate above keeps them
waiting until the learner has met it.

## Content today

| Path | Level | Unit | Lessons | Mission |
| --- | --- | --- | --- | --- |
| core | A0 | Bonjour! — greetings, tu/vous, introducing yourself | 4 | Primeiro encontro |
| core | A0 | Os sons do francês — /y/–/u/, nasals, silent finals, R | 4 | — |
| core | A0 | Os números — 0–20, age with *avoir* | 3 | — |
| core | A0 | No café — ordering, prices, paying | 3 | Num café em Paris |
| core | A1 | Quem sou eu — *être* and *avoir* in the present, *avoir faim/soif/froid*, professions in the feminine | 3 | Primeiro encontro |
| core | A1 | Minha família — family words (*les parents* ≠ parentes), possessives, the Brazilian “seu” → *votre/ton* | 3 | — |
| core | A1 | Meu dia — regular *-er* verbs (silent *-ent*), *ne… pas* and *pas de*, days of the week, telling the time | 3 | — |
| core | A1 | Na cidade — definite articles and gender traps, *au/du* like “ao/do”, *il y a* (existence) vs *il a* (possession), places and *près de / à côté de / en face de* | 3 | Pedir informação na rua |
| core | A1 | Perguntas e planos — intonation and *est-ce que* questions, question words, *aller*, the near future (= “vou + verbo”) | 3 | Planos para o fim de semana |
| core | A1 | Compras e comida — the partitive where Portuguese has no article, *pas de*, quantities | 3 | Compras na feira |
| core | A1 | Saúde — *avoir mal à* with contractions, symptoms, *ordonnance* (false friend), emergency numbers | 3 | Na farmácia |
| core | A1 | O tempo e as estações — *il fait* (never *il est chaud*), *il fait froid* vs *j'ai froid*, *au printemps*, Québec's *tuque*, forecasts | 3 | — |
| core | A1 | Minha rotina — reflexive verbs, *ne… pas* around pronoun + verb, verbs reflexive only in French, sequencing | 3 | — |
| core | A1 | Querer, poder, fazer, pegar — *vouloir/pouvoir* + infinitive, survival phrases, *faire les courses*, *prendre le bus* | 3 | — |
| core | A2 | O que você fez? — *passé composé* with *avoir* (regular and irregular participles), *hier*, *il y a* + duration | 3 | Como foi o seu fim de semana? |
| core | A2 | Para onde você foi? — *passé composé* with *être*, agreement, reflexive verbs in the past, *rester* ≠ restar | 3 | — |
| core | A2 | Antes e agora — the *imparfait* (= Portuguese -ava/-ia) for description and habits, *avant / maintenant* | 3 | — |
| core | A2 | Y e en — the two pronouns Portuguese lacks: *j'y vais*, *j'en ai deux*, *on y va !* | 2 | — |
| core | A2 | Descrever e comparar — adjective agreement and position, *plus / moins / aussi… que*, *meilleur* vs *mieux* | 3 | Lá e aqui |
| canada | A0 | Bem-vindo ao Québec — Bonjour-Hi, *bienvenue*, *c'est correct*; *déjeuner/dîner/souper*, *fin de semaine*, *dépanneur* | 2 | Num café em Montréal |
| canada | A1 | Chegar e se instalar — border questions, bank account, renting in Montréal | 3 | Abrir uma conta no banco |
| france | A0 | O dia a dia na França — boulangerie, meal names and hours | 2 | Na boulangerie |
| france | A1 | Se instalar na França — métro, préfecture and documents, renting | 3 | No guichê da préfecture |

Totals: 229 concepts, 68 lessons, 508 activities, 13 scenarios (`npm run content:check` prints the
current numbers).

### What makes the tracks genuinely different

- **Voices and register.** Track activities use fr-CA or fr-FR voices; reviews of Québec words are
  voiced in fr-CA. The Québec tutor scenarios allow *tu* sooner; the French ones *vouvoient*.
- **Same word, different meaning.** *le déjeuner* and *le dîner* exist twice (`lex:le-diner-qc`,
  `lex:le-diner-fr`), with region-specific meanings. Reviews never use one as a distractor for the
  other.
- **Different systems, not just words.** Apartment sizes (*4 ½* vs *deux-pièces*), bank vocabulary
  (*NIP* vs *code*), administrative bodies (*préfecture* vs *mairie*, a false friend for
  Brazilians).
- **Cross-notes.** Each track explains the other side briefly ("Na França…", "No Québec…"), so a
  learner choosing *Os dois* sees the contrast where it matters.

## Authentic content

`content/authentic.ts` lists real French from official or established free sources — video,
radio, podcasts and texts — with the level from which each becomes useful, the region, whether a
transcript exists and the date the link was last checked by hand. The app only links to them
(`rights: "link"`); nothing is copied or rehosted. `/conteudo` ranks them by level (up to one
level above the learner) and destination, and the dashboard suggests one per day. Re-check the
links whenever the file is touched; the content test requires https and a `checkedOn` date.

## Growth plan

1. **Core A1–A2** — done: A1.1, A1.2 and A2.1 (15 units, 44 lessons). Next for A2: *passé composé*
   vs *imparfait* in the same story, object pronouns (*le, la, lui, leur*), the future tense, *il faut*
   and obligation, work and housing in more depth.
2. **Tracks A1–A2** — Canada: health card and clinic (*carte d'assurance maladie*, *CLSC*), job
   search and interview, winter, public transport (STM), Québec informal speech in
   *recognition-only* activities (*chu*, *pantoute*, *icitte*). France: health and *médecin
   traitant*, CAF and housing aid, job market, university life, regional variety.
3. **A2 → C1 core** — the past tenses, pronouns *y/en*, subjunctive, register and mediation tasks,
   longer authentic listening.
4. **Exam tracks** (TEF Canada, TCF Canada, DELF/DALF) as separate paths with task-type practice
   and *readiness estimates* that never claim equivalence with official results.

Each new unit ships with: concepts with Brazilian notes where relevant, lessons that pass the
content tests, review coverage for every concept × dimension, and an E2E or integration check if
it adds new behaviour.
