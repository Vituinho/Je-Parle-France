# Intensive and accelerated learning — implementation report

Validated on 2026-10-09, extending the clean staging-readiness baseline `3217db5`.
The existing planner, FSRS, mastery and continuous skill engines remain in use.
Published curriculum remains A0–A2 and B1.1. No B1.2, paid infrastructure, deployment or live
provider calls were added in this task.

## 1–7. Implementation matrix

| Area                       | Implementation and practical limit                                                                                                                                                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Study pace              | `light`, `balanced`, `accelerated`, `immersion`; PT-BR labels Sem pressa, Equilibrado, Acelerado, Imersão. Available time, evidence, goals and capability checks still drive planning.                                                                                       |
| 2. Durations               | Presets 5, 15, 30, 45, 60, 90, 120 and 180 minutes; custom integer from 5 through 240. Pace and time share the existing onboarding time step.                                                                                                                                |
| 3. Planner                 | Due review first; bounded prerequisite-safe teaching; weak-skill focus; authored listening, pronunciation, speaking, reading and controlled writing. Extra production uses deterministic tasks when providers are unavailable.                                               |
| 4. Blocks                  | Above 60 minutes, persisted learning segments normally group at most 25 minutes of tasks; teaching-to-application can provide an earlier break. A cursor preserves completed groups and micro-lesson boundaries. Optional pauses do not remove progress.                     |
| 5. New material            | A local-day allowance, reduced for review backlog or recent low retention, includes already introduced material and outstanding reservations in other plans. Extra sessions do not receive a fresh allowance.                                                                |
| 6. Dashboard/settings      | Frozen plan pace and time, planned duration, recorded time, group overview, pause/resume and flexible weekly totals. Preference changes affect future sessions; today's plan and cursor remain unchanged. Deadline comparison displays uncertainty or insufficient evidence. |
| 7. Migration/compatibility | Nullable `LearnerProfile.studyPace` through `20261009120000_study_pace`. Legacy 5/15 infer light and 30/60 infer balanced while keeping their time. Old version-1 JSON remains readable, with segment fallback. No onboarding replay or plan reset.                          |

Core implementation: `src/lib/learning/study-pace.ts`, `planner/planner.ts`,
`study-workload.ts`, `review/generate.ts`, and `src/server/services/session.ts` / `review.ts`.

## New-material safeguards and content mix

The base concept allowance is 3 / 6 / 10 / 16 according to available time. Accelerated or immersion
study at 60+ minutes adds at most two, subject to the receptive-level ceiling: A0 at most 12,
A1 at most 16, and higher levels at most 18 under the current base allowance. The ceiling does not
grow linearly with study time. A backlog or at least eight recent trace outcomes averaging below
0.75 halves it, rounding up. These are initial heuristics, not measured individual retention capacity.

Long plans cap teaching at 25 minutes, normally about 35% of the post-review budget. Step metadata
stops a micro-lesson before the first teaching card that would exceed the remaining concept cap.
A partial prerequisite lesson cannot be skipped to reach later content. Authored practice checks
all targeted concepts and lesson dependencies, the learner's destination, and each skill's difficulty.

Generated focus practice makes one bounded pass through up to six items per selected skill.
Newly taught lexical concepts support dictation, prompted oral response and written retrieval;
generated audio uses only the taught word/chunk, avoiding unseen sentence dependencies. Ordinary
spaced review generation remains separate. Supplementary authored tasks are unique within a plan,
exclude tasks already assigned in its lessons, alternate skills where alternatives exist, and cap
each skill's task count. Strong reading receives at most two supplementary reading tasks. Equally
useful authored tasks rotate by local date, while a saved plan stays fixed.

Measured weaknesses receive more weight than uncertain starting estimates. Relocation supports
listening/speaking priority. Variety and recent focus history reduce domination by one skill.
Regional metadata retains France/Canadian French voice selection and destination tracks.

## FSRS, evidence, fatigue and forecasting

Only due review updates memory scheduling. Focus submissions are authorized against the active
persisted block, graded server-side and passed through the existing practice service without memory
scheduling. Attempts, study time and eligible skill evidence remain; FSRS traces, logs and mastery
do not change. Canonical task IDs keep the existing evidence deduplication. Review items already
rescheduled are filtered on resume, and corrective feedback does not become a second early review.

Large review lists split into tasks of at most ten minutes before grouping. Pauses are optional;
the weekly time reference is `dailyMinutes × weeklyGoalDays`, calculated from existing local-date
activity totals. Uneven days and rest are supported. Recorded time is bounded interaction time
(currently at most 120 seconds per credited interaction), not a continuous stopwatch and never a
proficiency measure. Lesson/block completion is also distinct from demonstrated ability.

The deadline indicator reuses existing broad study-load reference ranges. Comparing them to a
target requires all four language skills to be objectively assessed, medium/high confidence,
at least 20 evidence items and seven evidence days each. Otherwise it explicitly reports missing
evidence. It considers the weakest measured language skill, weekly availability, target and month;
it emits no individual arrival date or learning velocity. Existing ability/preference-based language
support remains authoritative; choosing immersion alone does not hide Portuguese.

