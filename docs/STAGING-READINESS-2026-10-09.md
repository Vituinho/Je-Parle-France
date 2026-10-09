# Railway staging readiness — 2026-10-09

The repository is ready for the documented **manual staging setup**. Local production build,
startup, database migrations, auth, learning/privacy flows and relevant browser tests passed.
No Railway service was created, no Git push/deployment was performed, and no paid provider call
was made. Railway/Linux infrastructure behaviour and live Azure/Anthropic quality remain
operator validation steps. B1.2 was not started.

This continues the completed [adaptive-loop audit](ADAPTIVE-LOOP-2026-10-09.md), preserving its
history. Its four-task listening limitation is resolved by the B1.1 change below.

## Implementation matrix

| Area                  | Implemented/verified                                                                                                                                                                                      | Remaining validation                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Next.js 16.4 runtime  | Full Next server retained; Node 24 target; PORT/default host confirmed; prestart validates before opening the port; existing error boundaries retained                                                    | Actual Railpack Linux build, networking and deployment replacement/draining               |
| Health                | Public request-time `/api/health`, HTTP 200 `{status: "ok"}`, no-store, no database/provider calls; unsupported POST returns 405                                                                          | Configure Railway path/port; this is app liveness, not DB readiness or ongoing monitoring |
| PostgreSQL/Prisma 7   | Five migrations applied to a fresh disposable PostgreSQL 18 DB; second deploy idempotent; 44 indexes; lazy pool capped at 10 with 5-second connection deadline                                            | Railway persistent volume, backups, real private connection and recovery drill            |
| Environment/auth      | Required production origin/secret checks, PostgreSQL URL and Azure region validation; explicit trusted origin/CSRF; secure host-only HTTPS cookies; logout/login persistence; safe local client redirects | Real Railway HTTPS domain and operator smoke                                              |
| Azure                 | fr-FR/fr-CA STT/word assessment adapters; 30-second WAV cap; both fixture files preflight before four paid calls; timeout/error/rate-limit diagnostics                                                    | Live validation not run: credentials absent                                               |
| Anthropic             | Structured SDK/local validation, bounded educational context, real SDK timeout-abort test, redacted failure categories; one-call manual smoke                                                             | Live validation not run: credentials absent; educational quality uncalibrated             |
| Human calibration     | Versioned strict local JSON, actual A2 rubric template, anonymous speech/writing comparisons, schema/privacy checks, overwrite refusal                                                                    | Three initial records are pending; no human assessments or threshold changes              |
| B1 listening          | Six distinct published B1.1 tasks; two opinion dialogues added; promotion test uses published content only, keeping the gate unchanged                                                                    | Human/content/audio review during staging; no B1.2 content added                          |
| Learner/admin/privacy | Existing objective practice/review, skill evolution, planner, persistence, export/deletion and admin boundaries revalidated                                                                               | Provider-dependent features still use labelled mocks locally                              |

## Important problems found and fixed

- Production auth URL was optional and the example secret could pass length checks. Production
  now requires a configured origin, rejects placeholders, non-PostgreSQL URLs and endpoint-like
  Azure region values. HTTPS is required except documented loopback production tests.
- An instrumentation exception was logged by Next without terminating the process. `npm start`
  now runs a checked prestart first. A bad public HTTP auth origin returned process exit `1`
  before opening the requested port; the normal start path then served the app successfully.
- Better Auth defaults to skipping origin checks in its test environment. Explicit false
  disable-flags make tests enforce CSRF/origin protection, including foreign callbacks. This
  was a test fidelity gap, not evidence that production defaults disabled CSRF.
- The login `next` guard accepted a backslash path that URL parsers normalize into an external
  origin. The pure guard rejects external/protocol-relative URLs, backslashes and controls.
  Browser persistence tests exercised the malicious value without allowing any external request.
- PostgreSQL connections had the driver's unlimited default acquisition wait. The existing
  singleton now has an explicit bounded connection wait and pool size.
- Speech HTTP 429 was indistinguishable from other unavailable-provider failures; safe
  diagnostics now distinguish rate limit, timeout, malformed output and unsupported capability.
  Speech/Writing provider output failures log only allowlisted metadata.
- The WAV guard admitted up to 37 seconds although this scripted assessment path needs the
  shorter 30-second limit. The guard and smoke now agree with the selected API; browser recording
  still caps at 15 seconds. Invalid second fixtures are rejected before partial paid work.
