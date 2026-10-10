# Real providers and controlled pilot

Implementation and operating guide — 10 October 2026. This continues the completed
[Learning Telemetry phase](LEARNING-TELEMETRY.md), without curriculum expansion or automatic
tuning. Target: **3–5 invited adult volunteers for approximately 14 days**. This is an internal
educational validation exercise, not public beta enrolment or proficiency certification.

**Repository status: READY FOR LIVE VALIDATION. Azure/Anthropic status: NOT LIVE VALIDATED.**
No paid API call, deployment, Railway variable change, enrolment of a real person or scheduled
cloud job was performed by the agent. Browser assessments used labelled synthetic local fixtures.

## 1. Architecture and implementation matrix

The architecture remains Next.js + PostgreSQL + existing provider adapters. The optional Railway
cron runs the existing maintenance CLI and exits; there is no resident worker, queue or new
analytics platform. Learning engines, FSRS, CEFR gates, rubric weights and planner heuristics
retain their existing behaviour.

| Area                 | Implementation                                                                                  | Boundary                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Cohort               | `PilotParticipant`, explicit admin invitation, invited/active/withdrawn/finished                | No automatic enrolment by email or signup; report reads at most 10 participants         |
| Consent              | `/piloto`, PT-BR notice, explicit checkbox, version + timestamp                                 | Optional; current version required before pilot feedback/calibration                    |
| Feedback             | Optional form after a session or on the participation page after actual activity                | One submission per UTC day; 500-character comment; difficulty separate from performance |
| Provider controls    | Independent tutor, writing, STT, pronunciation and TTS flags                                    | Provider outages preserve other learning flows; simulated results remain labelled       |
| Cost limits          | Durable per-user conversation/turn/report/writing/request/audio quotas                          | Units and calls, not a monetary spending cap; smoke CLI bypasses app quotas             |
| Azure validation     | Two locales, audio preflight, speech/silence/subsecond cases, per-operation JSON                | Live credentials absent; adapter capability contract is not live discovery              |
| Anthropic validation | Five synthetic scenarios, bounded context/output, schema and usage validation                   | Live credentials/model access absent; successful parsing does not establish quality     |
| Human calibration    | Select an actual consented assessment, save human bands/notes, compare kit schema               | One canonical review per assessment; saving again replaces it; no automatic tuning      |
| Two-week report      | Existing `/admin/piloto` extended with controlled participants and period observations          | Small samples and truncated reads are disclosed; no significance or causal claims       |
| Timeline             | Existing educational metadata plus difficulty and review dates                                  | No free text, transcription or private reviewer notes in timeline/aggregate             |
| Privacy              | Durable admin authorization, own identity from session, owner-filtered sources, export/deletion | Explicit selected admin view alone reads source writing and short comments              |
| Maintenance          | Dry-run/apply, bounded chronological batches, 90-day feedback/calibration expiry                | Normalized progress, consent/account integrity and unknown legacy payloads preserved    |
| Recovery             | Additive migration, no production seed, fresh local migration checks                            | Railway volume backup/PITR and restore drill remain operator tasks                      |

Migration `20261010120000_controlled_pilot` brings the history to **eight migrations**. It adds
three necessary small domain tables and nullable speech locale. The database is not seeded or
reset to deploy this phase. Existing development data was preserved.

## 2. Consent and enrolment

Verify the operator's identity and grant the existing database admin role through trusted
administrative access. A signup email never grants access. The learner completes normal
onboarding, visits `/piloto`, and privately supplies their own ID to the operator. In
`/admin/piloto`, use **Convidar para o piloto**; the account remains invited until that learner
accepts. Hoje shows an optional participation link; normal onboarding has no new mandatory step.

The notice version is `pilot-2026-10-10-v1`. It explains educational results, approximate active
time, skill estimates, provider units/errors, external Azure/Anthropic processing, temporary app
audio, human reading of selected writing, optional perception/comments and withdrawal. The
notice is concise product information and does not replace formal legal review or a review of
the external providers' current data policies. App audio disposal makes no claim about vendor
retention.

