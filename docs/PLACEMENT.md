# Placement

Completed placement establishes a retained per-skill calibration for continuous estimation.
Ongoing practice updates latent estimates with a separate stable-band gate. Retakes recalibrate
only reported skills and preserve historical evidence, which is not counted again in the new
posterior. Pronunciation perception remains labelled as perception; production requires real
provider assessments. See `SKILL-ESTIMATION.md`.

## Reviewed open-writing tasks

The existing A2 weekend narrative and B1 colleague message have explicit version-1 rubrics whose
expected level matches their placement metadata. Only such items enter the bank. They require a
real configured LLM (`LLM_PROVIDER=anthropic`); the mock never enables assessment. After two short
writing items, at most one production task within 0.9 scale units of the estimate can complement
the block, without exceeding its item cap. Its likelihood weight is 0.5 multiplied by the validated
judgment's capped confidence (at most 0.65). Empty/insufficient, invalid or failed judgments are
stored unscored and do not influence the posterior. The original answer, rubric dimensions,
corrections, confidence, limitations and model are preserved in the response and report.

The report labels estimates containing semantic judgments as `ai_assessment`, and shows the
learner's text, selected corrections and limitations. Only important deterministic errors mapped
to known concepts at or below the expected level create writing review traces. AI-only corrections
never change course mastery. Exam readiness does not convert this uncalibrated AI judgment into
a measured probability. Without a real provider the existing deterministic writing items remain
available. Live rubric calibration against human ratings remains pending.

Code: `src/lib/learning/placement/` (pure, unit-tested) · item bank: `content/placement/`.

## Goals

Estimate each skill separately, quickly, without forcing advanced learners through beginner
items or beginners through C1 texts — and say how sure we are. It is an internal learning
assessment, **not** an official certification; the report says so.

## Modes

| Mode         | Duration                  | Objective blocks                                                                                                        | Self-assessment                       |
| ------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Quick        | ~8–12 min (≈ 14–24 items) | vocabulary, grammar, reading, listening                                                                                 | speaking, writing (can-do statements) |
| Complete     | ~25–40 min                | + writing (constrained production); pronunciation perception and scripted speaking when a speech provider is configured | speaking, when no speech provider     |
| Skill retake | ~4–8 items                | the chosen skill only, starting from the current estimate                                                               | —                                     |

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

Items that need an unavailable capability are never served. Reviewed open writing is selected only
with a real provider and a matching explicit rubric. Otherwise writing uses constrained
answers. Minimal-pair assessment requires server audio: only an opaque, authenticated URL for
the current item reaches the client (`/api/placement/audio`), never the correct played word.
Without the speech provider pronunciation is reported as not assessed; browser synthesis
remains available for learning exercises, where it is useful rather than an assessment secret.
Spoken items are scored from the learner's own stored pronunciation assessment
(transcript recall and the provider's overall score, 50/50), resolved on the server from its id —
a transcript or score sent by the browser is ignored (`server/services/speech-evidence.ts`).
The stored assessment must be recent, successful, produced by the real provider and match
the current exercise's reference text. Self-ratings cannot score a spoken objective item;
they belong only to the separate can-do block.

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
  progress; when that level's units are not published yet, the report says so and the learner
  starts at the first unit of the most advanced published level (never back at A0).

## Validation

`engine.test.ts` simulates 40 learners per mode answering stochastically from known abilities
and checks the mean absolute error (quick < 0.6 levels, complete < 0.45), skill separation
(reading 4.2 vs listening 1.8), determinism, capability fallbacks and stopping rules.

## Bank coverage (audited 2026-10-08)

`npm run placement:audit` prints the live numbers. 125 items (an earlier note said "about 150";
that was wrong):

| Skill         | A0  | A1  | A2  | B1  | B2  | C1  | Total |
| ------------- | --- | --- | --- | --- | --- | --- | ----- |
| grammar       | 2   | 5   | 5   | 5   | 4   | 3   | 24    |
| vocabulary    | 3   | 4   | 4   | 4   | 3   | 3   | 21    |
| reading       | 2   | 3   | 3   | 3   | 3   | 2   | 16    |
| listening     | 2   | 3   | 3   | 3   | 3   | 2   | 16    |
| writing       | 3   | 4   | 5   | 5   | 3   | 3   | 23    |
| speaking      | 2   | 3   | 3   | 3   | 2   | 2   | 15    |
| pronunciation | 2   | 3   | 2   | 2   | 1   | —   | 10    |

What holds: answers never reach the browser (`toClientActivity` strips keys; grading is server
side); objective items are scored deterministically; every item has authored level + offset
metadata; selection is information-maximising with seeded exposure control; stopping uses item
count and posterior SD; confidence is derived from the SD.

Known weaknesses, in priority order:

- **Difficulty is authored, not calibrated.** Level + offset is an expert guess until enough
  responses exist to fit IRT parameters (see Planned).
- **Thin cells.** B2/C1 have 2–4 items per skill, so a strong learner sees nearly the whole
  cell and the C1 estimate rests on few responses; pronunciation has 1 B2 item and none at C1
  (perception drills discriminate poorly above B1 — this is a deliberate cap, reported as such).
- **Few speaking and writing items are objectively scored.** Without a speech provider, speaking
  is self-assessed and pronunciation is not assessed; open-writing judgments require a real provider
  and remain uncalibrated with limited confidence.
  Most writing items are short typed
  answers (form, not composition).
- **Regional content.** 6 items are Québec-specific and none France-specific; the rest are
  neutral French. Fine for level, weak for destination readiness.
- **Per-option feedback** is authored on 8 of 42 multiple-choice items. Placement deliberately
  shows no feedback during the test; the report explains gaps from concept data instead.
- 52 of 125 items name the concepts they probe, so only those can produce review gaps.

Growth should follow these gaps (B2/C1 reading and listening, France items, calibrated
difficulties) rather than raw item count.

## Planned

- Re-estimate item difficulties (and discriminations) from logged responses (IRT calibration).
- Content-balanced selection by topic within a skill.

## How each skill was estimated

Every skill estimate stores its **method** (`skill_estimates.method`): `objective` (scored
items), `perception` (pronunciation heard but not produced), `self_assessment` (the learner's
own judgement at the end of the test), `self_report` (onboarding answers), `ai_assessment`
(reviewed semantic writing with capped confidence) or `not_assessed`.
Screens that make claims about ability use only measured evidence: the exam readiness page
(`/provas`) computes the probability that a skill is at or above a target level — from the
estimate and its uncertainty, 1 − Φ((target − θ)/σ) — only for `objective` skills, shows
self-assessments as such, and marks the rest "ainda não medido". The result is shown as a band
("ainda distante", "chegando perto", "provavelmente no nível"), never as a number that could be
mistaken for an official score, and the page says so.
