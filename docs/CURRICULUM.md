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
├── Placement bank  125 items (authored difficulty estimates)     (content/placement/)
└── Scenarios       tutor roleplays tied to units                 (content/scenarios.ts)
```

- **Concepts** are the unit of memory. Lessons _introduce_ concepts on teaching cards and
  _target_ concept × dimension pairs in activities; FSRS schedules each pair separately
  ([MASTERY.md](MASTERY.md)).
- **Paths** are ordered sequences of lessons. The **core** path is the language itself, in order.
  The **destination tracks** (_Vivre au Canada_, _Vivre en France_) cover the situations and the
  regional usage of each destination.
- A **unit** is defined by its can-do statement, written from the learner's point of view, and
  may end with a **mission**: a tutor scenario that reuses the unit in a free conversation.

## How the paths are combined

The daily planner ([ARCHITECTURE.md](ARCHITECTURE.md), `lib/learning/planner`) takes the next
lessons from the core path, starting at the learner's start lesson (placement result or the first
lesson), and the next lessons of the destination tracks:

| Destination (onboarding) | Tracks                         |
| ------------------------ | ------------------------------ |
| Canada / Québec          | canada                         |
| França                   | france                         |
| Os dois                  | canada, then france            |
| Ainda não sei            | none (international core only) |

Learners who are relocating get one track lesson right after the first core lesson of a session,
at most one per session. Track lessons are eligible up to one level above the learner's estimated
level, and only once the learner has met every concept the lesson practises without teaching it
(`lessonDependencies`). Every lesson stays browsable on the course map (`/curso`).

**Tracks are self-contained.** A track lesson only practises concepts introduced earlier in the
same track (enforced by `content/course.test.ts`), so a track can start after the very first core
lesson. When later track units genuinely need core grammar, the runtime gate above keeps them
waiting until the learner has met it.

## Content today

| Path   | Level | Unit                                                                                                                                                             | Lessons | Mission                           |
| ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------- |
| core   | A0    | Bonjour! — greetings, tu/vous, introducing yourself                                                                                                              | 4       | Primeiro encontro                 |
| core   | A0    | Os sons do francês — /y/–/u/, nasals, silent finals, R                                                                                                           | 4       | —                                 |
| core   | A0    | Os números — 0–20, age with _avoir_                                                                                                                              | 3       | —                                 |
| core   | A0    | No café — ordering, prices, paying                                                                                                                               | 3       | Num café em Paris                 |
| core   | A1    | Quem sou eu — _être_ and _avoir_ in the present, _avoir faim/soif/froid_, professions in the feminine                                                            | 3       | Primeiro encontro                 |
| core   | A1    | Minha família — family words (_les parents_ ≠ parentes), possessives, the Brazilian “seu” → _votre/ton_                                                          | 3       | —                                 |
| core   | A1    | Meu dia — regular _-er_ verbs (silent _-ent_), _ne… pas_ and _pas de_, days of the week, telling the time                                                        | 3       | —                                 |
| core   | A1    | Na cidade — definite articles and gender traps, _au/du_ like “ao/do”, _il y a_ (existence) vs _il a_ (possession), places and _près de / à côté de / en face de_ | 3       | Pedir informação na rua           |
| core   | A1    | Perguntas e planos — intonation and _est-ce que_ questions, question words, _aller_, the near future (= “vou + verbo”)                                           | 3       | Planos para o fim de semana       |
| core   | A1    | Compras e comida — the partitive where Portuguese has no article, _pas de_, quantities                                                                           | 3       | Compras na feira                  |
| core   | A1    | Saúde — _avoir mal à_ with contractions, symptoms, _ordonnance_ (false friend), emergency numbers                                                                | 3       | Na farmácia                       |
| core   | A1    | O tempo e as estações — _il fait_ (never _il est chaud_), _il fait froid_ vs _j'ai froid_, _au printemps_, Québec's _tuque_, forecasts                           | 3       | —                                 |
| core   | A1    | Minha rotina — reflexive verbs, _ne… pas_ around pronoun + verb, verbs reflexive only in French, sequencing                                                      | 3       | —                                 |
| core   | A1    | Querer, poder, fazer, pegar — _vouloir/pouvoir_ + infinitive, survival phrases, _faire les courses_, _prendre le bus_                                            | 3       | —                                 |
| core   | A2    | O que você fez? — _passé composé_ with _avoir_ (regular and irregular participles), _hier_, _il y a_ + duration                                                  | 3       | Como foi o seu fim de semana?     |
| core   | A2    | Para onde você foi? — _passé composé_ with _être_, agreement, reflexive verbs in the past, _rester_ ≠ restar                                                     | 3       | —                                 |
| core   | A2    | Antes e agora — the _imparfait_ (= Portuguese -ava/-ia) for description and habits, _avant / maintenant_                                                         | 3       | —                                 |
| core   | A2    | Y e en — the two pronouns Portuguese lacks: _j'y vais_, _j'en ai deux_, _on y va !_                                                                              | 2       | —                                 |
| core   | A2    | Descrever e comparar — adjective agreement and position, _plus / moins / aussi… que_, _meilleur_ vs _mieux_                                                      | 3       | Lá e aqui                         |
| core   | A2    | Contar uma história — _passé composé_ and _imparfait_ together (setting vs events), _soudain_, _pendant que_                                                     | 2       | —                                 |
| core   | A2    | Je l'ai vu! — object pronouns _le/la/les_ (the Brazilian “vi ele”) and _lui/leur_ with _à_-verbs                                                                 | 2       | —                                 |
| core   | A2    | Planos para o futuro — _futur simple_, and _quand_ + future where Portuguese uses the future subjunctive                                                         | 2       | Seus planos                       |
| core   | A2    | É preciso, tem que, deveria — _il faut_, _il ne faut pas_ ≠ “não precisa”, _devoir_, _tu devrais_                                                                | 2       | —                                 |
| core   | A2    | Qui, que, où — splitting the Portuguese “que”, _le jour où_ (“em que”)                                                                                           | 2       | —                                 |
| core   | B1    | Eu gostaria, o senhor poderia — the conditional for polite requests and wishes (vs the Brazilian “eu queria”)                                                    | 2       | —                                 |
| core   | B1    | Se eu tivesse… — _si_ + imparfait (where Portuguese uses the subjunctive), never _si j'aurais_; real vs imaginary                                                | 2       | —                                 |
| core   | B1    | É preciso que… — present subjunctive after _il faut que_, will, emotion, purpose; infinitive with the same subject                                               | 2       | —                                 |
| core   | B1    | Ele disse que… — reported speech: _dire que_, _demander si_, _ce que_, backshift to the imparfait                                                                | 2       | —                                 |
| core   | B1    | Dar a sua opinião — _je pense que_ + indicative vs _je ne pense pas que_ + subjunctive, argument connectors                                                      | 2       | Dar a sua opinião                 |
| canada | A0    | Bem-vindo ao Québec — Bonjour-Hi, _bienvenue_, _c'est correct_; _déjeuner/dîner/souper_, _fin de semaine_, _dépanneur_                                           | 2       | Num café em Montréal              |
| canada | A1    | Chegar e se instalar — border questions, bank account, renting in Montréal                                                                                       | 3       | Abrir uma conta no banco          |
| canada | A2    | Trabalho e saúde no Québec — job ads, _entrevue_, NAS, _une job_; RAMQ card, _clinique sans rendez-vous_, CLSC                                                   | 3       | Entrevista de emprego em Montréal |
| france | A0    | O dia a dia na França — boulangerie, meal names and hours                                                                                                        | 2       | Na boulangerie                    |
| france | A1    | Se instalar na França — métro, préfecture and documents, renting                                                                                                 | 3       | No guichê da préfecture           |
| france | A2    | Trabalho, saúde e auxílios — France Travail, _entretien d'embauche_, CDI/CDD; _médecin traitant_, _mutuelle_, CAF                                                | 3       | Entrevista de emprego em Paris    |

Totals: 267 concepts, 94 lessons, 657 activities, 17 scenarios (`npm run content:check` prints the
current numbers).

### What makes the tracks genuinely different

- **Voices and register.** Track activities use fr-CA or fr-FR voices; reviews of Québec words are
  voiced in fr-CA. The Québec tutor scenarios allow _tu_ sooner; the French ones _vouvoient_.
- **Same word, different meaning.** _le déjeuner_ and _le dîner_ exist twice (`lex:le-diner-qc`,
  `lex:le-diner-fr`), with region-specific meanings. Reviews never use one as a distractor for the
  other.
- **Different systems, not just words.** Apartment sizes (_4 ½_ vs _deux-pièces_), bank vocabulary
  (_NIP_ vs _code_), administrative bodies (_préfecture_ vs _mairie_, a false friend for
  Brazilians).
- **Cross-notes.** Each track explains the other side briefly ("Na França…", "No Québec…"), so a
  learner choosing _Os dois_ sees the contrast where it matters.

## Authentic content

`content/authentic.ts` lists real French from official or established free sources — video,
radio, podcasts and texts — with the level from which each becomes useful, the region, whether a
transcript exists and the date the link was last checked by hand. The app only links to them
(`rights: "link"`); nothing is copied or rehosted. `/conteudo` ranks them by level (up to one
level above the learner) and destination, and the dashboard suggests one per day. Re-check the
links whenever the file is touched; the content test requires https and a `checkedOn` date.

## Growth plan

1. **Core A1–B1** — done: A1.1–A2.2 and B1.1 (25 units, 64 lessons). Next: B1.2 — the _plus-que-parfait_,
   _en_ + gerund, relative _dont_, the passive, longer listening at natural speed and structured
   monologues for the oral exams.
2. **Tracks A1–A2** — Canada: health card and clinic (_carte d'assurance maladie_, _CLSC_), job
   search and interview, winter, public transport (STM), Québec informal speech in
   _recognition-only_ activities (_chu_, _pantoute_, _icitte_). France: health and _médecin
   traitant_, CAF and housing aid, job market, university life, regional variety.
3. **A2 → C1 core** — the past tenses, pronouns _y/en_, subjunctive, register and mediation tasks,
   longer authentic listening.
4. **Exam tracks** (TEF Canada, TCF Canada, DELF/DALF) as separate paths with task-type practice
   and _readiness estimates_ that never claim equivalence with official results.

Each new unit ships with: concepts with Brazilian notes where relevant, lessons that pass the
content tests, review coverage for every concept × dimension, and an E2E or integration check if
it adds new behaviour.
