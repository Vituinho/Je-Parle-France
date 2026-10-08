# Deployment

The app is a standard Next.js 16 server application with a PostgreSQL database. The reference
setup is **Vercel + a managed PostgreSQL** (Neon, Supabase, RDS…), but any Node.js ≥ 22.12 host
works (`npm run build && npm start`).

## Checklist

1. **Database** — PostgreSQL 15+. For LGPD, prefer a region you can justify to learners (e.g.
   São Paulo or Canada) and enable automated backups with point-in-time recovery.
2. **Environment variables** (see `.env.example`):

   | Variable                                                     | Required | Notes                                                                                            |
   | ------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------ |
   | `DATABASE_URL`                                               | yes      | Pooled connection string when the provider offers one                                            |
   | `BETTER_AUTH_SECRET`                                         | yes      | ≥ 32 random characters; rotating it signs everyone out                                           |
   | `BETTER_AUTH_URL`                                            | yes      | The public origin, e.g. `https://jeparlefrancais.app` (requests from other origins are rejected) |
   | `LLM_PROVIDER`, `ANTHROPIC_API_KEY`, `LLM_MODEL`             | no       | Without them the tutor runs the labelled mock                                                    |
   | `TUTOR_DAILY_TURNS`, `TUTOR_DAILY_REPORTS`                   | no       | Per-learner daily quotas (cost control)                                                          |
   | `SPEECH_PROVIDER`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | no       | Without them: browser voices, self-rated pronunciation, no STT                                   |

   Secrets are read only on the server (`src/lib/env.ts`, validated on first use).

3. **Migrations** — run `npm run db:deploy` (`prisma migrate deploy`) against production
   **before** the new version receives traffic: as a release step in CI, or as the build command
   (`npm run db:deploy && npm run build`) when the host has no release phase. Migrations are
   additive by policy; destructive changes ship in two releases (stop using → drop).
4. **Build** — `npm run build`. `postinstall` generates the Prisma client.
5. **Smoke test** — sign up with a test account, finish onboarding, open today's session, then
   delete the account from `/conta`.

## Production behaviour to know

- **Rate limiting**: Better Auth's limiter is on in production (30 requests/min per IP on auth
  routes). The tutor and speech endpoints add per-learner daily quotas stored in the database
  (`usage_counters`), plus a short in-memory throttle.
- **In-memory state is per instance**: the TTS clip cache and the throttle live in memory, so on
  serverless they are best-effort. Quotas are in the database and hold across instances. A shared
  cache (object storage or Redis) is planned for TTS audio.
- **No local file storage**: nothing is written to the filesystem. Voice recordings are assessed
  in memory and discarded; only transcripts and scores are stored. If recording storage is added
  later, it must use private object storage with signed URLs — never the ephemeral filesystem or
  `public/`.
- **Logs** never contain conversation text, transcripts or recordings.
- **AI providers**: with `LLM_PROVIDER=anthropic`, tutor messages are sent to Anthropic; with
  `SPEECH_PROVIDER=azure`, audio is sent to Microsoft Azure. The privacy section of `/conta`
  states this automatically from the configuration; keep the public privacy policy in sync.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request: lint, typecheck, content check,
unit and integration tests (PostgreSQL service container) and a production build. Playwright E2E
tests run locally (`npm run test:e2e`, which starts the dev server) or against a deployment with
`E2E_BASE_URL=https://… npm run test:e2e`.

## Operations

| Task                        | How                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Make someone admin          | Verify the person's identity, then update that account's `users.role` to `admin` through trusted database access |
| Learner asks for their data | They can export it themselves in `/conta` (JSON)                                                                 |
| Learner asks for deletion   | Self-service in `/conta`; an operator can delete the `users` row — every table cascades                          |
| Rotate the auth secret      | Change `BETTER_AUTH_SECRET` and redeploy; all sessions end                                                       |
| Lower AI cost               | Set `LLM_MODEL` to a smaller model and/or lower the daily quotas                                                 |

`ADMIN_EMAILS` is no longer used. Email addresses supplied at sign-up are unverified and must
never grant administrative access. Existing admin accounts retain their roles; review any
accounts previously promoted automatically. Email verification and recovery still need an
email provider.