- Four course listening tasks could not meet the six-distinct-task B1 gate. The two added
  tasks have different contexts, viewpoints and inference questions, within the existing opinion
  lessons. The integration test no longer borrows placement-bank fixtures to reach six tasks.

## Services, variables and migration procedure

Required Railway services: **one Node web service + one PostgreSQL service with persistent data
volume**. Azure Speech and Anthropic are optional external resources. No application volume,
Redis, private object storage or email service is required to run this staging slice; email
verification/recovery remain incomplete.

Required app configuration: `DATABASE_URL`, random `BETTER_AUTH_SECRET` (32+ characters), exact
HTTPS `BETTER_AUTH_URL`, production `NODE_ENV` and injected `PORT`. Optional provider configuration:
`LLM_PROVIDER`, `ANTHROPIC_API_KEY`, `LLM_MODEL`, `SPEECH_PROVIDER`, `AZURE_SPEECH_KEY`,
`AZURE_SPEECH_REGION`; configurable quotas: `TUTOR_DAILY_TURNS`, `TUTOR_DAILY_REPORTS`,
`WRITING_DAILY_ASSESSMENTS`. The full values/defaults and builder-only settings are in
[DEPLOYMENT.md](DEPLOYMENT.md). No public credential, storage variable or extra URL was invented.

Use `npm run db:deploy` in Railway's pre-deploy phase. It is `prisma migrate deploy`, never
migrate dev/reset. No seed is needed: curriculum/placement/activity/concept/authentic metadata
are versioned content, while the database stores learner-specific state. Five existing migrations
were retained; no new migration or destructive reseed was added. The fresh audit DB had zero
users and was removed after verification. Existing local development state was preserved.

## Provider live-validation status and calibration

Presence-only local checks found neither provider's credentials. Both CLI smokes were separately
tested with deliberately missing credentials and safely refused execution (exit `1`). These
are expected preflight failures, not live successes. HTTP simulation covers authentication
errors, malformed output, deadlines and rate limiting without CI API cost.

- Azure manual command: `npm run smoke:speech -- <fr-FR.wav> <fr-CA.wav> [authored reference]`.
  Four paid calls check STT and scripted assessment in both locales. French prosody, named
  phonemes, syllable groups and spoken-phoneme alternatives are not claimed by this path.
- Anthropic manual command: `npm run smoke:tutor`. One synthetic A2 Quebec call verifies
  authentication/structured output with an 800-token output budget. Model support/access and
  educational usefulness must be checked with the actual resource.
- Calibration: `npm run calibration -- init`, then
  `npm run calibration -- check .data/calibration/records.json`. Local templates contain no invented scores, produce zero
  comparisons initially and never overwrite an existing file. Human bands/notes remain local;
  the comparison summary omits targets, feedback and reviewer identity.

See [PROVIDER-VALIDATION.md](PROVIDER-VALIDATION.md) and [CALIBRATION.md](CALIBRATION.md) for exact
fixture rules, output, cost boundaries, rubric anchors and human-review steps. API schema success
is not proof of grading validity. Production promotion gates and grading thresholds were not tuned.

## B1 listening blocker status

Resolved within B1.1. `b1-u5-l1-a6` is a Quebec course-choice dialogue: distinguish a speaker's
position, understand experience supporting it and identify the final decision. `b1-u5-l2-a5`
is a France workplace debate: understand a counterargument, negotiated compromise and why it
addresses the concern. Each has three comprehension/inference questions, different speakers and
an original script. Lesson estimates increased from seven to nine minutes; units, lessons and
concept inventory stayed unchanged.

The promotion gate still requires varied strong evidence across six tasks and multiple days.
The real-service integration test passes using all six published course tasks over time. Existing
completed learners can replay the opinion lessons (completed lessons restart at step zero).
This removes a structural blocker, not a guarantee of immediate B1 or empirical CEFR validation.

## Tests and build results

