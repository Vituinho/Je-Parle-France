# Architecture

## Overview

```
┌──────────────────────────── Next.js 16 (App Router, Cache Components) ───────────────────────────┐
│  src/app/**            Routes. Server Components by default; Client Components only for          │
│                        interaction (activity players, recorder, chat).                           │
│  src/components/**     UI: design-system primitives (ui/), activities/, layout pieces.           │
│                                                                                                  │
│  src/server/**         server-only. Auth, Prisma client, repositories (data access) and          │
│                        services that orchestrate engines + persistence. Server Actions and       │
│                        Route Handlers call services, never Prisma directly.                      │
│                                                                                                  │
│  src/lib/learning/**   Pure TypeScript engines — no React, no Prisma, no I/O:                    │
│                        cefr · placement · memory (FSRS + mastery) · grading · planner ·          │
│                        language-support. Exhaustively unit-tested.                               │
│  src/lib/content/**    Zod schemas + in-memory repository for course content.                    │
│  src/lib/ai/**         Provider interfaces + adapters (LLM, STT, TTS, pronunciation) + mocks.    │
│                                                                                                  │
│  content/**            Course data (TypeScript data modules validated by Zod). Not UI.           │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
          │ Prisma 7 (driver adapter: pg)                    │ HTTPS (server-side only)
     PostgreSQL (Neon in production;                 Anthropic · Azure Speech · (others later)
     project-local cluster in development)
```

Dependency direction: `app → server → lib`, `components → lib`. `lib/learning` depends only on
`lib/content` types. Nothing in `lib` imports from `server` or `app`.

## Key decisions

Continuous skill estimation lives in `lib/learning/skill-estimation`, reusing placement likelihoods.
The server service persists bounded evidence metadata and stable display bands. Practice updates
memory, attempts and skill estimates atomically under a learner row lock; placement retakes preserve
the ledger and establish a new calibration. Dashboard readers distinguish objective, perception,
AI and unmeasured estimates. See `SKILL-ESTIMATION.md` for gates and limitations.

### ADR-001 — Content is versioned data in the repository

**Decision.** Course content (levels, modules, units, lessons, activities, concepts, vocabulary,
grammar, pronunciation targets, placement items, authentic-content metadata) lives in `content/`
as TypeScript data modules validated by Zod schemas (`src/lib/content/schema.ts`). The database
stores only **learner state**, referencing content by stable string IDs (`lex:bonjour`,
`a0-u1-l2`, …).

**Why.** Content must be validated, versionable, reviewable in diffs, reusable and testable from
day one. A CMS before the learning engine works would be premature. TypeScript data gives editor
type-checking while authoring; Zod gives runtime validation and cross-reference checks
(`npm run content:check`).

**Consequences.** Editing content requires a commit and deploy. The admin area starts as a
read-only explorer with lesson preview and validation report. Access goes through a
`ContentRepository` interface so a database-backed CMS can replace the source later without
touching engines. Content IDs are permanent: renaming an ID orphans learner state, so IDs are
never reused or renamed once shipped.

### ADR-002 — One memory trace per concept × dimension (FSRS)

**Decision.** Learner knowledge is stored as `MemoryTrace(userId, conceptId, dimension)` holding
the FSRS card state plus evidence counters. Dimensions: `recognition`, `recall`, `listening`,
`writing`, `speaking`, `pronunciation`. Mastery states (_unseen → introduced → learning →
familiar → strong → mastered_, and _decaying_) are **derived** from FSRS stability,
retrievability and evidence, not stored as an independent score.

**Why.** It unifies "what does the learner know" and "what should be reviewed" in one model,
avoids two sources of truth drifting apart, and supports _recognises it but cannot say it_.
FSRS (via `ts-fsrs`) is an evidence-based, open scheduler used by Anki.

### ADR-003 — Lightweight Bayesian adaptive placement

**Decision.** Placement uses a 1-parameter logistic model with a guessing floor for
multiple-choice items, a grid posterior per skill (prior from self-reported experience and the
calibration block), and nearest-difficulty item selection with exposure randomisation. Item
difficulties start as authored CEFR-band values.

**Why.** Adaptive, gives a confidence (posterior SD) for free, ~150 lines, fully deterministic and
testable. Full IRT calibration needs response data we do not have yet; the item metadata and
response log are stored so difficulties can be re-estimated later.

### ADR-004 — Providers behind interfaces, mocks are explicit

