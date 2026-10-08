# Content guidelines

Rules for writing course content. Content is code: typed with Zod schemas
(`src/lib/content/schema.ts`), validated by `npm run content:check` and the unit tests, and
reviewed like any other change.

## Where things live

| What | Where |
| --- | --- |
| Concepts | `content/concepts/<level or track>.ts` |
| Lessons | `content/curriculum/<path>/unit-*.ts`, assembled in each `index.ts` |
| Placement items | `content/placement/*.ts` |
| Tutor scenarios | `content/scenarios.ts` |
| Shared helpers | `content/_kit.ts` (`t()` for targets, `say.*` for instructions) |

Everything is assembled in `content/index.ts`. Components never contain course text.

## Identifiers

- Concepts: `lex:`, `gram:`, `pron:`, `cult:` + kebab-case (`lex:un-quatre-et-demi`). Ids are
  permanent: memory traces reference them. Rename only with a data migration.
- When the same French form means different things by region, create **two concepts** with a
  region suffix (`lex:le-diner-qc`, `lex:le-diner-fr`) and say the region in `meaning`.
- Lessons and activities: `<unit>-l<n>`, `<lesson>-t<n>` (teaching cards), `<lesson>-a<n>`.

## Concepts

- `meaning` is contextual Brazilian Portuguese, short, and unique across concepts (it is used as
  the answer and as distractors in reviews).
- `forms` lists every written form accepted when the learner must produce the concept (gender
  variants, with and without the article, regional alternatives).
- `region`: `fr-CA` or `fr-FR` only for usage that is specific to one side; it also selects the
  review voice.
- Add a `brazil` note or `falseFriend` whenever Portuguese predicts the wrong thing (*je besoin*,
  *préfecture* ≠ prefeitura, *correspondance* ≠ correspondência).
- IPA follows standard Parisian French; Québec differences go in notes.

## Lessons

The content tests enforce:

- 5–14 steps, at least one teaching card and at least one production activity (type, fill,
  order, dictation, speak, error correction, open writing);
- every target concept is taught before it is practised (core path; tracks within the track);
- options are unique inside a question.

Write by the pattern *teach → recognise → produce*: one idea per teaching card; diagnostic
distractors with `optionFeedback` that explain the specific misconception; listening lines with
the right `region` and speaker `gender`; a `context` gloss for words above the learner's level
that are needed to answer.

Targets carry **weights**: 1 when the activity really evidences the concept × dimension, 0.5 for
partial evidence (a word that is present but not the point). Weights below 0.5 never schedule.

## Accuracy

- **Language**: write natural French a native speaker would say in that situation and region.
  Prefer what is common over what is textbook-correct but rare.
- **Administrative and legal facts** (immigration, banking, housing, health) must be current and
  general. State rules only when they are stable (e.g. the Québec lease form, the July 1 moving
  day, the cap on French deposits), keep them out of graded answers, and add a note pointing to
  official sources. The course teaches the language of the procedure, never the procedure itself
  as advice.
- Use fictional names, addresses and phone numbers (555 numbers in North America).
- Never claim an internal score equals an official exam result.

## Sources and rights

- Write original content. Do not copy from paid courses, textbooks or exam materials.
- Authentic media is **linked or embedded through official players only**
  (`authentic` entries with `rights: "link" | "official-embed"`); nothing is re-hosted.
- Audio is synthesised (Azure neural voices or the browser) unless a recording is licensed for
  the project.

## Checklist for a new unit

1. Concepts added, with meanings, forms, examples and notes.
2. Lessons pass `npm run content:check` with **0 errors and 0 warnings**.
3. `npm test` passes (content tests and the review generator test, which builds and grades a
   review exercise for every concept × dimension).
4. A mission scenario, if the unit has one, lists its key concepts.
5. Docs: update the content table in [CURRICULUM.md](CURRICULUM.md) and the roadmap.