## Important problems found and fixed

| Problem                                                                                     | Fix and evidence                                                                                                                                            |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A first-day accelerated plan contained only teaching and one segment                        | Added bounded application of taught vocabulary and a natural teaching/application break. Unit, real-database integration and desktop/mobile E2E cover it.   |
| Resuming a partial micro-lesson could extend beyond its saved teaching allowance            | Frozen start/end calculation preserves the original window and recognizes already-completed tasks. Unit coverage verifies both partial and past-end resume. |
| Concurrent plan requests could duplicate sessions or exhaust the database pool              | Learner lock plus transaction-client reads; integration coverage sends 12 requests and verifies one session.                                                |
| Concurrent block completion could record the same final event twice                         | Cursor validation under the learner lock; integration coverage verifies one completion event.                                                               |
| A paused review could present items already rescheduled or count session review incorrectly | Due-only preparation, review context and corrective practice without rescheduling; integration verifies one review and rejects a second correct submission. |
| Preference changes could label today's frozen plan using tomorrow's pace                    | Dashboard reads pace/time from the saved plan. E2E changes to immersion/120 and still sees accelerated/90 today.                                            |
| New E2E navigated before logout finished, then used an ambiguous radio selector             | Wait for completed logout and scope the pace radio to its fieldset. The final desktop/mobile run passes.                                                    |

## 8. Tests and production build

| Check                         | Result                                                                                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preferences logical unit      | Lint/typecheck and 334 tests in 56 files passed before `da8a20d`.                                                                                                                                                       |
| Planner logical unit          | Lint/typecheck and 356 tests in 57 files passed before `71b59ed`.                                                                                                                                                       |
| Final source lint / typecheck | Passed.                                                                                                                                                                                                                 |
| Final unit/integration suite  | **365 tests in 58 files passed**, including real PostgreSQL integration. Six migrations found; none pending.                                                                                                            |
| Content validation            | **0 errors, 0 warnings**; 267 concepts, 94 lessons, 659 activities. No authored content changed.                                                                                                                        |
| E2E discovery                 | **50 tests in 18 files** discovered; discovery does not imply all 50 were executed.                                                                                                                                     |
| Relevant E2E                  | **14 existing desktop/mobile cases passed** in the initial production run: account, critical flow, health, onboarding, persistence and session. The two new cases initially failed and prompted the fixes above.        |
| Final intensive E2E           | **2/2 passed** on the final production build: desktop 37.0s, mobile 31.7s. Completes a group, pauses, signs out/in, resumes the same plan/cursor, changes preferences, reloads, and verifies today's plan stays frozen. |
| Production build              | **Passed**, Next.js 16.4.0: compilation, TypeScript, page data and **34/34** generated pages.                                                                                                                           |

Successful final commands: `npm run lint`, `npm run typecheck`,
`npm test -- --maxWorkers=2 --testTimeout=30000`, `npm run content:check`, `npm run build`,
`npx playwright test --list`, and the focused `e2e/intensive.spec.ts` production run.
E2E/helper formatting and targeted ESLint also passed. Existing passed cases were preserved rather
than restarting the earlier audit. Verification logs are kept locally in ignored `.data/verification/`;
no credentials or learner exports are committed.

## 9. Commits

- `da8a20d` — study pace preferences and flexible daily time.
- `71b59ed` — adaptive planner and intensive study safeguards.
- `8d3773e` — resumable study blocks, practice/resume refinements and weekly workload.
- `f87e9d7` — accelerated onboarding, pause/login/resume E2E and compatible helper options.
- This report and pedagogy/architecture/mastery/deployment updates form the final documentation
  commit; its hash is available in `git log` and the delivery response.

## 10. Mocked, limited or incomplete

- Verification used **mock LLM and speech providers**. No paid call, real Railway rollout or live
  provider validation was performed for this feature. The new migration still needs deployment.
- Browser TTS, recording/model comparison and deterministic dictation/controlled writing support
  practice without a live provider. Self-rated/simulated speech cannot promote measured skills.
  Free writing and AI conversation require the existing live adapters and remain capability-gated.
- A beginner may receive substantially less than 90/120 minutes until enough material is known.
  The UI shows this explicitly; the engine does not add excessive new concepts or artificial repeats.
- Time accounting is bounded interaction credit, not precise wall-clock study measurement. Weekly
  time is a flexible reference; the existing day-based habit summary also remains visible.
- Retention thresholds, task times, ceilings and variety weights need learner data for calibration.
  No fatigue sensor, empirically calibrated velocity, individual ETA or automatic study-time change
  was introduced. The existing proficiency quality gates were preserved.
- New modes reuse current authored content and regional assets. They do not supply a complete
  B2/C1 course, expanded authentic audio or TEF/TCF simulation.

## 11. Recommended next task

Run a controlled staging pilot with consenting learners using the existing provider-validation
procedure when live credentials are configured. Collect bounded interaction time versus planned
time, skill mix, next-day/next-week retention, pause/resume success and provider cost. Use those
observations to calibrate intensive budgets and content selection before adding more curriculum.
Do not start B1.2 automatically.
