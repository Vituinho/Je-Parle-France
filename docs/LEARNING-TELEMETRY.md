# Learning telemetry and pilot calibration

This is the completed 2026-10-09 phase report. The subsequent real-provider controls, consented
pilot, human review UI, two-week report and scheduled cleanup preparation are documented in
[PILOT.md](PILOT.md) (2026-10-10). Its additive migration brings the history to eight. Feedback/
human calibration now live in owner-scoped pilot tables and expire after 90 days from creation;
the old kit remains supported. Railway cron configuration is documented, but live provider and
cloud recovery/scheduling checks remain operator work. The historical results below are retained.

Implementation and validation report — 9 October 2026. This phase continues the intensive-learning
baseline `d477b87`, preserving placement, mastery, FSRS, continuous skill estimation, saved plans
and published curriculum. No B1.2, paid call, deployment or new analytics infrastructure was added.

## 1. Architecture and implementation matrix

PostgreSQL learning records remain the source of truth. `StudyEvent` stores strict educational
metadata, with an optional session FK and dedupe key. Results remain in `ActivityAttempt`, `ReviewLog`
and `SkillEvidence`; session/daily active seconds are accumulated transactionally. Pure TypeScript
in `src/lib/learning/telemetry/` derives diagnostics. Authenticated services perform bounded reads,
authorize access and supply aggregated advice to the existing deterministic planner.

| Area                    | Implementation                                                                                                                  | Status / boundary                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Events                  | Session start/pause/resume, block start/completion, activity start/completion, active slices, skill changes, provider usage     | Implemented; existing normalized results/legacy vocabulary reused             |
| Schema                  | Nullable review score/help/self-rating; attempt difficulty/help/self-rating; active daily seconds; event session/dedupe indexes | Additive migration; legacy unknowns stay unknown                              |
| Active time             | Interaction windows, focus/visibility, inactivity, explicit pauses and provider waits                                           | Implemented for lesson/review/session players and tutor chat; approximate     |
| Planned vs actual       | Chosen goal, available plan seconds, active seconds and completed plan phases                                                   | Implemented; underfilled beginner plans are distinguished from long workloads |
| Retention               | Immediate/delayed unassisted FSRS outcomes and interval bins                                                                    | Implemented diagnostic, not a controlled recall experiment                    |
| Learning gain           | Unique weekly mastery strengthening; theta and CEFR changes                                                                     | Implemented diagnostic; no causal attribution                                 |
| Activity effectiveness  | First-attempt type/difficulty results, useful evidence, observed start/completion counts                                        | Foundation; delayed recall is not attributed to an originating lesson type    |
| Intensive calibration   | Within-learner pace aggregates, duration comparisons and matched late-session decline                                           | Implemented with minimum evidence gates                                       |
| Recommendations/planner | Split-period/duration advice frozen into new plans                                                                              | Advisory; no automatic budget, task-selection or scoring change               |
| Learner UX              | Weekly active time/reference, useful skill evidence, strengthened concepts and recall                                           | Implemented in Hoje; small samples do not get percentages                     |
| Pilot UX                | `/admin/piloto`, date/pace/CEFR/skill filters and individual timeline                                                           | Implemented; durable DB admin role revalidated                                |
| Providers/errors        | Invocations, returned tokens, validated audio duration, TTS characters and coarse failure reasons                               | Cost foundation; no monetary billing claim                                    |
| Human calibration       | Protected import/comparison of existing private kit; speech locales and seven writing criteria                                  | Implemented; ratings/notes remain in the private kit                          |
| Privacy/retention       | Allowlist, owner export, account cascade and conservative 90-day detail pruning                                                 | Implemented tooling; scheduling remains an operator responsibility            |

Migration `20261009170000_learning_telemetry` brings the committed history to seven migrations.
Indexes cover session chronology, session attempts and unique `(userId, dedupeKey)`; nullable keys
preserve legacy events. No invented historical active time or assessment flags are backfilled.

## 2. Learner-facing metrics

The weekly card uses the learner's timezone and Monday–Sunday calendar. It shows approximate active
time and a reference of current daily minutes × preferred weekly study days. Preferences can change
that reference; it is not a retrospective completion grade. Historical bounded interaction credit
remains separately available in the existing habit/workload panels.

Unique concepts strengthening to familiar/strong/mastered are counted once in the week. Useful skill
observations must be substantial, have confidence/quality ≥0.5 and positive existing evidence weight.
Simulated, self-reported and placement observations are excluded; speaking/pronunciation require
provider evidence. Permitted AI writing evidence retains its existing method and weight. Counts are
not CEFR improvement claims; the proficiency engine's quality/promotion gates are unchanged.