Acceptance requires the current notice and explicit checkbox. Repeated acceptance preserves
the original timestamp. Invitations require completed onboarding and a verified admin. Reads
and actions recheck the durable role; every source is checked against its learner and current
consent window. Finished participants can have existing samples reviewed within retention;
they cannot submit new feedback. Re-invitation and fresh acceptance establish a new window.

**Retirar aceite do piloto** always works, including when `PILOT_ENABLED=false`. It immediately
deletes that learner's pilot feedback and human calibration, stops new pilot collection and
preserves ordinary lessons/progress. The consent record retains the version, timestamps and
withdrawn state until account deletion. Ordinary product records follow the account policy;
withdrawing does not erase the learning history. Account export includes that learner's pilot
rows without authentication secrets or the reviewer's database identity. Account deletion
cascades pilot rows; deleting speech/conversation data removes the corresponding pilot details.

## 3. Feedback and perceived difficulty

After completing a session, active volunteers can open **Deixar feedback opcional do piloto**.
The participation page also offers weekly feedback after at least one post-consent practice,
placement answer, review, speech attempt or ended conversation. It does not ask on every page or
interrupt a lesson. Labels: **Muito fácil**, **Boa**, **Difícil demais**; comment optional, up to
500 characters, with a reminder not to include personal details. At most one new feedback per
UTC day and one per source. Backend source ownership/consent checks remain authoritative.

`PilotFeedback` is separate from objective attempts, FSRS and skill evidence. A hard rating at
88% accuracy can justify checking wording or cognitive load; it does not reduce mastery or
change the plan. Aggregates/timeline show counts, context, difficulty and dates. Comments are
available only after explicit participant selection in the protected admin view (14 recent
comments, rolling 90-day scope), and in the owner's export. There is no public feedback feed.

## 4. Provider readiness and exact manual validation

Local credential-presence checks and read-only Railway inspection found no Azure key/region or
Anthropic key. Missing-credential CLI executions returned failure JSON and exit 1 before
network access. Offline injected-response tests exercise authentication failure, deadlines,
rate limiting, malformed/schema-invalid output, provider errors, fallback and unit aggregation.
They are deterministic tests, not live service evidence.

Put secrets only in a private local environment or Railway's secret variables. Choose an
accessible compatible `LLM_MODEL` explicitly; the smoke CLI requires one even though the app
has a default. After checking the provider budget, execute these opt-in commands:

```sh
# One synthetic intermediate call, or select one scenario.
npm run smoke:tutor
npm run smoke:tutor -- --case writing
# Up to five paid calls: beginner, intermediate, correction, roleplay, writing.
npm run smoke:tutor -- --suite

# WAV PCM16, mono, 16 kHz, <=30 seconds; two generic matching reference recordings.
npm run smoke:speech -- .data/provider-fixtures/fr-FR.wav .data/provider-fixtures/fr-CA.wav
# Separate fixtures: silent audio and subsecond audio. Each invocation is up to four paid calls.
npm run smoke:speech -- .data/provider-fixtures/fr-FR-silence.wav .data/provider-fixtures/fr-CA-silence.wav --case silence
npm run smoke:speech -- .data/provider-fixtures/fr-FR-short.wav .data/provider-fixtures/fr-CA-short.wav --case short
```

The Anthropic CLI uses actual application prompts with synthetic educational context (at most
12,000 serialized context characters); tutor output budget 1,000 tokens, writing 2,200. It
validates structured results locally and prints schema status, latency and returned usage units,
without responses/prompts. The default case is intermediate B1. The suite stops on the first
failure. Azure preflights **both files before any paid call**, rejects malformed WAV locally,
then emits JSON per STT/assessment operation and locale, stopping on the first failure. Silence
expects no speech/not understood; subsecond success is labelled insufficient for quality
validation. Do not deliberately buy rate-limit/error calls: deterministic tests cover them.

