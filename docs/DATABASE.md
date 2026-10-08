# Database

PostgreSQL via Prisma 7 (`prisma/schema.prisma`, driver adapter `@prisma/adapter-pg`). The
generated client lives in `src/generated/prisma` (git-ignored, generated on `npm install`).

## Principle: the database stores learner state, not course content

Course content is versioned data in `content/` (see ADR-001 in `ARCHITECTURE.md`). Tables
reference content by stable string IDs — `conceptId`, `lessonId`, `activityId`, `itemId`,
`scenarioId`. Those IDs must never be renamed once shipped.

## Tables

| Area | Tables | Notes |
| --- | --- | --- |
| Auth | `users`, `sessions`, `accounts`, `verifications` | Better Auth core schema; `users.role` = learner \| admin |
| Profile | `learner_profiles` | Onboarding answers, daily minutes, correction & support preferences, start lesson, placement status, recording opt-in |
| Ability | `skill_estimates` | Per-skill θ on the CEFR scale with posterior SD and source |
| Placement | `placement_attempts`, `placement_responses` | Responses are the source of truth: the engine recomputes estimates from them |
| Memory | `memory_traces`, `review_logs` | One FSRS card per learner × concept × dimension; mastery is derived. Review logs kept for future FSRS parameter optimisation |
| Practice | `lesson_progress`, `activity_attempts` | Lesson completion is tracked separately from mastery |
| Sessions | `daily_sessions`, `daily_activity` | Planned session (JSON plan + cursor) and per-day aggregates for streaks/weekly goals |
| Personal review | `personal_items` | Learner-specific items (tutor corrections) reviewed as `personal:<id>` concepts |
| Tutor | `conversations`, `conversation_turns` | Report stored as JSON at the end |
| Speech | `speech_attempts` | Scores only; `recordingKey` set only when the learner opted in |
| Skill estimates | `skill_estimates` (θ, σ, source, method) | `method` says whether an estimate was measured, self-assessed or self-reported; only measured evidence feeds ability claims |
| Analytics & motivation | `study_events`, `user_achievements`, `usage_counters` | Usage counters back AI quotas/rate limits |

## Privacy (LGPD)

Every learner table has `onDelete: Cascade` from `users`: deleting an account deletes all of the
learner's data (covered by `src/server/db.int.test.ts`). Audio is not stored by default.

## Workflow

```bash
npm run db:local -- init     # once: local cluster on :54329 with jpf_dev and jpf_test
npm run db:migrate           # create/apply a migration in development + regenerate the client
npm run db:deploy            # apply migrations (CI / production)
```

Integration tests run against `TEST_DATABASE_URL`; a global setup applies migrations first and
each test truncates the tables it needs.