## 3. Admin/pilot analytics

The page displays recent sessions, chosen goal vs available plan vs active time, completed phases,
activity distribution, evidence counts/tasks/days, retention intervals, provider units and internal
skill changes. Ordinary learners receive the existing not-found UI. Page/actions authorize access;
report/calibration services independently re-read the durable admin role, including after revocation.
The proxy and client UI are not the authorization boundary.

Target learners use `Aluno <ID suffix>`, not names/emails. This is pseudonymization, **not anonymization**.
The timeline returns validated metadata only; legacy JSON becomes type/date alone. No target response,
tutor message, transcript, recording or profile text is returned. The operator's own ordinary account
navigation remains visible.

Filter scope is explicit: pace/observed tasks filter session rows; CEFR filters activity distribution;
skill filters evidence. Recall/provider usage covers the selected learner/date period and is not
attributed to a selected activity difficulty or skill. Session/metric dates use learner-local days;
timeline timestamps are UTC.

Limits are 200 candidate sessions/10 learners on the pilot page, 300 sessions and 5,000 observations
of each kind per learner, and 200 timeline entries. Truncation is disclosed and suppresses learner
recommendations. Narrow dates or inspect one learner. There is no marketing cohort or BI platform.

## 4. Active-time calculation

`ActiveStudyClock` uses monotonic time. Opening an activity grants a 60-second reading window; coarse
pointer/key/input interaction renews it. Key values, coordinates and answer content are never inspected.
Hidden/unfocused tabs, disabled activities and provider waits contribute no time. Pulses are bounded
to 30 seconds; continue, pause and exit flush observed work. Tutor turns/reports flush before waiting;
TTS loading and speech assessment/transcription suspend the clock. Listening to resulting audio can count.

The authenticated server checks ownership, current plan phase/activity or owned active conversation,
stream identity and pause state. Learner locking, stream/sequence dedupe and a shared server wall-time
cap prevent concurrent tabs/double submissions accumulating duplicate credit. Client timestamps are
not accepted as server time. Slices/answer durations are integer milliseconds even when browser
`performance.now()` returns fractions.

This estimates interaction, not attention or verified learning. Long silent reading is undercounted;
unrelated interaction in an activity view can extend a window. Offline/failed requests and subsecond
rounding can lose time. Timing writes are best effort, with bounded client waits and no endless retry.
Placement, library browsing and standalone speech/shadowing labs retain prior accounting rather than
receiving fabricated active-time history.

## 5. Retention measurement

Existing FSRS `ReviewLog` rows gain nullable score, hinted and self-rated flags. Only known, unassisted,
scored outcomes enter diagnostics. Eligible repeats of a concept × dimension on one local day count
once. Success is `score >= 0.9`; partial-credit outcomes remain in product history.

- Immediate: elapsed FSRS days = 0.
- Delayed: elapsed days ≥1, grouped into 1–2, 3–6 and 7+ days.
- A displayed percentage needs 10 observations, 3 days and 5 distinct concepts in that group.

Counts/sample scope remain visible when percentages are withheld. Legacy unknowns are not failures.
The interval is since the prior FSRS review, not necessarily first introduction or every intervening
exposure. Focus practice can expose material without advancing FSRS. These are product diagnostics,
not controlled recall experiments, scientific confidence intervals or retention guarantees.

## 6. Intensive calibration and learning gain

Frozen plans supply pace/time context, including legacy pace inference. Completion is cursor divided
by number of plan phases, not a completed-time percentage: phases have different costs. Learner-facing
segments may group several phases; the pilot calls the counted units “Etapas”. Per-pace aggregates
include observed sessions/days, active seconds, phase completion and possible late-session decline.
A zero active counter means unobserved, not automatically unsuccessful.

Available `plan.seconds` matters: a chosen 90-minute goal with a 22-minute beginner plan is not a
90-minute workload. More minutes do not imply more learning. First-attempt type/difficulty results
and useful evidence form an effectiveness foundation. Weekly mastery strengthening and theta-before/
after events expose change within a CEFR band. Task mix, outside study and assessment methods can
confound these comparisons. No causal lesson gain or aggressive learner quality score is introduced.

## 7. Recommendations and deterministic planner feedback

These are conservative product guards, not statistically calibrated confidence levels:

