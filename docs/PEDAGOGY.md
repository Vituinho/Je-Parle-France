# Pedagogy

Continuous estimation requires varied tasks across days near the next CEFR band, with explicit
confidence and quality gates. One success or failure never promotes or demotes. The dashboard
explains stable estimates and uncertainty; completion percentages describe course progress only.
Semantic writing prioritizes meaning and task completion, selects at most three important issues,
and does not turn advanced experimentation into automatic mastery penalties. See
`SKILL-ESTIMATION.md` for the implemented rules.

This document describes how Je Parle Français teaches. Engineering decisions (mastery model,
planner, graders) implement these principles; when the two disagree, fix one of them.

## Framework: CEFR, action-oriented

- Proficiency is described with the **CEFR and its Companion Volume (2020)**: levels A1–C2 with
  _can-do_ descriptors for reception, production, interaction and mediation. We add **A0** as a
  friendly product label for learners below A1 (Pre-A1 in the Companion Volume).
- The curriculum is **action-oriented**: every unit is defined by what the learner can _do_
  afterwards ("order and pay in a café, understanding the usual questions"), and grammar and
  vocabulary are chosen because the task needs them.
- Levels are **per skill**. Reading, listening, speaking, writing, vocabulary, grammar and
  pronunciation are estimated separately; the "overall" level is a summary, never the model.

## Learning science we rely on

| Principle                             | How it shows up                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Retrieval practice                    | Activities ask the learner to produce or recognise, not reread. Flashcards are always active recall.                  |
| Spacing (FSRS)                        | Every concept × dimension has its own memory trace scheduled by FSRS.                                                 |
| Interleaving                          | Daily sessions mix review of older concepts with new ones and different skills.                                       |
| Comprehensible input                  | Listening and reading are calibrated slightly above the learner's level; transcripts and speed control are available. |
| Output & noticing                     | Typed and spoken production with specific feedback (expected form, the difference, why).                              |
| Perceptual training                   | Pronunciation starts with _hearing_ the contrast (minimal pairs, varied voices) before producing it.                  |
| Cognitive load                        | New concepts per local day are capped by level, time, recent retention and review backlog; teaching cards stay short. |
| Desirable difficulty, not frustration | Items are chosen near the learner's estimated level; hints lower the rating instead of blocking progress.             |

## Lesson design pattern

Intensive study extends the existing daily planner. Additional available time favours listening,
spoken and written production, pronunciation and prerequisite-safe application rather than
unlimited teaching. Due reviews stay on the FSRS calendar; extra skill practice does not reschedule
memory. A beginner applies freshly taught words through dictation, oral response and active recall,
without padding a ninety-minute goal with recognition drills or unseen example sentences.

Plans above sixty minutes provide resumable groups of roughly twenty-five minutes where there is
enough material, with an earlier natural break between teaching and application. Shorter initial
plans are explicitly shown when useful material is limited. Weekly time totals allow uneven days
and rest; completion and time never prove proficiency. Pace does not independently remove
Portuguese support. See [INTENSIVE-LEARNING.md](INTENSIVE-LEARNING.md) for safeguards and limits.

A **lesson** is a 5–8 minute chunk built as _present → guided practice → free(r) production_:

1. **Teaching card(s)** — one idea each: form, meaning, audio, a Brazilian contrast note when
   relevant, regional note when relevant.
2. **Recognition** — choose / match / listen and choose (scaffold).
3. **Controlled production** — fill the blank, order words, type the answer, dictation.
4. **Freer production** — say it, answer a question, write a short sentence.

A **unit** groups 3–6 lessons around one can-do objective and ends with a **mission**: a roleplay
or production task that uses the unit in context.

## The Brazilian Portuguese layer

Contrastive notes appear only where the Portuguese intuition leads the learner astray. Each note
follows the pattern:

> Em português dizemos "…". Em francês, a estrutura natural é "…" — porque …

Priority contrasts (see `content/` for the actual notes):

