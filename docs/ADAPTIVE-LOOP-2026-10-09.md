# Adaptive learning loop — implementation and verification

This continues the completed [2026-10-08 audit](AUDIT-2026-10-08.md); it does not repeat that
inventory. Work covers the six requested adaptive-loop phases. No B1.2, B2/C1 curriculum,
exam simulator or broad UI redesign was added.

## Implementation matrix

| Area                        | Implemented behavior                                                                                                                                                                          | Status / qualification                                                                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Azure STT and pronunciation | Validated PCM16 mono 16 kHz WAV; bounded calls and decoding; invalid audio rejected before quota; score/JSON validation; explicit fr-FR/fr-CA capabilities                                    | Adapter and failure paths tested with injected responses. Live validation requires credentials and real recordings. French prosody remains unavailable.                                 |
| Anthropic tutor             | Stable structured parsing plus original-schema validation; 30 s timeout, no retries; friendly rate-limit/refusal/network/output errors; bounded educational context and conversation excerpts | Real adapter exercised through synthetic HTTP responses. Product tutor remains explicitly simulated without configuration; no live smoke success claimed.                               |
| Writing                     | Seven ordinal dimensions with exact excerpts, original text preserved, local word-count constraint, selected important corrections, conservative confidence/quality                           | Two existing A2/B1 placement tasks have reviewed rubrics and activate only with the real provider. Invalid/low-confidence output stays ungraded. Human calibration remains outstanding. |
| Continuous estimation       | Independent per-skill placement posterior, weighted metadata ledger, decay/repetition controls, bounded latent updates and separate stable promotion/demotion gates                           | Implemented and persisted atomically with activity/memory. Retakes retain history. No completion percentage or simulated speech becomes proficiency.                                    |
| Dashboard / privacy         | Stable bands, confidence, reasons, perception/unmeasured labels; stable overall receptive/knowledge level; evidence export and speech-derived evidence deletion                               | Implemented in Hoje and Progresso. AI-only evidence is excluded from objective exam-readiness probability.                                                                              |
| Daily planner               | Updated latent estimates, confidence-weighted relative weakness and explanatory focus reasons                                                                                                 | Existing FSRS priority, goals, destination, variety, time and saved-session behavior preserved. New/extra sessions consume the updated profile.                                         |
| Integrated loop             | Placement → calibration → grading → memory/review → repeated evidence → promotion → planner input → persisted dashboard                                                                       | Database integration and desktop/mobile browser verification passed.                                                                                                                    |

## Important problems found and fixed

- Provider calls and output could exceed useful bounds or accept incomplete metrics. Adapters now
  enforce deadlines and runtime validation; absent scores never become invented zero measurements.
- Tutor context/history and structured strings/arrays needed explicit limits. Only a selected,
  bounded educational context is sent; provider failures remain understandable and cost bounded.
- Open writing lacked a reliable grading contract. Semantic dimensions now require evidence
  excerpts, preserve the answer and carry confidence/limitations. Communication and task completion
  receive half the aggregate weight. Only important deterministic errors mapped to known, relevant
  concepts affect memory; model corrections alone never assign course concepts.
- Lessons updated memory but left skill estimates anchored to onboarding/placement. A dedicated
  ledger now updates each skill conservatively, with learner locking, atomic persistence and
  duplicate protection. Retakes recalibrate without deleting the ledger.
- Perception, self-report and real production needed distinct claims. Minimal pairs inform
  listening; production needs validated, learner-owned provider assessments. Scripted speech is
  insufficient for broad speaking promotion.
- A low-confidence production starting point could dominate planner weakness. Confidence now
  scales that priority, while goals and varied practice remain available.
- Weak/hinted practice could refresh the recency of an old calibration. Only substantial,
  sufficiently confident deterministic/provider evidence now refreshes measured recency; an
  old estimate stays uncertain after a hinted success. A database regression covers this case.
- The extended E2E initially compared layout-dependent line breaks with DOM text. It now compares
  semantic paragraphs, proving matching dashboard explanations across layouts and auth sessions.

## Estimation rules actually implemented

The engine reuses placement likelihoods. Evidence carries authored difficulty, score, confidence,
quality, date, task, concepts, source and method; it stores no text/audio. Source weights are lesson
1, review 0.35, speech 0.8, semantic writing 0.5, tutor 0.15 and authentic 0.8, multiplied by
confidence/quality. Self-report/simulation and already-calibrated placement have zero practice
weight. Evidence halves in weight after 90 days; repeated tasks are discounted. At most three
observations per skill/day contribute, with one attempt per task/day.

Each update moves the latent mean by at most 0.12. Promotion requires at least ten substantial
successes near the next boundary, six tasks, four days, six effective weight units and the confidence
margin. Demotion requires twelve persistent failures, six tasks, five days, seven weight units and
a stricter margin. One result or ageing alone cannot change a band. The service reads at most 500
post-calibration observations; historical rows remain retained. See [SKILL-ESTIMATION.md](SKILL-ESTIMATION.md).

## Tests and build

