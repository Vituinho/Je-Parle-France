# Pedagogy

This document describes how Je Parle Français teaches. Engineering decisions (mastery model,
planner, graders) implement these principles; when the two disagree, fix one of them.

## Framework: CEFR, action-oriented

- Proficiency is described with the **CEFR and its Companion Volume (2020)**: levels A1–C2 with
  *can-do* descriptors for reception, production, interaction and mediation. We add **A0** as a
  friendly product label for learners below A1 (Pre-A1 in the Companion Volume).
- The curriculum is **action-oriented**: every unit is defined by what the learner can *do*
  afterwards ("order and pay in a café, understanding the usual questions"), and grammar and
  vocabulary are chosen because the task needs them.
- Levels are **per skill**. Reading, listening, speaking, writing, vocabulary, grammar and
  pronunciation are estimated separately; the "overall" level is a summary, never the model.

## Learning science we rely on

| Principle | How it shows up |
| --- | --- |
| Retrieval practice | Activities ask the learner to produce or recognise, not reread. Flashcards are always active recall. |
| Spacing (FSRS) | Every concept × dimension has its own memory trace scheduled by FSRS. |
| Interleaving | Daily sessions mix review of older concepts with new ones and different skills. |
| Comprehensible input | Listening and reading are calibrated slightly above the learner's level; transcripts and speed control are available. |
| Output & noticing | Typed and spoken production with specific feedback (expected form, the difference, why). |
| Perceptual training | Pronunciation starts with *hearing* the contrast (minimal pairs, varied voices) before producing it. |
| Cognitive load | New concepts per session are capped by available time and review backlog; teaching cards are short; one new idea per card. |
| Desirable difficulty, not frustration | Items are chosen near the learner's estimated level; hints lower the rating instead of blocking progress. |

## Lesson design pattern

A **lesson** is a 5–8 minute chunk built as *present → guided practice → free(r) production*:

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

- **Sounds:** `/y/` (*tu, rue, vu*) vs `/u/` (*tout, roue, vous*); `/ø/` and `/œ/`; nasal vowels
  (*an/en, on, in/un*) — Portuguese nasals are similar but not identical, and French does not
  nasalise vowels before a pronounced *n/m* (*bonne* vs *bon*); the uvular R; silent final
  consonants; schwa (*e* caduc); liaison and enchaînement; stress on the final syllable of the
  rhythmic group (Portuguese has lexical stress).
- **Grammar:** obligatory subject pronouns; articles where Portuguese omits them (*j'aime le
  café*); partitive *du/de la/des*; gender mismatches (*le lait, la mer, le sang, la dent*);
  *avoir* for age, hunger, fear (*j'ai 20 ans, j'ai faim*); *avoir besoin de*; *en* and *y*;
  passé composé auxiliary choice; passé composé vs imparfait (Portuguese pretérito
  perfeito/imperfeito maps only partially); subjunctive triggers; negation *ne … pas*.
- **Lexicon:** false cognates (*attendre* = esperar, não atender; *rester* = ficar; *embrasser* =
  beijar; *un costume* = terno; *une tasse* = xícara; *exquis* = requintado, não esquisito;
  *le collège* = ensino fundamental II); literal translation traps (*je suis d'accord* ✓ but
  *je suis 20 ans* ✗).
- **Pragmatics:** *tu* vs *vous* (and Québec's broader use of *tu*), greetings and *bonjour* as a
  social obligation in France, politeness formulas, register.

## Portuguese → French support policy

Support language is a **policy computed per learner and per activity**, not a hard rule by CEFR
level (`src/lib/learning/language-support.ts`):

| Learner level | Default instructions | Explanations |
| --- | --- | --- |
| A0 | Portuguese | Portuguese, French examples |
| A1 | Portuguese, short French phrases | Portuguese |
| A2 | Bilingual (French first, Portuguese gloss) | Portuguese |
| B1 | French | French, Portuguese on request |
| B2 | French | French |
| C1 | French | French |

The learner preference (*mais português* / *automático* / *mais francês*) shifts this by one step,
and every explanation offers **Explicar em português**.

## Regional variation policy

- Teach **international French** as the base for A0–A2.
- From A1, add *Au Québec / Au Canada* notes where a learner heading to Canada would otherwise be
  surprised (*le déjeuner/dîner/souper*, *magasiner*, *une fin de semaine*, *tu* in service
  contexts, *char* as an informal word to recognise, not produce).
- Listening progressively introduces Québec/Canadian, Belgian, Swiss and African accents.
- Local expressions are always labelled; nothing regional is presented as universal.

## Feedback principles

- Deterministic activities give immediate, specific feedback: the expected answer, what differed
  (accent, gender, word order, agreement), and a short why.
- Missing accents and small typos are *almost correct* (partial credit, explicit note) — they
  matter in French, but they are not the same as not knowing the word.
- Conversation feedback respects the learner's correction preference; by default only important,
  meaning-affecting or recurring errors are corrected live, the rest go into the end report.
- Important errors become review items for that learner.

## Assessment honesty

Internal placement and readiness estimates are **learning tools**, never official results. Exam
tracks always distinguish *platform estimate* from *official certification*, and immigration
score conversions (NCLC/CLB) are taken from current official IRCC/MIFI documentation.