**Decision.** `LLMProvider`, `SpeechToTextProvider`, `TextToSpeechProvider`,
`PronunciationAssessmentProvider` interfaces in `src/lib/ai`. Adapters: Anthropic (LLM), Azure
Speech (STT, TTS, pronunciation). Mocks for development/tests. The browser's
`speechSynthesis` is the zero-cost TTS fallback. The UI shows a _simulado_ badge whenever a mock
produced a result, and assessments never count mock speech scores as evidence.

**Why.** Avoid vendor lock-in, keep secrets server-side, keep the app usable offline, and never
fake functionality.

### ADR-005 — Better Auth with Prisma

**Decision.** Authentication uses Better Auth (email + password to start; OAuth providers can be
added) with its Prisma adapter and database sessions.

**Why.** Modern, self-hosted, first-class email/password support with secure defaults, works with
Next.js 16 App Router, and keeps user data in our database (LGPD: we control retention/deletion).
Auth.js credentials support is intentionally limited and its maintainers now point to Better Auth.

### ADR-006 — Cache Components on

**Decision.** `cacheComponents` and `partialPrefetching` are enabled (Next.js 16 default, and the
only model in the next major). Pages render a static shell; anything that reads the session sits
behind `<Suspense>`. Static content (grammar library, lesson definitions) is cached with
`use cache`.

### ADR-007 — Local development database

**Decision.** `scripts/db-local.mjs` creates a project-local PostgreSQL cluster in `.data/` using
the machine's PostgreSQL binaries (port 54329, trust auth, localhost only). CI uses a Postgres
service container. Production targets Neon (or any managed PostgreSQL).

Railway staging uses the same PostgreSQL/Prisma architecture, with a Railpack Node web
service and a persistent PostgreSQL service. See [DEPLOYMENT.md](DEPLOYMENT.md) for the
manual release, environment validation, healthcheck and provider validation procedures.

## Request flow examples

**Completing an activity**
`ActivityPlayer (client)` → Server Action `submitActivity` → `services/practice.ts`:
validate input (Zod) → load activity from content repository → `grade()` (pure) →
`memory.applyOutcome()` (pure FSRS update per targeted concept × dimension) → persist attempt +
traces in one transaction → return feedback.

**Daily session**
Dashboard → `services/session.ts` → load profile, due traces, skill estimates, recent
history → `planner.planSession()` (pure) → persist `DailySession` plan → session runner renders
blocks.

Study pace is an optional enum on `LearnerProfile`; daily time remains `dailyMinutes`.
Legacy null values infer a pace from the existing time without resetting onboarding or history.
Version-1 plan JSON adds pace, daily new-concept reservations and learning segments; saved plans
stay frozen when preferences change. Learner locks serialize plan creation and block completion,
and planning reads use the same transaction client to avoid exhausting the pool under contention.

Long-session focus blocks use bounded generated production and prerequisite-safe authored tasks.
Their server submission records attempts, time and eligible skill evidence with
`scheduleMemory: false`; due review blocks retain FSRS scheduling. The server authorizes the
current persisted block rather than trusting a client flag. Weekly workload derives from existing
daily activity totals. The pure deadline comparison refuses insufficient evidence and emits no
individual ETA. See [INTENSIVE-LEARNING.md](INTENSIVE-LEARNING.md).

## Security baseline

- Every Server Action / Route Handler re-checks the session (`requireUser()`) and authorises by
  ownership; admin routes check `role === "admin"` server-side. The proxy only redirects; it is
  not the security boundary.
- All client input is validated with Zod on the server.
- Secrets only in server env (`src/lib/env.ts`); no provider SDK in client bundles.
- AI and speech endpoints have per-user daily quotas and a throttle (`src/server/quota.ts`).
- Audio is assessed in memory and discarded; only transcripts and scores are stored. If recording
  storage is added, files stay private (never in `public/`) and are served only through authorised
  handlers.
- LGPD rights in `/conta`: export of everything stored (`/api/conta/dados`, without password
  hashes or tokens), deletion of selected data (tutor conversations, saved corrections, speech
  assessments) and account deletion through Better Auth with a password re-check; every table
  cascades from `users`.

## Testing strategy

| Layer                                      | Tool                                                      | What                                                                               |
| ------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Engines (`lib/learning`, grading, content) | Vitest unit                                               | Placement, FSRS/mastery, planner, graders, schemas, content cross-references       |
| Services + repositories                    | Vitest integration (real PostgreSQL, `TEST_DATABASE_URL`) | Persistence, transactions, ownership                                               |
| Components                                 | Vitest + Testing Library                                  | Activity players, critical forms                                                   |
| Critical flows                             | Playwright                                                | signup → onboarding → placement → report → dashboard → session → review → progress |