| Check                        | Result                                                                                                                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint                         | Passed.                                                                                                                                                                                                                       |
| Typecheck                    | Passed (`next typegen` and TypeScript). Native Windows filesystem access was required.                                                                                                                                        |
| Phase 4 persistence gate     | 269 tests passed, including concurrency, deduplication, rollback, retake history and speech privacy.                                                                                                                          |
| Phase 5 planner gate         | 272 tests passed; focused planner suite: 13 passed.                                                                                                                                                                           |
| Final unit/integration suite | Passed: 274 tests in 49 files (217 unit, 57 integration), using a 30 s test limit.                                                                                                                                            |
| Adaptive database scenario   | Passed: actual placement, FSRS error/review, 60 dated attempts over six tasks, listening promotion, independent skills, current planner input, saved-plan stability and export. Persistence/recency subset: six tests passed. |
| Content validation           | Passed: 267 concepts, 94 lessons, 657 activities, 125 placement items; zero errors or warnings.                                                                                                                               |
| Database migrations          | Additive migrations deployed successfully to local development and test databases; no pending migrations.                                                                                                                     |
| E2E discovery                | Passed: 46 tests in 16 files, desktop and mobile.                                                                                                                                                                             |
| Relevant browser execution   | All 14 unique scenarios validated in desktop/mobile: 12 passed in the main run; the two critical flows passed after fixing the text comparison. The critical pair also passed against the final rebuilt service (3.4 min).    |
| Production build             | Passed with Next.js 16.4.0; 33 static pages generated, route optimization complete. Browser tests use this build on local port 3200.                                                                                          |

The browser scenario checks real activity/review evidence, latent movement with stable CEFR bands
after one session, matching Hoje/Progresso explanations, and persistence after logout/login. Provider
HTTP fixtures and simulated tutor exercises are not live Azure/Anthropic validation. The initial
browser runner was restarted with a separate artifact directory because its cleanup overlapped open
Windows log files; one account scenario had passed before restart. An initial five-second content
import timeout during a concurrent build passed on its isolated retry; the final complete suite
uses a 30-second test limit and also passes. No failed result is treated as a successful live call.

## Commits

| Commit    | Logical change                                                                         |
| --------- | -------------------------------------------------------------------------------------- |
| `b95b042` | Speech input validation and bounded Azure calls.                                       |
| `2e68d13` | Bounded tutor context and real Anthropic structured-output handling.                   |
| `f58831c` | Evidence-backed structured writing engine.                                             |
| `bd5e5ff` | Selective reviewed writing placement activation.                                       |
| `4eea92f` | Conservative continuous estimation engine and deterministic fixtures.                  |
| `4859e93` | Persistent skill evidence, atomic learning integration and stable dashboard estimates. |
| `47be045` | Confidence-aware daily skill focus.                                                    |
| `ff810a3` | Keep stale confidence low after weak/hinted practice, with regression coverage.        |
| `4aefb76` | Prove the adaptive loop, matching dashboards and logout/login persistence.             |

The separate `docs: record adaptive-loop validation and remaining limits` commit records this report
after those nine implementation/verification commits.

## Repository state

All changes are committed as logical units. The working tree was verified clean after the report
commit. The temporary production test server was stopped; the existing local database was preserved.

## Still limited, mocked or incomplete

- No Azure/Anthropic credentials were available for the smoke commands. The commands safely
  reported missing configuration; live STT, locale quality, pronunciation metrics and real tutor/
  writing quality still require those credentials. See [AI.md](AI.md) and [PRONUNCIATION.md](PRONUNCIATION.md).
  Presence was checked again on 2026-10-09 without printing secrets: both keys remained absent,
  with `LLM_PROVIDER=mock` and `SPEECH_PROVIDER=mock`.
- Writing judgment is uncalibrated AI evidence, capped at confidence 0.65 and quality 0.5. Only two
  placement tasks have reviewed rubrics. Short constrained writing does not establish broad writing
  proficiency; no certification or objective exam probability is inferred from AI alone.
- Skill difficulties, source weights and gates are conservative authored heuristics, not validated
  CEFR measurement parameters. There is no longitudinal human benchmark yet.
- The published course has four broad B1 listening tasks, fewer than the six-task promotion gate.
  The integration fixture uses two existing B1 placement-bank tasks as additional practice fixtures
  only in the test. It does not expose new curriculum. Listening promotion through the current B1
  lessons alone can remain limited until broader evidence is available.
- Tutor/authentic evidence sources exist in the pure engine but are not wired to continuous
  estimation. Tutor corrections still use their existing memory/review integration.
- French prosody, human-reviewed writing calibration, broad unscripted fluency assessment, full
  exam simulations and advanced curriculum remain outside this work.

## Next highest-value task

Run the prepared smoke commands with real Azure/Anthropic credentials, then compare a small,
human-rated fr-FR/fr-CA speech and A2/B1 writing sample against provider output. Use those results to
calibrate confidence, quality and authored difficulty assumptions before expanding B1.2. The new
loop is instrumented to preserve evidence for that evaluation.
