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
| canada | A0 | Bem-vindo ao Québec — Bonjour-Hi, *bienvenue*, *c'est correct*; *déjeuner/dîner/souper*, *fin de semaine*, *dépanneur* | 2 | Num café em Montréal |
| canada | A1 | Chegar e se instalar — border questions, bank account, renting in Montréal | 3 | Abrir uma conta no banco |
| france | A0 | O dia a dia na França — boulangerie, meal names and hours | 2 | Na boulangerie |
| france | A1 | Se instalar na França — métro, préfecture and documents, renting | 3 | No guichê da préfecture |

Totals: 118 concepts, 27 lessons, 230 activities, 7 scenarios (`npm run content:check` prints the
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

## Growth plan

1. **Core A1** (in progress) — done: *être*, *avoir*, professions. Next: family and possessives;
   regular -er verbs, negation, days and time; definite articles and contractions (*au*, *du*);
   questions, *aller* and the near future. Placement start points move with it: A1 learners now
   start in A1 instead of only getting reviews and tracks.
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
