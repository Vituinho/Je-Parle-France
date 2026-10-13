# Recovery of stale reviews — 13 October 2026

## Cause established in the code

The frozen `DailySession.plan` describes the work selected when a session was created. The
client `ReviewPlayer` copies the prepared items into a local queue and advances only after an
accepted answer/Continue. `prepareReviewItems(..., dueOnly=true)` previously filtered future-due
traces at page load, but the active client queue was never revalidated. A successful review in
another tab/page, a lost response/double submit, or another learning operation can update the
schedule after that snapshot. The old `submitReview` safeguard then threw “Este item já foi
reagendado…”; `PracticeStep` rendered the error and retained the same question/Verificar button.

Refreshing could remove the stale items, but an empty prepared block returned a blank player
instead of completing the persisted block. An already-reviewed reference remained in the frozen
plan, without a durable distinction between a replay and an explicit corrective retry. The
planner currently deduplicates concept/dimension review candidates, but legacy duplicate
references still needed safe handling. This investigation established the code paths behind the
reported production behaviour; it did not inspect a real learner's private production history
or claim which particular external action changed that learner's schedule.

There was also a concurrency flaw: the due check occurred before `submitActivity` acquired the
learner lock. Two requests could both pass it, then each write an FSRS update. Grading may happen
before that lock, but the final scheduling decision must be made under the same transaction as
FSRS/history, attempt, mastery evidence, daily counters and completion telemetry.

## One logical fix

- New frozen review references carry a schedule version (repetitions, due and last-review
  timestamps). This is snapshot metadata; the planner and FSRS rules do not use different
  weights, thresholds or scheduling algorithms.
- Preparation filters completed/stale/unbuildable references and deduplicates scheduled review
  references, preserving the frozen plan. Old plans use current due state, last review relative
  to session creation, and any persisted review receipt; nothing is backfilled or reset.
- The player asks the server whether the next question is still valid before displaying it.
  Consecutive stale items advance automatically without grading or adding answered/correct
  counts. A stale response detected at submit time also advances instead of rendering an error.
- The authoritative guard runs again after the learner lock, inside `submitActivity`'s write
  transaction. A stale response exits with a skip result and creates no FSRS update, review log,
  activity attempt, skill evidence, daily credit or activity-completion event. Provider grading
  stays outside that write transaction.
- A server-owned receipt in the existing attempt JSON identifies concept/dimension and
  first/corrective phase. A first answer can be scheduled once per frozen session; an explicitly
  requested retry of an incorrect first answer is practice once, with no FSRS/review credit.
  Replays cannot masquerade as the corrective phase. The request also identifies its block,
  so a previous review cannot become a later focus exercise after another tab advances.
- Page load and block completion reconcile exhausted consecutive review blocks under the learner
  lock. They update only the existing session cursor/status and normal deduplicated block/session
  completion records. Empty/final blocks finish normally; valid lesson/focus work is retained.
- Recovery failure offers plain retry/reload controls. A block completion failure says “Esta
  revisão já foi concluída. Tente continuar ou recarregue a página para irmos à próxima.” Internal
  scheduling/database details are not exposed. Session owner checks remain authoritative.

No new database table or migration is required. Old attempts without receipts retain their
original data; there is no fabricated historical completion. Real progress remains in the
database, so refresh, back navigation, another tab and logout/login re-read persisted state.

## Regression evidence

Deterministic PostgreSQL tests cover concurrent/same review submissions, schedule/log/counter/
mastery-evidence/telemetry uniqueness, refreshed final-block completion, consecutive obsolete
blocks, deleted personal sources, duplicate legacy references, changed frozen schedules that
are still due, one corrective retry, standalone snapshots, owner isolation and replay into a
later focus block. Existing session/intensive tests retain their original scheduling assertions.

Component tests cover consecutive skips, an entirely stale queue, an empty resumed block,
friendly recovery failure/retry, submit-time skip and failed submission recovery. The browser
regression uses only a disposable local account and synthetic local fixture: stale/duplicate
references, an active snapshot in a second tab, one real local review submission, automatic
completion in the stale tab, refresh/back and logout/login. It checks one review log/attempt
and one review credit, in desktop and mobile. No paid provider or production fixture is used.

## Verification results

| Check                                                                         | Result                                                      |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `npm run lint`                                                                | Passed                                                      |
| `npm run typecheck`                                                           | Passed                                                      |
| `npm test -- --maxWorkers=2`                                                  | 427 passed, 81 files; PostgreSQL integration tests executed |
| `npm run build`                                                               | Passed; 38/38 pages generated                               |
| New stale-review E2E, desktop and mobile                                      | 2 passed                                                    |
| Existing session, intensive-session and pronunciation E2E, desktop and mobile | 6 passed                                                    |

The 15 new deterministic server/component tests are included in the full suite. The browser
tests ran against the local production build, with mock LLM/speech providers. Initial browser
failures were fixture synchronization issues: clicking hidden radio inputs, reading the session
before the streamed dashboard created it, and navigating before logout finished. The final
regression uses visible labels and waits for those operations; both projects pass. Existing
flows passed separately and were preserved.

This change has not been deployed by the agent. No production database or live provider was
used. The next highest-value task is to release this fix through the established deployment
workflow and verify the reported learner flow on staging, then production. No curriculum
expansion, FSRS rule, learning threshold or historical data migration is included.
