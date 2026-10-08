# Roadmap & status

Status vocabulary: **complete** · **mocked** (real interface + adapter, dev mock without keys) ·
**experimental** · **planned**. This file is updated in the same commit as the feature.

## Vertical slice (v0.1)

| Area | Status | Notes |
| --- | --- | --- |
| Foundation (Next 16, TS strict, Prisma 7, Vitest, CI) | complete | |
| Product / pedagogy / architecture docs | complete | Living documents |
| Content schemas + validation | complete | Zod schemas, cross-reference checks, `npm run content:check` |
| Design system + app shell | complete | Notebook palette, Bricolage + Spectral, métro-line progress |
| Database schema | complete | See DATABASE.md |
| Authentication | complete | Email + password. E-mail verification and password reset: planned (needs an e-mail provider) |
| Onboarding | complete | Goals, destination, experience, daily time, target + deadline estimate, start choice |
| Adaptive placement (quick + complete) | complete | Bayesian adaptive engine, 125-item bank, server-side grading. Speaking items need a speech provider (self-assessment otherwise); open writing needs an LLM |
| Placement report | complete | Per-skill levels with uncertainty, method, strengths/weaknesses, gaps → review, start point, retakes |
| Memory model (FSRS + mastery) | complete | ts-fsrs, derived mastery states |
| Deterministic graders | complete | French-aware text comparison, red-pen diffs |
| A0 curriculum | complete | Module A0.1: 4 units, 14 lessons, 115 activities, 44 concepts (greetings, tu/vous, sounds, numbers, café) |
| Lesson player + activity engine | complete | 15 activity types, server-side grading, missed items re-queued once, honest summary; browser TTS with a single notice when no French voice |
| Daily session planner | complete | Duration-aware composition, backlog handling, cognitive-load caps, destination tracks, skill rotation |
| Dashboard | complete | One primary action, mastery-based progress per skill, weekly goal with rest days, weekly numbers |
| Review session | complete | Per-day generated exercises for every concept × dimension, tutor corrections included |
| Audio / TTS | planned | |
| Pronunciation lab | planned | |
| AI tutor (text) | complete | Claude adapter (structured outputs, refusal fallbacks) + labelled mock; scenarios, 4 correction modes, report, corrections → review; daily quotas |
| AI tutor (voice) | planned | |
| Vocabulary & grammar library | planned | |
| Vivre au Canada / Vivre en France | planned | |
| Admin content explorer | planned | |
| Learning analytics, streaks, achievements | planned | |
| E2E critical flow | planned | |

## After the slice

A1 completion → A2 → B1 → B2 → C1; exam tracks (TEF Canada, TCF Canada, DELF/DALF) with
readiness estimates; shadowing; authentic-content library; database-backed CMS; FSRS parameter
optimisation from review logs; IRT recalibration of placement items from response data; teacher
features (long term).
