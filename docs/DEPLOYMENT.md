# Railway staging deployment

This repository is prepared for manual staging deployment and the controlled pilot in
[PILOT.md](PILOT.md). Read-only inspection on 2026-10-10 found the user's **Je parle France**
Railway project with only a `production` environment, mock providers and no live provider
credentials; no isolated staging was present. No external deployment was created or changed by
the agent. Use an isolated staging database and synthetic test accounts. Live provider quality,
cloud migrations, backup/restore and scheduled maintenance require operator checks.

## Required services and runtime

Use one Railpack Node.js web service and one PostgreSQL service (15+; migrations tested on 18).
Optional external services are Azure Speech and Anthropic. No Redis, application volume, object
storage or curriculum seed is required. Learner state and sessions are in PostgreSQL; recordings
are processed in memory and discarded. Only transcripts/scores are retained. Next's disposable
build/cache files are not learner storage.

Keep the working full-server setup: `npm run build`, then `npm start`. The latter runs
`prestart` → `env:check` before `next start`. Do not replace it with a direct `next start`
command, which bypasses the fail-fast CLI check. The instrumentation hook also validates runtime
configuration, but Next can retain a process after an instrumentation error. No Docker or
standalone packaging is necessary for this setup; Railpack retains the app, dependencies,
`public/`, `.next/static`, Prisma schema/migrations and generated client.
[Railpack Node build/start behaviour](https://railpack.com/languages/node/).

Next reads injected `PORT` and binds to `0.0.0.0` by default. Do not put `PORT` in an env file.
Error and global error boundaries already provide recovery UI. Normal Next signal handling is
preserved; container replacement/draining must still be checked in Railway, not inferred from
the Windows local test.

## Variables

Set these on the **web service**, using reference variables for database credentials. The
checked-in `.env.example` is a local template, not a production secret file.

| Variable                                                                   | Staging requirement                                                                                |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                             | Required PostgreSQL URL; reference the staging Postgres service                                    |
| `BETTER_AUTH_SECRET`                                                       | Required random secret, at least 32 characters; example placeholders are rejected                  |
| `BETTER_AUTH_URL`                                                          | Required exact HTTPS public origin, with no path, query or credentials                             |
| `NODE_ENV`                                                                 | `production`; Railpack supplies this                                                               |
| `PORT`                                                                     | Railway supplies it; the public domain target must match                                           |
| `LLM_PROVIDER`                                                             | Start with `mock`; use `anthropic` after manual live validation                                    |
| `ANTHROPIC_API_KEY`                                                        | Required only when Anthropic is selected                                                           |
| `LLM_MODEL`                                                                | Adapter default `claude-opus-5-5`; explicitly choose an accessible compatible model for live smoke |
| `TUTOR_DAILY_TURNS`                                                        | Positive integer; default 80, lower for staging cost control                                       |
| `TUTOR_DAILY_REPORTS`                                                      | Positive integer; default 10                                                                       |
| `WRITING_DAILY_ASSESSMENTS`                                                | Positive integer; default 10                                                                       |
| `SPEECH_PROVIDER`                                                          | Start with `mock`; use `azure` after manual live validation                                        |
| `AZURE_SPEECH_KEY`                                                         | Required only when Azure is selected                                                               |
| `AZURE_SPEECH_REGION`                                                      | Required with Azure; canonical region name, not an endpoint URL                                    |
| `PILOT_ENABLED`                                                            | Default `false`; enable only after live staging checks; withdrawal always works                    |
| `TUTOR_ENABLED`, `WRITING_AI_ENABLED`                                      | Independent `true`/`false` flags, default `true`                                                   |
| `SPEECH_STT_ENABLED`, `SPEECH_PRONUNCIATION_ENABLED`, `SPEECH_TTS_ENABLED` | Independent flags, default `true`; browser audio fallback remains                                  |
| `TUTOR_DAILY_CONVERSATIONS`                                                | Positive integer, default 12 new conversations per learner/day                                     |
| `SPEECH_DAILY_REQUESTS`                                                    | Positive integer, default 300 shared STT/assessment requests per learner/UTC day                   |
| `SPEECH_DAILY_MINUTES`                                                     | Positive integer 1–1,440, default 20 shared submitted audio minutes per learner/UTC day            |
| `TTS_DAILY_REQUESTS`                                                       | Positive integer, default 1,000 uncached TTS requests per learner/UTC day                          |

Optional providers default to labelled mocks/browser audio/self-assessment. Explicit real-provider
selection with missing credentials fails, rather than silently becoming a mock. There is no
separate public URL, extra trusted-origin variable, storage credential or Azure endpoint variable.
Auth uses the configured public origin and the client uses the same origin.

Builder settings: set `RAILPACK_NODE_VERSION=24` to pin the verified major (the broad
`engines.node` range otherwise takes priority over `.nvmrc`), and
`RAILPACK_PRUNE_DEPS=false`. Retain dev dependencies: Prisma CLI is needed by the pre-deploy
migration, and tsx by prestart. Do not use a production-only install or prune without replacing
these release tools. These are Railpack settings, not application feature flags.

Do not configure `TEST_DATABASE_URL` on the app service. Integration tests truncate their
dedicated test database. `E2E_BASE_URL` belongs to local test tooling, not app configuration;
the broad E2E suite is unsuitable for a real production database.

## Exact manual setup

1. Choose the reviewed repository commit/branch. Before pushing, check the existing production
   auto-deploy and pause it while preparing isolated staging; this code expects the eight-migration
   schema even when pilot collection is off. Configure the target pre-deploy command before
   releasing the new code. Push yourself after that setup; no push was performed here.
2. Use the existing **Je parle France** project (`f2455502-26f9-4fbb-925a-bd404bc21d1a`) and create
   a separate environment named `staging`. Keep database, credentials, variables and provider
   resources separate from production. The locally linked CLI was an unrelated project; use
   explicit project/environment/service identifiers as shown in PILOT.md.
3. Add a PostgreSQL service. Confirm its persistent data volume is attached. Choose an appropriate region, configure
   backup/retention before meaningful data is entered, and verify the service is ready.
4. Add/connect this GitHub repository as a web service in the same staging environment. Use
   the repository root. Turn off automatic deploys while configuring it if needed; an initial
   attempt without required variables is expected to fail safely.
5. On the web service, add a reference `DATABASE_URL=${{Postgres.DATABASE_URL}}`, replacing
   `Postgres` with the actual database service name. Keep the supplied private connection
   reference; do not copy the local `localhost:54329` URL or expose database credentials.
   [Railway PostgreSQL connections](https://docs.railway.com/databases/postgresql).
6. Choose Railpack; set build command `npm run build`, start command `npm start`,
   `RAILPACK_NODE_VERSION=24` and `RAILPACK_PRUNE_DEPS=false`. Let the npm install/postinstall
   generate the Prisma client; keep `package-lock.json` and Prisma files in the build context.
7. Set required auth variables and conservative quotas. Generate a new secret locally, for
   example `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`,
   and paste it only into Railway's secret variable. Never commit it.
8. In Settings → Networking → Public Networking, generate the Railway domain (or configure
   your verified custom domain). Set `BETTER_AUTH_URL` to that exact HTTPS origin **before
   the first successful startup**. If Railway's UI requires an initial build/deploy attempt
   before domain setup, let the missing-URL prestart fail, generate the domain, then redeploy.
   Do not temporarily relax validation or trust all Railway domains.
   [Railway public networking](https://docs.railway.com/networking/public-networking).
9. In Settings → Deploy, set **Pre-deploy Command** to `npm run db:deploy`. This runs
   `prisma migrate deploy` after build and before traffic, with access to private Postgres.
   A failed migration must stop the deployment.
   [Railway pre-deploy command](https://docs.railway.com/deployments/pre-deploy-command).
10. Set Healthcheck Path to `/api/health`, timeout 300 seconds, one web replica and an
    on-failure restart policy. Match the public domain target port to injected `PORT`.
    The endpoint is public, request-time, uncached, returns exactly `{"status":"ok"}` and
    calls neither the database nor providers. It accepts Railway's healthcheck hostname.
    Railway uses this to gate deployment, not as ongoing monitoring.
    [Railway healthchecks](https://docs.railway.com/deployments/healthchecks).
11. Run **no seed**. Curriculum, concepts, activities, placement and authentic metadata are
    versioned content compiled into the app. The eight migrations create and extend learner state;
    first sign-up/onboarding creates that learner's rows. Never use migrate dev/reset or
    destructive reseeding in staging/production.
12. Review staged Railway changes and deploy manually. Inspect install/build, pre-deploy and
    startup logs. Verify `GET https://<your-domain>/api/health` returns HTTP 200 JSON, signup
    CSS/JS loads, and `/hoje` redirects to login on the same HTTPS origin.
13. Execute the learner/auth/privacy checklist below using dedicated test accounts. Keep a
    redacted record of commit, domain, date and outcomes. A green app healthcheck alone does
    not establish database readiness.
14. Optionally validate live Azure/Anthropic explicitly using
    [PROVIDER-VALIDATION.md](PROVIDER-VALIDATION.md), then set their selectors/credentials,
    review quotas, redeploy and repeat the relevant UI checks. Nothing automatically calls
    paid APIs from CI.
15. Begin the internal human comparisons in [CALIBRATION.md](CALIBRATION.md). Record remaining
    disagreements; do not tune production thresholds from the first small batch.

Railway's legacy config-as-code files are deprecated in the documentation checked 2026-10-09;
this guide uses dashboard settings and adds no legacy `railway.json`.
[Railway configuration status](https://docs.railway.com/config-as-code/reference).

## Auth, persistence and operating limits

One configured origin is trusted. HTTPS uses Secure, HttpOnly, SameSite=Lax, host-only session
cookies. CSRF and callback/origin checking are explicitly enabled. Client post-login redirects
allow only local paths, rejecting protocol-relative URLs, backslashes and control characters.
Do not derive the origin from arbitrary proxy headers. A domain change requires updating the
auth URL and redeploying; cookies remain host-specific, so sign in again on the new domain.
[Better Auth origin/cookie configuration](https://better-auth.com/docs/reference/options).

Sessions persist in PostgreSQL for 30 days, with daily refresh. Keep the secret stable across
redeploys; rotation invalidates sessions. Email verification and password recovery are still
unimplemented pending an email provider. Admin roles require operator identity verification and
a trusted database update, never an unverified signup email.

Use one staging web replica. Better Auth's 30 requests/minute/IP limiter, request throttles and
TTS cache are in memory, so reset with a restart and are per instance. Learner daily AI quotas
are durable in `usage_counters`. Speech STT/assessment share configurable requests and submitted
audio limits; uncached TTS requests and tutor starts are configurable too. Numeric request quotas
are bounded at 100,000. Tutor quotas use the existing learner-local day; speech/writing/TTS use
UTC. STT and assessment separately consume audio units for their invocations. Do not interpret
quotas as monetary billing caps; manual provider smoke bypasses app quotas. `PILOT_ENABLED=false`
pauses pilot collection, not paid providers; use the independent provider flags to pause those.

The Prisma/pg pool is a lazy singleton, max 10 connections, 5-second connection deadline and
30-second idle timeout. Allow overlap of old/new deployments in the database connection budget.
More replicas require shared throttling/cache planning and a coordinated connection budget;
no extra infrastructure is needed for the current single-instance staging scope.

## Manual post-deploy checklist

Use synthetic answers and a disposable account you control; do not run destructive automated
tests against production.

- Signup → onboarding → objective placement → recommendation → daily session → activity →
  mastery update. Compare Hoje/Progresso/Caderno and relevant account-export evidence.
- Logout → login → revisit the lesson/session and confirm answers, profile and skill state
  persist. Refresh and, after a controlled redeploy, sign in again and verify the same data.
- Inspect the HTTPS session cookie's Secure/HttpOnly/SameSite flags. Check that auth redirects
  and callbacks remain on the configured origin; a foreign callback/origin must be rejected.
- With speech unconfigured, confirm browser audio and self-rated production are labelled,
  with no fabricated provider scores. With Azure, test STT and pronunciation separately in
  fr-FR/fr-CA, confirm unsupported prosody is absent, and inspect failure/timeout messages.
- With tutor unconfigured, confirm the mock label and exclusion from proficiency evidence.
  With Anthropic, check a synthetic turn, bounded corrections, report and rubric-based writing;
  do not equate successful schema parsing with pedagogical accuracy.
- With an ordinary learner, confirm `/admin` exposes no inventory. With a separately verified
  operator account provisioned through trusted DB access, confirm authorized admin access.
- Export the disposable account from `/conta` and inspect persistence without auth tokens or
  password hashes. Finally delete **only that disposable account**, then verify login fails.
  Do not automate production account deletion.
- Review redacted provider failure categories, build/start logs and database readiness.
  Attach no private audio, conversations or exports to public tickets.

## Migration recovery and rollback

Current migration history is eight committed migrations. Intensive learning adds
`20261009120000_study_pace`, an additive enum and nullable profile column that preserves existing
users. Apply it through the existing pre-deploy command; no seed is needed. The preceding staging
readiness work tested fresh-database migration and a second idempotent deploy; the intensive
migration has also been applied to the local development and integration databases. A real
Railway rollout of this new migration still requires the manual deployment procedure above.

Learning telemetry adds `20261009170000_learning_telemetry`: nullable review/attempt metadata,
active daily seconds and event session/dedupe indexes, applied locally to development/integration
databases without a development reset. Deploy it through the existing pre-deploy command; it needs
no seed or additional service. The protected pilot is `/admin/piloto`. Provider invocations now record
metadata/units, without billing secrets, extra requests or monetary estimates.

Controlled pilot adds `20261010120000_controlled_pilot`: consented participation, separate subjective
feedback, human calibration snapshots and nullable speech locale. It is additive; no seed, reset,
historical locale inference or backfilled consent is required.

Review operational-detail retention with `npm run telemetry:prune` (dry run), then use
`-- --apply --max-batches 20` only for the reviewed deployment/database. It expires validated
operational detail and feedback/calibration older than 90 days from creation, preserving normalized
learning state, consent and unknown legacy payloads. Bounded chronological batches walk past
invalid rows; inspect `more=true`. Schedule the optional daily Railway cron exactly as described
in [PILOT.md](PILOT.md#10-retention-and-railway-cron): same repo, staging DB, build `npm run db:generate`,
start `npm run telemetry:prune -- --apply --max-batches 20`, schedule `0 6 * * *` UTC. The CLI closes
its database pool and exits. Do not run destructive tests or use
E2E role-promotion fixtures against staging/production. See [LEARNING-TELEMETRY.md](LEARNING-TELEMETRY.md)
for the pilot workflow, minimum evidence, privacy and limits.

Indices cover sessions, per-learner history, due reviews, evidence chronology and unique keys.

Before any future database change, take/verify a recoverable backup and assess old/new app schema
compatibility. A web rollback does **not** roll back the database. Prefer additive changes and
expand/contract across releases. If pre-deploy fails, keep the prior working deployment and
inspect `prisma migrate status` plus `_prisma_migrations` in the staging private environment.
Fix forward after review. Use `prisma migrate resolve` only after an operator has reconciled
the actual schema with the intended migration; never mark a partly applied migration successful
just to unblock startup. Do not delete migration history or run migrate reset/dev.

If a data-damaging migration has already run, stop writes and restore to a separate database from
the verified backup/PITR point, validate it, then change the database reference and deploy a
schema-compatible app version. Preserve the failed database for diagnosis. Review domains,
auth URL/secret and provider variables when rolling back app configuration. Repeat the manual
health, signup, persistence and provider checks after recovery.

Configure volume backups before meaningful pilot data. Verify recovery into an isolated service/
database, checking migration history, auth/progress, consent/status and calibration/feedback counts.
If using Railway PITR, enable it before the incident and verify the adjacent restored service;
preserve the original while reviewing the recovery. Record the backup/time, recovery duration and
observed loss window. Local fresh migration checks do not prove cloud backup readiness.
Reconcile withdrawals and account deletions after the backup before reopening traffic to a
restored copy, which can otherwise recover old personal rows.
[Railway PostgreSQL backup and restore](https://docs.railway.com/guides/postgres-backups-restores).