| Check                                            | Result                                                                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                   | PASS                                                                                                                       |
| `npm run typecheck`                              | PASS                                                                                                                       |
| `npm run content:check`                          | PASS: 267 concepts, 12 modules, 35 units, 94 lessons, 659 activities, 125 placement items, 17 scenarios; 0 errors/warnings |
| `npm test -- --maxWorkers=2 --testTimeout=30000` | PASS: 315 unit/integration tests in 55 files, PostgreSQL integration enabled; final run 162.17 s                           |
| Fresh production migrations + repeated deploy    | PASS: 5 applied, second invocation no pending changes, 44 indexes, 0 seeded users; disposable DB removed                   |
| Invalid-startup guard                            | PASS: unsafe production auth origin blocks `npm start` before opening PORT                                                 |
| Missing-credential smokes                        | PASS as negative checks: both refuse with exit 1 and zero live calls                                                       |
| Calibration CLI                                  | PASS: three pending templates, zero comparisons; duplicate init rejected, existing file hash unchanged                     |
| E2E discovery                                    | PASS: 48 tests in 17 files                                                                                                 |
| Final relevant production E2E                    | PASS: 16 desktop/mobile cases in 5.0 min plus 1 desktop case playing both modified B1.1 opinion lessons in 14.7 s          |
| `npm run build`                                  | PASS: Next 16.4.0/Turbopack compiled, TypeScript checked, 34/34 prerender generation steps; `/api/health` remains dynamic  |
| `npm start` with injected PORT                   | PASS: prestart, binding, health, assets, auth/private API routes and browser flows verified on localhost:3200              |

The selected E2E exercised account export/deletion on disposable local users, learner denial and
verified admin access, placement-to-session/mastery/review, logout/login persistence, malicious
login target blocking, mock tutor/report and pronunciation perception. The other 31 discovered
E2E cases were not rerun in this task. Simulated reverse-proxy headers preserved a relative login
redirect; this does not replace an actual Railway HTTPS smoke. All final checks passed; the
temporary server was stopped after testing. Raw local logs are Git-ignored in `.data/verification`.

## Commits created

| Commit    | Logical change                                        |
| --------- | ----------------------------------------------------- |
| `d07b935` | Harden staging environment and production startup     |
| `4b9f622` | Add lightweight application health check              |
| `59eefd7` | Prepare safe live provider validation and diagnostics |
| `70c7309` | Add internal human calibration kit                    |
| `fa45a84` | Unblock B1 listening evidence within opinion lessons  |
| `9cc88d2` | Keep post-login redirects within the application      |

This report and the Railway guide are delivered in the subsequent documentation commit
`docs: document railway staging readiness and manual deployment`. Existing history was not
squashed. The final working-tree check follows that commit; no push is included.

## Exact next manual actions in Railway

1. Push the reviewed commit/branch yourself and create an isolated Railway `staging` project/environment.
2. Add PostgreSQL, confirm its persistent volume, readiness, region and backups.
3. Connect this GitHub repository at its root as the Node web service.
4. Reference the staging Postgres `DATABASE_URL` on the web service.
5. Choose Railpack; pin Node 24 and retain dev dependencies with `RAILPACK_PRUNE_DEPS=false`.
6. Set build `npm run build`, start `npm start`, pre-deploy `npm run db:deploy`.
7. Set a fresh auth secret, provider selectors initially `mock` and conservative tutor/writing quotas.
8. Generate the public domain, then set the exact HTTPS `BETTER_AUTH_URL` before a successful startup.
9. Set health path `/api/health`, timeout 300 seconds, matching injected port and one web replica.
10. Review/deploy the staged configuration manually; run no seed.
11. Confirm HTTP 200 health, assets, HTTPS auth cookies, signup/login and safe redirects.
12. Run onboarding → objective placement → recommendation → daily session → activity → mastery → logout/login → persistence.
13. Check unconfigured/configured speech and tutor, admin authorization, export, and manual deletion of only the disposable account.
14. Explicitly run the bounded live Azure/Anthropic smokes after adding your own credentials; record redacted outcomes.
15. Start the human calibration pilot and record disagreements without changing thresholds.

[DEPLOYMENT.md](DEPLOYMENT.md) contains the full setup and migration rollback/recovery procedure.
If the UI requires an initial attempt before domain creation, let required-env validation fail
safely and redeploy after setting the domain; do not relax production validation.

## Remaining limits and next highest-value task

Local selectors remained mock; no live API availability, French assessment capability or writing
quality was empirically validated. The calibration kit has no human dataset. Auth rate limiting,
throttling and TTS cache are per instance; daily quotas/sessions are durable. App health does not
probe PostgreSQL. Email verification/recovery and multi-instance shared throttling/cache are
unfinished. Existing tutor/authentic evidence wiring and other limitations in the adaptive-loop
report were preserved rather than expanded. B1.1 remains the only published B1 core module.

The next highest-value task is the **manual Railway staging deployment, live provider checks
and a consented human calibration pilot**. Validate actual HTTPS sessions, Postgres persistence
across redeploy and real fr-FR/fr-CA/model results before further curriculum expansion.