| Guard                      | Condition                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Routine advice             | 10 observed sessions on 8 days; no truncated input                                                                                                     |
| Higher evidence confidence | 20 sessions on 14 days                                                                                                                                 |
| Duration comparison        | Each group: 10 sessions on 8 days; shorter-group mean phase completion exceeds longer group by ≥0.20                                                   |
| Possible fatigue           | 12 eligible first attempts overall; ≥8 of the same type/CEFR; compare earliest/latest four                                                             |
| Matched decline            | Accuracy drops ≥0.25 **and** mean active response latency increases ≥1.5×; exclude help/self-ratings/unknown difficulty/subsecond responses            |
| Split suggestion           | ≥8 available plans of ≥60 minutes on 8 days; ≥4 unfinished sessions with matched decline; mean phase completion <0.75; global advice gate also applies |

Fatigue is a session-quality signal, not a health/attention diagnosis. Different difficulty alone
cannot trigger it. Three sessions cannot reshape the plan. Duration advice describes phase completion,
not causal learning efficiency or superior retention.

`planningAdvice()` reads bounded prior-day sessions/attempts using the planner's transaction client.
`planSession()` deterministically freezes sufficient aggregated advice into additive `studyAdvice`;
the session overview displays it. Chosen minutes, pace, task budgets, FSRS scheduling, grader
thresholds and proficiency rules remain unchanged. No silent preference/curriculum optimization occurs.

## 8. Privacy, export, deletion and retention

New analytics contain IDs, timestamps, bounded time, educational outcomes, mastery/skill changes and
coarse provider units/reasons. They contain no password, token, API key, raw audio, conversation,
transcript, free-form error, profile text, key values, coordinates, IP, tracking pixel or ad identifier.
Existing authorized product conversations/review records are not duplicated into telemetry.

Owner export includes the new fields/events through the existing account service, excluding auth
secrets. Account deletion cascades through events, sessions, daily totals, attempts, review logs,
skill evidence and provider usage. Tests cover deletion, strict payload rejection and ownership.
Calibration uploads are processed in memory; returned reports omit notes, reviewer IDs, target text
and interpretations. Operator-managed private kit files are not another application database.

Operational session/block/activity/time/provider events are eligible for removal after **90 days**:

```sh
npm run telemetry:prune             # dry run: counts only
npm run telemetry:prune -- --apply  # operator-reviewed removal
```

The tool handles up to 5,000 candidates per batch and deletes only known types passing the strict
schema. Legacy/invalid payloads are preserved. Review `more` and repeat appropriately; invalid legacy
rows filling a batch require operator inspection rather than assuming expiry completed. Output is
counts/cutoff, never private rows. FSRS, attempts, skill history, plans, daily totals and existing
educational product history remain until account deletion. Analytics reads use recent history.
No scheduler is provisioned: an operator must run/schedule pruning. Audio is still discarded;
recording storage remains unconfigured.

## 9. Provider cost/error foundation

`observeProvider()` wraps existing tutor turn/report, writing, Azure pronunciation/STT and uncached
TTS calls, without additional provider requests. It records provider/operation, simulation, result,
coarse reason, elapsed time, returned input/output tokens, validated WAV duration, and TTS input
characters/locale. The existing Anthropic adapter disables SDK retries. Cache hits and locally refused
quotas are not new invocations. Mocks remain separate and do not become measured speech evidence.

Missing units are unknown, not zero cost; input duration/characters on a failure do not prove billing.
There is no monetary total: provider pricing/cache treatment/invoices and live usage need validation.
Existing durable quota counters measure consumption/units, not exact billing. Redacted provider
failure logging is reused. Telemetry-write failures emit only a coarse operation warning and preserve
successful provider results, with no extra call. DB outages cannot reliably log themselves in the
same DB; deployment logs remain necessary. This does not replace operational error monitoring.

## 10. Human calibration and pilot workflow

Follow [CALIBRATION.md](CALIBRATION.md) to record synthetic/consented anonymous samples, system
judgments, human ratings, agreement and private notes. `calibration -- init` does not overwrite a kit.
The protected form accepts JSON up to 1 MB/200 records, persists no copy and calls no assessment API.

Writing retains seven ordinal criteria, signed model-minus-human differences and flags absolute
differences ≥2 points. Speech agreement is grouped by fr-FR/fr-CA; Azure's 0–100 scores are not
subtracted from human 0–4 judgments. Missing ratings stay pending; small samples/imports cannot change
production scoring. Recent learners/dates/individual IDs support the initial pilot without fake
production seeds. Keep kit files, notes, recordings and exports out of public tickets.

