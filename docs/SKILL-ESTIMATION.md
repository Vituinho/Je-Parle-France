# Continuous skill estimation

## Application integration

`SkillEvidence` stores metadata only: no answer text or audio. Practice saves evidence, FSRS,
review logs and the activity attempt in one transaction, serialized per learner. A unique
learner/skill/key prevents repeat submissions from counting twice. The estimator reads at most
500 observations since the retained calibration; older rows remain available for export/history.
Placement retakes reset the calibration and display gate, preserving previous evidence.

Comprehension tasks inform their own skill. Grammar and vocabulary fragments have reduced quality;
constrained writing is weak evidence. Minimal pairs inform listening, never pronunciation production.
Speaking/pronunciation require a persisted, learner-owned, non-simulated speech assessment.
Scripted speech does not satisfy broad speaking promotion. Reviewed semantic writing carries AI
confidence/quality. Tutor and authentic sources are supported by the engine but are not connected
to ongoing estimation yet.

The existing Hoje and Progresso pages show stable bands, confidence and explanations. Unmeasured
production says “a confirmar”; perception is labelled separately. Practice confidence is at most
medium, and evidence older than 90 days lowers displayed confidence without demoting a band.
The overall level uses stable receptive/knowledge bands. Exam readiness excludes AI-only and
unmeasured estimates. Account export includes evidence; deleting speech assessments removes their
derived evidence and resets affected practice estimates to their retained calibration.

## Statistical engine

`src/lib/learning/skill-estimation/estimate.ts` is pure TypeScript. It reuses the placement
logistic likelihood and grid posterior separately for each skill. Placement is the initial normal
calibration; a retake supplies a new calibration date. Earlier observations remain history, but
are not counted again in the posterior already calibrated by that retake. Placement responses
are not re-added as practice observations. Course completion, time spent and teaching-card views
are never proficiency evidence.

Each evidence record carries a task/key, skill, authored CEFR difficulty, result, confidence,
assessment quality, guessing floor, date, concepts, source and assessment method. Weights are
lesson 1, review 0.35, provider speech 0.8, semantic writing 0.5, tutor 0.15 and authentic exercise
0.8, multiplied by confidence and quality. Age halves the weight every 90 days. Self-report and
simulated results have zero weight; speaking/pronunciation accept only validated provider
assessment. Perception is listening evidence, not production.

Only the first task attempt per UTC day contributes; at most three tasks per skill/day are used.
Repeating the same task on later days discounts its weight by `1 / (1 + previous repetitions)`.
The initial calibration anchors the posterior, with a modest SD floor of 0.5 and gradual uncertainty
growth. Each update moves the latent mean by at most 0.12; posterior SD never falls below 0.35.
These are conservative authored heuristics, not externally calibrated CEFR measurements.

## Stable displayed bands

The display gate is separate from the latent mean. Promotion by one band needs:

- At least ten recent substantial successes (score ≥ 0.8), from at least six distinct tasks and
  four distinct days, with confidence and quality ≥ 0.5.
- Tasks at/near the next boundary (difficulty from 0.2 below to one unit above it).
- At least six effective evidence-weight units and a mean at least `0.84 SD + 0.05` above the
  next boundary (approximately 80% one-sided confidence under a normal approximation).

Demotion is harder: twelve substantial failures (score ≤ 0.4) around the current band, six distinct
tasks, five days, seven effective weight units, and the mean plus `1.04 SD` below the current
boundary by 0.15. One success/failure cannot change the band. Age alone never demotes. Memorised
fragments, one-day cramming and repeated identical exercises cannot satisfy breadth requirements.
The UI helper can describe a stable band as “consolidando”, without invented decimal precision.

Deterministic fixtures cover promotion, persistent demotion, one-response stability, ageing,
confidence weights, skill independence, real versus simulated speech, repeated/crammed fragments,
placement initialization and recalibration after retakes.