- **Sounds:** `/y/` (_tu, rue, vu_) vs `/u/` (_tout, roue, vous_); `/ø/` and `/œ/`; nasal vowels
  (_an/en, on, in/un_) — Portuguese nasals are similar but not identical, and French does not
  nasalise vowels before a pronounced _n/m_ (_bonne_ vs _bon_); the uvular R; silent final
  consonants; schwa (_e_ caduc); liaison and enchaînement; stress on the final syllable of the
  rhythmic group (Portuguese has lexical stress).
- **Grammar:** obligatory subject pronouns; articles where Portuguese omits them (_j'aime le
  café_); partitive _du/de la/des_; gender mismatches (_le lait, la mer, le sang, la dent_);
  _avoir_ for age, hunger, fear (_j'ai 20 ans, j'ai faim_); _avoir besoin de_; _en_ and _y_;
  passé composé auxiliary choice; passé composé vs imparfait (Portuguese pretérito
  perfeito/imperfeito maps only partially); subjunctive triggers; negation _ne … pas_.
- **Lexicon:** false cognates (_attendre_ = esperar, não atender; _rester_ = ficar; _embrasser_ =
  beijar; _un costume_ = terno; _une tasse_ = xícara; _exquis_ = requintado, não esquisito;
  _le collège_ = ensino fundamental II); literal translation traps (_je suis d'accord_ ✓ but
  _je suis 20 ans_ ✗).
- **Pragmatics:** _tu_ vs _vous_ (and Québec's broader use of _tu_), greetings and _bonjour_ as a
  social obligation in France, politeness formulas, register.

## Portuguese → French support policy

Support language is a **policy computed per learner and per activity**, not a hard rule by CEFR
level (`src/lib/learning/language-support.ts`):

| Learner level | Default instructions                       | Explanations                  |
| ------------- | ------------------------------------------ | ----------------------------- |
| A0            | Portuguese                                 | Portuguese, French examples   |
| A1            | Portuguese, short French phrases           | Portuguese                    |
| A2            | Bilingual (French first, Portuguese gloss) | Portuguese                    |
| B1            | French                                     | French, Portuguese on request |
| B2            | French                                     | French                        |
| C1            | French                                     | French                        |

The learner preference (_mais português_ / _automático_ / _mais francês_) shifts this by one step,
and every explanation offers **Explicar em português**.

## Regional variation policy

- Teach **international French** as the base for A0–A2.
- From A1, add _Au Québec / Au Canada_ notes where a learner heading to Canada would otherwise be
  surprised (_le déjeuner/dîner/souper_, _magasiner_, _une fin de semaine_, _tu_ in service
  contexts, _char_ as an informal word to recognise, not produce).
- Listening progressively introduces Québec/Canadian, Belgian, Swiss and African accents.
- Local expressions are always labelled; nothing regional is presented as universal.

## Feedback principles

- Deterministic activities give immediate, specific feedback: the expected answer, what differed
  (accent, gender, word order, agreement), and a short why.
- Missing accents and small typos are _almost correct_ (partial credit, explicit note) — they
  matter in French, but they are not the same as not knowing the word.
- Conversation feedback respects the learner's correction preference; by default only important,
  meaning-affecting or recurring errors are corrected live, the rest go into the end report.
- Important errors become review items for that learner.

## Assessment honesty

Educational diagnostics distinguish immediate success from later unassisted FSRS recall. Small
samples, hints, self-ratings and unknown legacy metadata cannot become a retention percentage or
measured proficiency gain. Weekly evidence counts and mastery/estimate changes describe observations;
they do not prove that a lesson caused improvement. Possible late-session fatigue requires matched
type/difficulty, sufficient first attempts, both lower accuracy and longer active response latency;
it is not a health/attention diagnosis. Routine advice needs repeated sessions on multiple days and
does not automatically change time or scoring. See [LEARNING-TELEMETRY.md](LEARNING-TELEMETRY.md).

Internal placement and readiness estimates are **learning tools**, never official results. Exam
tracks always distinguish _platform estimate_ from _official certification_, and immigration
score conversions (NCLC/CLB) are taken from current official IRCC/MIFI documentation.