## 11. Problems found/fixed and validation

- Page-open duration/historical credit were unsuitable for actual-time comparisons: added distinct
  counters, interaction windows, pause/idle/focus handling and provider-wait exclusion.
- Review ratings could mix immediate recall, help and self-ratings: added nullable outcome metadata
  and interval/sample gates without inventing historical flags.
- Concurrent tabs/retries could inflate work: added ownership/current-phase validation, learner
  locks, dedupe and shared server time bounds.
- Band-only events hid within-band change: added theta/method metadata while preserving estimator
  rules and prior tests' single-band-transition assertions.
- Fractional browser time could fail integer persistence: rounded durations/slices and tested
  fractional clocks, actual waits and hidden intervals.
- A start effect was after its cleanup return: moved it before return and verified resume.
- Tiny samples/different difficulty could mislead advice: added evidence guards, matched groups,
  joint decline signals and protection for short available beginner plans.
- Pilot JSON/role assumptions could expose data: strict metadata and durable admin authorization
  protect reports/calibration; E2E role fixtures require local disposable accounts.
- New operational detail lacked expiry tooling: added conservative dry-run-first pruning.

| Final check             | Result                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------- |
| Lint and typecheck      | Passed                                                                                 |
| Unit/integration tests  | **387 tests / 69 files passed**, including real PostgreSQL                             |
| Migrations              | Seven applied; none pending; no development reset                                      |
| Retention CLI on dev DB | Dry run: 0 eligible/removed; no live data pruned                                       |
| Content check           | **0 errors / 0 warnings**; 267 concepts, 94 lessons, 659 activities; content unchanged |
| E2E discovery           | **50 tests / 18 files**                                                                |
| Relevant production E2E | **10/10 passed**, desktop/mobile: admin, intensive, session, tutor                     |
| Final production build  | Passed: **37/37** generated pages, including pilot/timing routes                       |
| Visual review           | Weekly/pilot desktop/mobile captures inspected; singular label corrected               |

The intensive E2E measures a short interaction window, completes the first segment, pauses/logs
out/logs in, performs additional work, compares persisted seconds with weekly/pilot UI, preserves
the plan after preference changes and verifies learner denial. Admin E2E also imports the pending kit.

Verification used an explicitly mock-configured local production server at port 3200, stopped after
testing. PostgreSQL data was preserved. An intermediate simultaneous build was stopped under host
memory pressure, then rebuilt successfully in sequence; no dependency/infrastructure workaround
was introduced. Ignored `.data/verification/` contains logs/captures, not committed credentials/exports.

## 12. Commits

| Commit    | Logical unit                                            |
| --------- | ------------------------------------------------------- |
| `c166ae7` | Privacy-safe metadata and additive migration            |
| `41ba8ab` | Active-time credits and lifecycle events                |
| `6ef1e10` | Conservative diagnostics/retention and planner advice   |
| `8f45996` | Provider usage units and failures                       |
| `7595b06` | Authorized pilot services and human calibration reports |
| `34e84b7` | Weekly/pilot UI, tutor/wait timing and E2E              |
| `65c6b38` | Operational-detail retention tooling                    |

The final documentation unit is `docs: document learning telemetry and pilot validation`; its hash
is in Git history and the delivery response. Existing intensive commits were retained, not squashed.

## 13. Mocked, limited or incomplete

Live Anthropic/Azure accuracy/invoices, a Railway rollout and real learner progress remain unverified.
No pilot observations or human ratings were invented. Timing does not cover every surface, repair
offline losses or prove attention. Recall is tied to FSRS intervals; activity-origin causal attribution
is future work. Bounded/truncated reads and prune batches need operator awareness; scheduled pruning
is not provisioned. Kit notes remain in the existing private local workflow. There is no automatic
time/task/scoring optimization, ML recommendation model, new analytics infrastructure, examination
simulation or curriculum expansion.

## 14. Exact recommended next step

Run one controlled Railway staging pilot with **3–5 consenting learners for 14 days**, targeting
**20 observed sessions on 14 days per learner** before reviewing strong routine advice. Deploy the
seven migrations through the existing release procedure; verify timing/export/deletion/admin
boundaries with disposable accounts. Once live credentials and a cost budget are configured, use
the existing authorized smoke/calibration workflow for fr-FR/fr-CA speech and the seven writing
criteria. Record human agreement privately; review recall, phase completion, within-learner workload,
evidence coverage and provider units. Establish the pruning schedule. Use that report to choose the
first measured calibration adjustment. Do not begin B1.2 automatically.
