# Mastery model

## Skill estimates and concept memory

Concept mastery remains FSRS evidence per dimension; course completion never becomes proficiency.
Continuous skill estimates are separate, conservative posteriors updated in the same transaction
as practice memory. Comprehension informs its own skill; fragments carry less quality, and hints
reduce confidence. Self-report and simulated speech cannot raise measured production estimates.
Only important, deterministic, known-concept writing issues feed memory; semantic AI judgments
alone do not create concept errors. See `SKILL-ESTIMATION.md` and `AI.md`.

Code: `src/lib/learning/memory/memory.ts` · ADR-002 in `ARCHITECTURE.md`.

Completing a lesson is **not** learning it. Knowledge is tracked per **concept × dimension**:

| Dimension       | Meaning                                     | Informs skill |
| --------------- | ------------------------------------------- | ------------- |
| `recognition`   | understands the written form                | reading       |
| `recall`        | retrieves the form from its meaning (typed) | writing       |
| `listening`     | understands it when heard                   | listening     |
| `writing`       | uses it correctly in written production     | writing       |
| `speaking`      | produces it orally                          | speaking      |
| `pronunciation` | articulates the target sounds               | pronunciation |

Lexical concepts also inform _vocabulary_; grammar concepts inform _grammar_. Default
dimensions per kind: lexical → recognition, recall, listening, speaking; grammar → recognition,
writing, speaking; pronunciation → listening (perception), pronunciation; culture → recognition.
A concept may override them in content.

## States (derived, never stored)

| State      | Rule (FSRS card + evidence)                                            |
| ---------- | ---------------------------------------------------------------------- |
| unseen     | no trace                                                               |
| introduced | presented on a teaching card, never practised (`reps = 0`)             |
| learning   | FSRS Learning/Relearning, or stability < 3 days                        |
| familiar   | stability 3–21 days                                                    |
| strong     | stability 21–90 days, or fewer than 4 successes                        |
| mastered   | stability ≥ 90 days and ≥ 4 successes                                  |
| decaying   | stability ≥ 3 days but current recall probability < 0.8 (long overdue) |

A concept's overall state is its **weakest practised dimension**; never-practised dimensions are
listed separately, so _understands "j'aurais besoin de" when reading but cannot say it yet_ is
visible to the learner and to the planner.

For aggregation (progress bars) states map to values: unseen 0, introduced 0.1, learning 0.3,
decaying 0.45, familiar 0.6, strong 0.85, mastered 1.
