# Placement

Code: `src/lib/learning/placement/` (pure, unit-tested) · item bank: `content/placement/`.

## Goals

Estimate each skill separately, quickly, without forcing advanced learners through beginner
items or beginners through C1 texts — and say how sure we are. It is an internal learning
assessment, **not** an official certification; the report says so.

## Modes

| Mode         | Duration                  | Objective blocks                                                                                                             | Self-assessment                       |
| ------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Quick        | ~8–12 min (≈ 14–24 items) | vocabulary, grammar, reading, listening                                                                                      | speaking, writing (can-do statements) |
| Complete     | ~25–40 min                | + writing (constrained production), pronunciation (minimal-pair perception), speaking (when a speech provider is configured) | speaking, when no speech provider     |
| Skill retake | ~4–8 items                | the chosen skill only, starting from the current estimate                                                                    | —                                     |

## Scale

Ability θ lives on the CEFR scale used across the app (`src/lib/learning/cefr.ts`): A0 = [0, 1),
A1 = [1, 2), … C1 = [5, 6). Item difficulty `b = level midpoint + offset` (offset ∈ [−0.45, 0.45],
authored).

## Model (ADR-003)

`P(correct | θ) = c + (1 − c) · σ(a(θ − b))`

- `a = 1.7` for objective items, `0.9` for self-assessment statements.
- `c = 1/options` for multiple choice and comprehension questions, `0.5` for minimal pairs, `0`
  for typed/produced answers.
- Partial credit `s ∈ [0, 1]` uses the pseudo-likelihood `P^s (1 − P)^(1 − s)`.
- Self-assessment is down-weighted (likelihood power 0.5).

Posteriors are computed on a grid (θ ∈ [−0.75, 6.75], step 0.05).

**Overall ability** uses all responses with a prior from the onboarding answer
(`experiencePrior`). **Each skill** uses its own responses with a prior centred on the ability
implied by the _other_ skills, widened by a link SD of 0.8. With little skill-specific evidence
the estimate stays near the overall level; with more it follows the skill's own data, and no
response is counted twice.

## Item selection

1. **Calibration** (quick: 4, complete: 5 items) from items flagged `calibration`, alternating
   skills, most informative at the current overall estimate.
2. **Skill blocks**: the most informative unanswered items (3PL Fisher information) at the
   skill's current estimate. Stop when `n ≥ min` and `SD ≤ target`, or `n = max`
   (quick: 2–4 items, SD ≤ 0.5; complete: 3–7 items, SD ≤ 0.35).
3. **Self-assessment** for skills that cannot be measured objectively in this mode/device.

Exposure control: one of the top-3 items is chosen with a PRNG seeded by
`attemptId:responseCount`, so the sequence is reproducible and responses are the single source
of truth (the engine can always recompute the next item and every estimate).

Items that need an unavailable capability (`speech` for spoken items, `ai` for open writing) are
never served.

## Report

`buildPlacementReport` returns:

- overall level (`A2 forte · entrando no B1`) and SD;
- per skill: level, confidence (SD ≤ 0.35 high, ≤ 0.6 medium, else low) and **method**
  (`objective`, `self_assessment`, `perception` for pronunciation via minimal pairs,
  `not_assessed`);
- strengths/weaknesses: skills ±0.4 from the overall level, and item topics whose observed score
  deviates from the model's expectation by ≥ 0.55;
- **gaps**: concepts from failed items _below_ the learner's level that exist in the
  curriculum — these are seeded into spaced review;
- recommended start: slightly below the estimate (θ − 0.25), positioned within the level by
  progress; when that level's units are not published yet, the report says so.

## Validation

`engine.test.ts` simulates 40 learners per mode answering stochastically from known abilities
and checks the mean absolute error (quick < 0.6 levels, complete < 0.45), skill separation
(reading 4.2 vs listening 1.8), determinism, capability fallbacks and stopping rules.

## Planned

- Re-estimate item difficulties (and discriminations) from logged responses (IRT calibration).
- Content-balanced selection by topic within a skill.
- Speaking items scored from transcripts + pronunciation provider when configured.
