# Product — Je Parle Français

> **French for real life.** · _Francês para a vida real._

## Vision

Je Parle Français takes a Brazilian Portuguese speaker from zero (A0 / Pre-A1) to C1 and makes them
able to **live in French outside the app**: understand real speech, talk to real people, solve
everyday problems, work, study and pass official exams.

Success is not XP. Success is a learner who can open a bank account in Montréal, rent an apartment
in Lyon, survive a job interview, or understand a radio interview — and say _je parle français_.

## Who it is for

Primary: Brazilian Portuguese speakers who want to move to, study in, or work in **Canada/Québec
(≈60 % emphasis)** or **France (≈40 %)**, travel, take an official exam (TEF/TCF Canada, DELF,
DALF), or simply become genuinely fluent. Teenagers and adults.

The product is free, initially for personal use, and architected so it can become a public
platform (multi-user, role-based, privacy-aware) without a rewrite.

## What makes it different

1. **Brazilian Portuguese → French pedagogy.** Explanations contrast French with Brazilian
   Portuguese where it matters: `/y/` vs `/u/`, nasal vowels, the French R, liaison and
   enchaînement, silent final consonants, gender mismatches (_le lait_, _la mer_), false cognates
   (_attendre_ ≠ atender), literal-translation traps (_je suis 20 ans_ → _j'ai 20 ans_), articles,
   _en_/_y_, _tu_/_vous_, rhythm and stress.
2. **Real mastery, not completion.** Every concept is tracked separately for recognition, recall,
   listening, writing, speaking and pronunciation. Reading _j'aurais besoin de_ is not the same as
   saying it.
3. **The learner never decides what to study.** One button — _Começar a sessão de hoje_ — and a
   planner composes the most useful session for the time available.
4. **Multi-dimensional level.** A learner can be B1 in reading and A2 in speaking; the product
   models and shows that.
5. **Life tracks.** _Vivre au Canada_ and _Vivre en France_ teach the situations immigrants
   actually face, with genuine regional differences (not the same lesson with a different flag).
6. **Portuguese support fades.** Heavy PT-BR scaffolding at A0, mostly French at B2, almost all
   French at C1 — always with an _Explicar em português_ escape hatch.
7. **Honest technology.** Speech scores are only shown at the granularity the provider really
   supports. Mocks are labelled as mocks. Internal level estimates are never presented as official
   certification.

## Core journey

```
landing → sign up → onboarding (goals, destination, experience, daily time, target level)
→ placement (quick 8–12 min or complete 25–40 min, adaptive)
→ detailed placement report (per-skill levels, strengths, weaknesses, recommended start, gaps)
→ dashboard (one primary action: today's session)
→ daily session (reviews + new lesson + skill blocks, sized to the learner's time)
→ activities graded deterministically; outcomes update memory & mastery
→ spaced review schedules what to see again
→ AI tutor conversations; important mistakes become review items
→ progress visible per skill
```

## Feature map and status

The authoritative status list is [`ROADMAP.md`](ROADMAP.md). Status vocabulary used everywhere:

| Status           | Meaning                                                                            |
| ---------------- | ---------------------------------------------------------------------------------- |
| **complete**     | Works end-to-end with real logic and persistence, covered by tests.                |
| **mocked**       | Real interface and adapter exist; runs on a development mock when keys are absent. |
| **experimental** | Works, but quality or accuracy is not yet validated.                               |
| **planned**      | Designed, not built. Never exposed as a working button.                            |

## Product principles

- **One clear next action.** Screens exist because they improve learning; no dashboards full of
  equally loud buttons.
- **Production over recognition.** Multiple choice is a scaffold, not the course. Typing, speaking
  and open production grow in weight as the learner advances.
- **International French first, regional variation progressively.** Beginners learn the common
  core; _Au Québec, on entend aussi…_ notes appear as soon as they help, slang comes later.
- **Healthy motivation.** Weekly goals, rest days and streak recovery instead of guilt mechanics.
  Achievements reward meaningful milestones (first tutor conversation, 100 words recognised with
  confidence, four weeks meeting the goal) — never time on screen — and are never taken back.
- **Cost discipline.** LLMs are used only where they add value (conversation, open writing
  feedback, contextual explanation). Deterministic checks never call an LLM.
- **Privacy by design (LGPD).** Voice audio is never stored (only transcripts and scores);
  learners can export everything as JSON, delete conversations, corrections or speech data, and
  delete their account; the privacy page names the external AI providers in use; sensitive
  conversation content is not logged.

## Non-goals (for now)

Native mobile apps, teacher marketplace, payments, social feed, generating the curriculum at
runtime with AI.
