# Continuous skill estimation

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
