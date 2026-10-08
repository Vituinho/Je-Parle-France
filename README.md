# Je Parle Français

**French for real life.** · _Francês para a vida real._

A French-learning platform built specifically for Brazilian Portuguese speakers who want to live,
study and work in Canada/Québec or France — from A0 to C1.

> Status: early development. See [`docs/ROADMAP.md`](docs/ROADMAP.md) for what is complete,
> mocked, experimental or planned.

## What is in it

- **Adaptive placement** (quick or complete) with a per-skill report — an internal estimate, not an
  official certification.
- **Daily sessions** planned for 5, 15, 30 or 60 minutes: spaced review (FSRS), new lessons,
  listening, pronunciation and speaking, sized to the time and the review backlog.
- **A0 core path** plus the destination tracks **Vivre au Canada** (Québec usage, fr-CA voices)
  and **Vivre en France**, on a browsable course map.
- **AI tutor** for roleplays and free conversation, with four correction modes and a report;
  important mistakes go back into review.
- **Pronunciation lab** for the sounds that trouble Brazilians, perception first.
- **Meu caderno** (personal vocabulary with mastery per skill) and a **grammar library**
  explained from Portuguese.
- **Francês de verdade**: curated links to authentic radio, video, podcasts and texts at the
  learner's level, with a daily suggestion.
- **Privacy controls**: data export, selective deletion and account deletion (LGPD).

## Documentation

| Topic                         | Document                                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product, audience, principles | [PRODUCT](docs/PRODUCT.md)                                                                                                                            |
| How it teaches                | [PEDAGOGY](docs/PEDAGOGY.md) · [CURRICULUM](docs/CURRICULUM.md) · [CONTENT-GUIDELINES](docs/CONTENT-GUIDELINES.md)                                    |
| Learning engines              | [PLACEMENT](docs/PLACEMENT.md) · [MASTERY](docs/MASTERY.md) · [SPACED-REPETITION](docs/SPACED-REPETITION.md) · [PRONUNCIATION](docs/PRONUNCIATION.md) |
| AI and speech                 | [AI](docs/AI.md)                                                                                                                                      |
| Engineering                   | [ARCHITECTURE](docs/ARCHITECTURE.md) · [DATABASE](docs/DATABASE.md) · [DEPLOYMENT](docs/DEPLOYMENT.md)                                                |
| Status                        | [ROADMAP](docs/ROADMAP.md)                                                                                                                            |

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
PostgreSQL + Prisma 7 · Vitest · Playwright.

## Getting started

Requirements: Node.js ≥ 22.12 and a local PostgreSQL installation (only the binaries are used).

```bash
npm install
cp .env.example .env          # then set BETTER_AUTH_SECRET
npm run db:local -- init      # project-local Postgres on localhost:54329
npm run db:migrate            # apply migrations
npm run dev
```

If PostgreSQL binaries are not on your `PATH`, set `PG_BIN` (e.g. `C:\Program Files\PostgreSQL\18\bin`).
You can also point `DATABASE_URL` to any PostgreSQL 15+ database (e.g. Neon).

## Scripts

| Script                               | Purpose                                                          |
| ------------------------------------ | ---------------------------------------------------------------- |
| `npm run dev`                        | Development server                                               |
| `npm run lint` / `npm run typecheck` | Static checks                                                    |
| `npm test`                           | Unit + integration tests (integration needs `TEST_DATABASE_URL`) |
| `npm run test:e2e`                   | Playwright end-to-end tests                                      |
| `npm run content:check`              | Validate course content                                          |
| `npm run verify`                     | Everything CI runs                                               |

## License

MIT