French features expose accuracy/fluency/completeness/overall/word metrics; unsupported prosody
remains `null`. fr-FR and fr-CA remain distinguishable. Capability JSON is the adapter's contract,
not a dynamic service-discovery API. Do not infer unsupported metrics from a successful request.
[Microsoft language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=pronunciation-assessment),
[assessment guidance](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment),
[Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

Keep only redacted result JSON with commit, model, region and date. Generic volunteer audio
needs separate explicit permission and an agreed deletion date; keep it outside Git and delete
it afterwards. A live CLI pass proves that bounded provider request, not staging deployment,
pedagogical calibration, every locale/metric or a 14-day reliability guarantee. Then test the
actual deployed app with each provider and both speech locales. See
[PROVIDER-VALIDATION.md](PROVIDER-VALIDATION.md).

## 5. Flags and configurable quotas

| Variable                       | Default | Effect                                                                   |
| ------------------------------ | ------- | ------------------------------------------------------------------------ |
| `PILOT_ENABLED`                | `false` | Pilot invites/acceptance/feedback/review writes and controlled-report UI |
| `TUTOR_ENABLED`                | `true`  | New tutor conversations and turns; ending remains possible with fallback |
| `WRITING_AI_ENABLED`           | `true`  | Writing AI; paused/unavailable keeps the original unassessed             |
| `SPEECH_STT_ENABLED`           | `true`  | Transcription                                                            |
| `SPEECH_PRONUNCIATION_ENABLED` | `true`  | Pronunciation assessment                                                 |
| `SPEECH_TTS_ENABLED`           | `true`  | Provider TTS; browser audio remains available                            |
| `TUTOR_DAILY_CONVERSATIONS`    | `12`    | New conversations per learner/day                                        |
| `TUTOR_DAILY_TURNS`            | `80`    | Tutor turns per learner/day                                              |
| `TUTOR_DAILY_REPORTS`          | `10`    | Tutor reports per learner/day                                            |
| `WRITING_DAILY_ASSESSMENTS`    | `10`    | Writing evaluations per learner/UTC day                                  |
| `SPEECH_DAILY_REQUESTS`        | `300`   | Shared STT + pronunciation requests per learner/UTC day                  |
| `SPEECH_DAILY_MINUTES`         | `20`    | Shared submitted audio per learner/UTC day                               |
| `TTS_DAILY_REQUESTS`           | `1000`  | Uncached provider TTS requests per learner/UTC day                       |

Flags accept literal `true`/`false`; numeric request limits are positive safe integers bounded
at 100,000; speech minutes 1–1,440. Tutor counters follow the existing learner-local day; speech,
writing, TTS and feedback use UTC. A recording sent independently to STT and assessment consumes
audio units for both requests. Reservations are serialized under a learner lock; refusing a
request does not inflate the count or consume units. Attempted external failures can consume
the reserved quota because an invocation may have incurred provider cost. Learners see plain
messages and can continue other activities. In-memory burst throttles/cache remain per instance.

Setting `PILOT_ENABLED=false` pauses the pilot; **it does not turn off paid providers**. Use the
independent provider flags/selectors to stop paid use. Selectors stay `mock` until explicit real
configuration; selecting a real provider with missing credentials fails validation. Smoke CLIs
are independently bounded and bypass app flags/quotas; never schedule them in CI or on a loop.

## 6. Selecting and reviewing actual assessments

In `/admin/piloto`, select a consented participant's link. The metadata inventory lists up to
25 recent records of each kind: Azure speech with known fr-FR/fr-CA and successful scores,
rubric-assessed course writing, and rubric-assessed placement writing. Sources must belong to
the participant, occur after the current consent, be no older than 90 days and precede the end
of collection. Unknown historical speech locales are not invented or backfilled.

Use **Selecionar amostra para revisão**, then its **Revisar** link. The selected private view
can read the original writing from its existing assessment. The calibration snapshot stores
only actual scores, rubric, model, dates, human ratings and short notes; it does not duplicate
learner writing, evidence excerpts, transcripts or audio. Writing uses all seven existing
0–4 criteria and the original authored task requirements. Missing/changed rubrics are refused.
The UI lets a reviewer make an initial judgment before opening system values; this is not a
formally blinded study.

For speech, preserve Azure percentages and the actual numeric system interpretation separately
from ordinal human pronunciation/intelligibility bands. **The app has no retained recording**:
the reviewer must hear that same sample with separate permission (for example, a consented
live review), and attest to it. A transcription is insufficient. Without that access, leave the
sample pending. No UI for uploading/storing real recordings was introduced.

Save the human review; no learner estimate, mastery, planner, rubric weight or threshold is
changed. The database stores one canonical review per source and verifies the reviewer role
again. Independent two-rater work still uses distinct anonymous records in the existing private
kit; repeated saves in the application do not establish inter-rater agreement.

**Current writing boundary:** reviewed AI rubrics exist in placement items. Course open-writing
activities without reviewed rubrics remain unassessed; this phase adds no invented rubric or
curriculum. Speech mock/failure and writing without a genuine assessment cannot become a real
system/human comparison. See [CALIBRATION.md](CALIBRATION.md).

## 7. Calibration report

The period view shows selected/pending/compared sample counts, speech agreement separately for
fr-FR/fr-CA, and seven writing criterion comparisons: sample count, mean **system minus human**
band and count with an absolute gap of at least two bands. A positive grammar gap means the
system gave a higher band; it is not a calibrated probability. Speech bands are not subtracted
from Azure's 0–100 scale and are not CEFR classifications. Zero pending comparisons means no
human validation yet. Date filters use the UTC source-assessment date for these samples.

These are descriptive diagnostics from selected tiny samples. Do not claim significance,
fairness across accents or educational validity from a few agreements. Investigate task/rubric,
recording conditions, system limitations and reviewer reasoning before proposing any future
change. The existing local kit/import stays supported; its notes/targets are not returned in
the aggregate. Normal report output excludes private free text.

## 8. Protected admin analytics and two-week view

The existing `/admin/piloto` keeps its session/date/pace/CEFR/skill diagnostics and adds the
controlled participant section. Default range is 14 inclusive calendar dates. Use **De/Até**
and the learner ID/link to select a period and participant. Pace/task filters apply to the
existing diagnostics; the controlled cohort section uses the date and participant selection.

The report separates **Observação** from **Interpretação** and includes:

- invitation/status/consent dates, active days and estimated active time from accepted slices;
- daily goal sum, available plan seconds, session active seconds, completed sessions/steps;
- delayed unassisted FSRS recall and interval counts with existing minimum-sample gates;
- unique introduced/strengthened concepts across the whole selected period (not just this week);
- skill-estimate movement and current lower measured skills, clearly labelled current state;
- pace counts/completion and matched late-session fatigue signals;
- speech attempt counts by locale, course first writing attempts and placement/scored counts;
- provider requests/failures, token/audio/TTS units, separate simulated calls and unknown units;
- difficulty counts and human comparison status, plus metadata-only individual chronology.

Activity windows are clipped at the exact current consent and finished timestamps; learner-local
dates apply to educational metrics. Daily totals cannot be split at a consent timestamp, so the
pilot uses accepted activity slices instead of importing prior daily totals. Session counters are
cumulative: sessions started before consent or completed after finished collection are excluded.
The session subtotal is already part of the overall time and must not be added again. A zero
counter can be unobserved legacy activity; it is not proof of no learning. Current skill estimates
can reflect earlier learning and are labelled accordingly.

Reads are bounded (10 participants, 300 sessions, 5,000 observations per kind, 100 feedback rows,
200 calibration samples/timeline entries) and flag partial results. Lower the range/select one
learner when necessary; do not interpret truncation as a complete report. No model tuning occurs.

## 9. Provider usage and reliability

Use the per-participant units view to compare requests and failures per operation. Real Anthropic
tokens, Azure submitted audio and uncached TTS characters are cost inputs. Missing units stay
unknown; they are not zero cost. Mock calls remain separated. Quota refusals/cache hits do not
become extra paid invocations. Counting submitted audio twice for STT + assessment is intentional.

There is no currency calculation because current account/region/model prices are not configured.
Review the provider's own billing/budget controls before enabling it. Telemetry gives an
approximation, not an invoice, spending guarantee or availability SLA.

## 10. Retention and Railway cron

Run manually against the intended environment first:

```sh
npm run telemetry:prune
npm run telemetry:prune -- --max-batches 20
# Apply only after reviewing the dry run and database identity.
npm run telemetry:prune -- --apply --max-batches 20
```

The job fixes its cutoff at now minus 90 days. It deletes only schema-validated allowlisted
operational `StudyEvent` detail, plus `PilotFeedback` and `PilotCalibration` older than that
cutoff by **creation** date. Editing a review does not restart retention. At the exact cutoff,
rows are retained until a later run. It preserves unknown legacy payloads, consent/account rows,
mastery/FSRS, skill evidence/history, attempts, review logs, plans, lessons and daily totals.
Account deletion still uses the existing cascade. Local private kit/fixture files and database
backup retention require the operator's separate deletion policy.

Default: at most 20 × 5,000 candidates **per table**. A chronological date/ID cursor walks past
invalid legacy rows within the run. `more=true` signals backlog; inspect the operational result
and review legacy classification if an invalid prefix exceeds the bounded scan. No private rows
or cursor IDs are printed. Repeating apply is idempotent for already removed rows. Partial failure
is safe to rerun; the CLI disconnects the database and exits.

For Railway, create an optional cron service in **staging**, using this same repository:

1. Railpack Node 24, `RAILPACK_PRUNE_DEPS=false`; build `npm run db:generate` (postinstall also
   generates). Keep Prisma/tsx dependencies. No Next web build is needed for this short process.
2. Reference the **staging** `DATABASE_URL`. Supply the same valid auth origin/secret because the
   shared server configuration validates them. Leave provider selectors `mock`, omit API keys,
   and never set `TEST_DATABASE_URL`. Do not print variable values in logs.
3. Start command `npm run telemetry:prune -- --apply --max-batches 20`; no HTTP healthcheck.
   Web pre-deploy migrations must have succeeded first; do not run seed/reset from the job.
4. Cron schedule `0 6 * * *` (06:00 UTC, 03:00 São Paulo). Verify a dry run beforehand and inspect
   the first scheduled result. Record failures or `more=true` as operational work.

Railway requires the cron process to terminate; an overlapping still-running execution skips the
next trigger. Do not start an HTTP server or an in-process scheduler in this service.
[Railway cron requirements](https://docs.railway.com/cron-jobs).

## 11. Backup, recovery and migration expectations

Configure a recoverable PostgreSQL volume backup policy **before** real pilot data. Verify a
restore into an isolated service/database, never over the only working instance. Preserve the
original on recovery and restrict restored personal data like the original. Railway PITR, if
selected, must be enabled before the incident and restores into an adjacent service; availability
and retention depend on the actual service configuration.
[Railway PostgreSQL backup/restore options](https://docs.railway.com/guides/postgres-backups-restores).

The restore drill should check the deployed commit/schema, eight finished migrations, sign-in,
learner progress/mastery, consent versions/status, feedback and calibration counts, then run
`prisma migrate status` and the normal app smoke against the restored staging copy. Record the
backup ID/time, recovery duration and observed loss window. Securely remove the scratch copy after
verification. Reconcile withdrawals/account deletions made after the backup before reopening
traffic; restoration can recover previously deleted rows. No production seed is necessary or safe for this workflow. Local fresh migrations
are a migration check, not a Railway backup or restoration check.

Prefer additive migrations and expand/contract. A web rollback does not undo the database. A
failed pre-deploy migration must stop release; reconcile actual schema before any operator use of
`migrate resolve`. Never reset/delete migration history, use `migrate dev` in staging/production,
or run destructive seeds. For damage: stop writes, restore separately, validate, repoint the DB
reference to the verified compatible copy and deploy a matching app. See
[DEPLOYMENT.md](DEPLOYMENT.md).

## 12. Fourteen-day operating process and finish

Before day 1: isolate staging; run migrations; configure flags/quotas, backup and cron; validate
both real providers manually; test deployed auth/privacy/fallback; verify the operator; invite
3–5 volunteers and obtain their own acceptance. Record commit/model/region/date privately.

Days 1–3: observe onboarding/placement and the first daily sessions. Test both speech locales,
one AI conversation and reviewed-rubric placement writing only when available. Confirm usage is
real, quotas are understandable and no audio is persisted. Ask optional feedback sparingly.

Days 4–7: check active windows vs available plans, errors, recall counts, hard perception at high
accuracy, and recording/task conditions. Select actual samples for human review. Do not interpret
missing/not-assessed rows as failures or low ability. Check the backup/cron results.

Days 8–14: repeat ordinary use and delayed reviews; inspect within-person pace/fatigue only when
the existing evidence gates are met. Keep FR/CA comparisons and writing dimensions distinct.
Gather enough varied examples to identify concrete task/provider problems, not prove efficacy.

Finish each participant with **Encerrar coleta deste participante**. This freezes the read window
and stops new feedback. Preserve pending human review within 90-day retention and access controls;
withdrawal still erases pilot details. Export the period observations privately if needed under
an agreed retention policy. Separate observation, interpretation, missing evidence and any
proposed later validation/tuning task. Disable provider flags as needed to stop paid operations;
`PILOT_ENABLED=false` alone is not a billing kill switch. Do not start B1.2 automatically.

## 13. Actual Railway observation and exact next steps

Read-only inspection on 2026-10-10 found project **Je parle France**,
`f2455502-26f9-4fbb-925a-bd404bc21d1a`, web service **Je-Parle-Fran-ais**,
`fbc7c1d5-d144-4958-aeac-4380207f4148`, repository `Vituinho/Je-Parle-Fran-ais`.
Only **production** existed (`df5621aa-69f8-4ee3-b695-876bde781a3a`); there was no staging
environment. The observed successful deployed commit was `365198d`, independently pushed by
the user. These are timestamped observations, not a claim that cloud state stays unchanged.

Railpack was selected, both providers were `mock`, Azure/Anthropic credentials were absent,
database/auth variables were present, and the new flags/quotas and Railpack pins were unset.
Explicit build/start/healthcheck/pre-deploy/replica settings returned `null` (inferred/default
settings, not verified release/health configuration). Cloud DB migrations, backups and restoration
were not inspected. The local Railway CLI was linked to an **unrelated project**; never trust its
implicit context for this application.

Perform these steps now as operator:

1. Review the completed commits. Before pushing, check and pause the existing production
   auto-deploy while preparing staging: this code needs the eight-migration schema even with
   pilot collection off. This agent did not push. In project **Je parle France**, create
   **staging** with its own Postgres/volume. Do not reuse or duplicate production's
   DB reference or credentials. Connect the intended repository branch/web service in that
   environment and verify each staged variable reference.
2. Configure `DATABASE_URL` from staging Postgres, a new valid `BETTER_AUTH_SECRET`, exact HTTPS
   `BETTER_AUTH_URL`, `RAILPACK_NODE_VERSION=24`, `RAILPACK_PRUNE_DEPS=false`. Never configure
   `TEST_DATABASE_URL` there. Set build `npm run build`, start `npm start`, pre-deploy
   `npm run db:deploy`, health path `/api/health`, timeout 300 seconds and one web replica.
3. After the pre-deploy settings are ready, push the reviewed commits to the intended staging
   branch yourself and deploy. Start mock, `PILOT_ENABLED=false`, without a seed. Inspect migration/build/prestart
   logs and run the deployed learner/auth/persistence checklist in DEPLOYMENT. Health alone
   checks process liveness, not DB/provider readiness.
4. Configure backup and verify a separate restore. Add Azure key/region and Anthropic key/model
   privately. Set the explicit flags/quotas above, respecting account budgets. Run the bounded
   local smoke commands with the same provider resource/model; then set `SPEECH_PROVIDER=azure`
   and `LLM_PROVIDER=anthropic` in staging, redeploy and verify actual app FR/CA speech,
   conversation/report and placement writing, plus disabled-feature fallbacks.
5. Set `PILOT_ENABLED=true` only when those checks pass. Verify/provision the admin identity,
   invite participants and obtain each current-version acceptance. Configure/test the cron and
   keep the backup/restore evidence. Begin the 14-day process; check sample counts and billing.

After staging exists, explicit CLI commands help prevent project confusion:

```sh
railway status --project f2455502-26f9-4fbb-925a-bd404bc21d1a --environment staging --json
railway link --project f2455502-26f9-4fbb-925a-bd404bc21d1a --environment staging --service Je-Parle-Fran-ais
# Inspect migrations/environment inside the intended web container, without printing secrets.
railway ssh --project f2455502-26f9-4fbb-925a-bd404bc21d1a --environment staging --service Je-Parle-Fran-ais -- npm run env:check
railway ssh --project f2455502-26f9-4fbb-925a-bd404bc21d1a --environment staging --service Je-Parle-Fran-ais -- npx prisma migrate status
# Optional paid Anthropic suite in that configured container; review budget first.
railway ssh --project f2455502-26f9-4fbb-925a-bd404bc21d1a --environment staging --service Je-Parle-Fran-ais -- npm run smoke:tutor -- --suite
# Maintenance preview; apply is a separate reviewed operator step.
railway ssh --project f2455502-26f9-4fbb-925a-bd404bc21d1a --environment staging --service Je-Parle-Fran-ais -- npm run telemetry:prune -- --max-batches 20
```

Use the actual staging web service name if different. First SSH use may require registering a
key. Azure file fixtures are local/private, not shipped with the repository; run the exact local
commands above, then validate deployed app speech separately.
[Railway SSH](https://docs.railway.com/cli/ssh).

## 14. Tests, problems fixed and commits

Focused deterministic tests cover all requested categories: pilot authorization/IDOR, current
consent and withdrawal, provider flags and concurrent quotas, failure fallback, optional feedback
and separate difficulty, calibration ownership/actual band comparison, safe cleanup/mastery
preservation, account deletion/export isolation, period aggregation and real/mock usage units.

The complete unit/integration suite has **412 passing tests in 78 files**, with the dedicated PostgreSQL test database and all
eight migrations. Lint/typecheck passed. Production build passed with **38/38 generated pages**.
Playwright discovers **52 tests in 19 files**. The final relevant browser run passed **12/12**
tests (admin, intensive session, daily session, tutor and pilot, desktop + mobile). The full 52-case
browser inventory was discovered, not all executed in this phase.
Maintenance dry-run returned `removed=0`, `feedbackRemoved=0`, `calibrationRemoved=0` locally.
No destructive apply ran on development or Railway; cleanup apply tests used only the test DB.
All eight migrations also deployed to a newly created empty local scratch database; a second
deploy had no pending migrations, with zero users/participants and no seed. Only that scratch
database was then removed. This verifies fresh migration/idempotence, not cloud restoration.

| Check                    | Command / result                                                                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint                     | `npm run lint` — passed                                                                                                                                                                  |
| Types                    | `npm run typecheck` — passed                                                                                                                                                             |
| Full deterministic suite | `npm test -- --maxWorkers=2` — 412/412, 78 files, real dedicated PostgreSQL                                                                                                              |
| E2E discovery            | `npm run test:e2e -- --list` — 52 cases, 19 files                                                                                                                                        |
| Relevant E2E             | `npm run test:e2e -- e2e/admin.spec.ts e2e/intensive.spec.ts e2e/session.spec.ts e2e/tutor.spec.ts e2e/pilot.spec.ts` — 12/12 against local production build, mock providers, one worker |
| Maintenance              | `npm run telemetry:prune -- --max-batches 20` — dry-run, zero removal                                                                                                                    |
| Migration check          | Two `prisma migrate deploy` runs on fresh disposable local PostgreSQL — eight migrations, second idempotent, no seed                                                                     |
| Production               | `npm run build` — passed with 38/38 generated pages                                                                                                                                      |
| Content                  | `npm run content:check` — 0 errors, 0 warnings; curriculum unchanged                                                                                                                     |

Resource-heavy suites/builds ran sequentially on a low-memory Windows host. The first browser attempt failed on
fixture timestamps; after fixing UTC, it reached the review and exposed the accessible-label
issue. The final reruns passed after both fixes; failures were not counted as live provider
validation. Private fixtures/logs/captures remain in ignored local directories.

Important findings/fixes:

- Speech/TTS limits were partly fixed constants; controls now validate and enforce bounded
  configurable requests/audio, with serialized reservations and understandable learner messages.
- Writing quota rejection needed to preserve an unassessed answer; disabled/unavailable cases
  also retain the answer rather than fabricating a score. Placement TTS now records usage.
- Manual provider validation lacked a scenario matrix/machine-readable operation results;
  synthetic bounded cases now stop at the first failure and disclose unsupported metrics.
- Calibration lacked consented product-source selection; durable membership/consent and owner
  checks now gate human reviews without copying private writing/transcripts/audio into snapshots.
- Weekly metrics were insufficient for a full two-week report; period active slices/mastery,
  feedback, units and calibration are now aggregated independently of the current-week card.
- Retention could repeatedly stop at invalid legacy payloads; bounded chronological scanning
  walks beyond that prefix, and new pilot details expire by creation without removing progress.
- Browser validation exposed UTC mismatch in raw SQL fixtures and ambiguous select labels;
  fixtures now use explicit UTC timestamps and score fields have stable accessible labels.

Logical commits, preserving prior history:

| Commit    | Change                                                            |
| --------- | ----------------------------------------------------------------- |
| `365198d` | Independent provider controls and bounded daily quotas            |
| `dc145d1` | Bounded synthetic live provider validation workflows              |
| `818df6f` | Consented enrolment and private feedback domain/migration         |
| `1816f4f` | Authorized human calibration from actual consented assessments    |
| `810061c` | Consented two-week observations/report aggregation                |
| `6ffaf41` | Optional participation, feedback and protected review screens/E2E |
| `d063d8f` | Bounded scheduled pilot/telemetry detail cleanup                  |

The final documentation commit adds this guide and updates related architecture/deployment/
telemetry/provider/calibration notes. Use `git log dbe7b3c..HEAD --oneline` for its exact ID.

## 15. Remaining limits and next highest-value task

Real provider authentication, account model access, FR/CA quality, human calibration, the actual
Railway staging environment, scheduled cleanup, backups/restore and 14-day usage remain pending.
Providers observed in Railway/local app are mock. Email verification/password recovery still
need an email provider; per-instance auth/throttles/cache and one-replica assumptions remain.
Active time is approximate, course writing without reviewed rubrics is unassessed, audio is not
stored, and the canonical UI review is not an independent two-rater study. Small sample counts,
unknown units and truncation must stay visible. No money estimates or statistical significance
are invented; no learning algorithm was automatically changed.

**The code is ready for manual live validation. The inspected deployment is not ready to start
a real 14-day pilot until section 13's staging/provider/recovery/consent checks pass.** The next
highest-value task is that isolated staging validation with redacted provider outputs and a
restore/cron check, followed by the small consented pilot. B1.2 remains outside this phase.
