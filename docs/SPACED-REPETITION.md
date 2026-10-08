# Spaced repetition

Scheduler: **FSRS** via [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) (FSRS-6
default parameters), wrapped in `src/lib/learning/memory/memory.ts`.

## Configuration

| Parameter         | Value         | Why                                                                    |
| ----------------- | ------------- | ---------------------------------------------------------------------- |
| request retention | 0.90          | FSRS default; good balance of workload and recall                      |
| maximum interval  | 365 days      | Language items should resurface at least yearly                        |
| learning steps    | 1 min, 10 min | A failed item comes back within the same session                       |
| relearning steps  | 10 min        |                                                                        |
| fuzz              | on            | Spreads reviews so items learned together do not all fall due together |

## From grades to ratings

Ratings are derived deterministically from the grader's outcome (`ratingFor`):

| Outcome                                                                                             | Rating |
| --------------------------------------------------------------------------------------------------- | ------ |
| score < 0.5 or wrong                                                                                | Again  |
| almost (accent/typo/punctuation slip), hint used, partial score < 0.9, self-rated "com dificuldade" | Hard   |
| correct                                                                                             | Good   |

Easy is never inferred automatically. Each activity declares which concept × dimension it
evidences and with what weight; evidence with weight < 0.5 only updates counters and does not
move the schedule.

## What gets scheduled

Every concept × dimension the learner practises gets a card: words, chunks, conjugations,
grammar structures, pronunciation targets, false cognates, and **personal items** (corrections
from tutor conversations, `personal:<id>`). Placement gaps are seeded as failed reviews so they
enter the queue immediately.

Review logs are stored (`review_logs`) so FSRS parameters can be optimised per learner later.
