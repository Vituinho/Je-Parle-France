# Internal speech and writing calibration

The local kit collects comparisons for a later validation study. It makes no provider calls,
writes no learner database state and changes no production thresholds. It is not an exam or a
new public feature. Live provider authentication and human validity are separate checks.

Verified administrators can import this same private JSON kit at `/admin/piloto` for an in-memory
comparison, limited to 1 MB/200 records. The report groups speech agreement by fr-FR/fr-CA and
writing differences by the seven criteria; it returns no notes, reviewer identity or target text.
The private local kit remains the editable record, and importing it changes no production scoring.
The controlled pilot also supports selecting actual consented assessments and saving one
canonical human review per source in PostgreSQL. The current-version acceptance, ownership,
90-day source window and durable admin role are verified on each action; withdrawal deletes the
pilot reviews. Only an explicit selected view reads original writing from its existing attempt;
snapshots do not duplicate writing/excerpts/transcripts/audio. Course writing without a reviewed
rubric remains unassessed; current real AI writing rubrics are in placement. See
[PILOT.md](PILOT.md) for the operational workflow and period report. The older in-memory kit import
remains available and does not persist rows.

```sh
npm run calibration -- init
npm run calibration -- check .data/calibration/records.json
```

`init` creates three pending records in Git-ignored `.data/calibration/records.json` and refuses
to overwrite an existing file. Copy the template for each study batch. `check` validates a strict
versioned schema and returns anonymous sample IDs, pending/compared status, speech disagreement
flags and writing criterion deltas. It prints no targets, feedback, reviewer identity or notes.
An unfilled template reports zero comparisons; this is not a calibrated result. Input is capped
at 200 samples/1 MB. Schema/JSON failures exit `1` without echoing potentially private data.

## Collect a small pilot

1. Record the deployed commit, model/version, region, date and applicable rubric version in a
   private study note. Use synthetic samples first, then explicitly consented adult volunteers.
   Pseudonymize sample/reviewer IDs; put no names, emails, keys, raw audio or private transcripts
   in the JSON. Store any necessary consented source material separately with restricted access
   and an agreed deletion date. Local ignored files are not encrypted storage.
2. Cover both `fr-FR` and `fr-CA`, several proficiency levels, accents and recording conditions.
   Include clear, hesitant, incomplete and difficult-to-understand samples. Do not select only
   high scores. Avoid interpreting an accent difference as a communication failure.
3. Have two competent French assessors judge independently, before seeing system scores. Resolve
   disagreement in a separate review and preserve both original records with different sample
   IDs if needed. Record whether each sample is synthetic or a consented volunteer.
4. Collect system feedback in the staging app. Use `/conta` export for your dedicated test account
   to inspect `speechAttempts` and placement `writingAssessment`; copy only the fields needed
   below into the kit. Speech provider metrics are at `speechAttempts[].scores.scores`; record
   locale from the stored attempt for new assessments; old `locale=null` remains unknown and
   must not be guessed. Copy the
   actual system interpretation from the UI. Do not commit the full export. Never manufacture a system assessment
   when the provider is missing, simulated or failed.

## Speech fields and anchors

Record locale, authored target/activity ID, Azure `providerScores` (accuracy, fluency,
completeness, overall, unsupported prosody `null`), the actual `systemInterpretation`, human
pronunciation/intelligibility bands, agreement with the feedback and notes. The template uses a
generic cafe sentence; replace the activity ID/target when reviewing a real authored activity.

Human bands: **0** unusable/no intelligible evidence; **1** frequent breakdowns; **2** understandable
with substantial effort; **3** generally clear with occasional difficulty; **4** consistently clear
for the task. Assess intelligibility separately from accent similarity. These ordinal judgments
are not percentages: the tool flags qualitative disagreement and does not subtract them from
Azure's 0–100 metrics or label them as CEFR speaking levels.

The application never stores raw pilot audio. The admin speech workflow requires an attestation
that the reviewer actually heard the same sample with separate explicit permission. Without a
consented live review or separately authorized temporary sample, leave it pending; a transcript
cannot establish pronunciation. Delete separately held source material on the agreed schedule.
Saving the app review again replaces its prior rating; independent two-rater studies require
separate anonymous kit records and must not treat repeated app saves as two observations.

## Writing fields and anchors

The template copies the actual `pw-a2-ow-q` rubric, including expected CEFR and authored task
requirements. For another task copy that task's complete rubric. Record the actual model ID,
seven `modelScores`, stored `systemScore` (0–1 or `null`), stored `systemConfidence`, seven human
scores and explanatory notes. `modelScores` means the persisted criterion bands **after local
validation and length capping**; the application does not retain raw provider JSON. Do not
describe these as untouched model judgments.

Both judges use the production rubric anchors at the target level: **0** no evidence; **1** mostly
fragmented/unsuccessful; **2** partly achieved; **3** adequate for this level; **4** secure for this
level. Criteria: task completion, comprehensibility, grammar, vocabulary, cohesion, orthography
and CEFR appropriateness. Accept French/Quebec variants and prioritize understandable communication.
Support every nonzero judgment with exact excerpts in the separately controlled source review.

The tool reports `modelMinusHuman` for each criterion and highlights absolute gaps of two or more
bands for discussion. That flag is an internal review heuristic, not a grading threshold or proof
that either judge is correct. Missing model or human scores keep a record pending.

## Review without overfitting

Discuss specific disagreements, missing capabilities and false corrections. Group findings by
locale, task, proficiency and input conditions; record inter-rater agreement and inspect both
over- and under-scoring. A small pilot finds problems but cannot validate a CEFR classifier.
Do not change production weights, promotion gates or pronunciation cutoffs from a handful of
samples. Any later calibration change needs a diverse consented dataset, an independent held-out
set, explicit pedagogical review, versioned evidence and regression tests. Keep B1.2 out of this
staging work.
