# Je Parle Français

**French for real life.** · *Francês para a vida real.*

A French-learning platform built specifically for Brazilian Portuguese speakers who want to live,
study and work in Canada/Québec or France — from A0 to C1.

> Status: early development. See [`docs/ROADMAP.md`](docs/ROADMAP.md) for what is complete,
> mocked, experimental or planned.

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

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run lint` / `npm run typecheck` | Static checks |
| `npm test` | Unit + integration tests (integration needs `TEST_DATABASE_URL`) |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run content:check` | Validate course content |
| `npm run verify` | Everything CI runs |

## License

MIT
