# Pronunciation

Continuous production estimates accept only learner-owned, persisted, non-simulated speech
assessments. Reusing the same assessment cannot create fresh skill evidence. Minimal pairs feed
listening; scripted readings do not establish broad speaking ability. A perception placement score
is labelled separately and never becomes a production prior. Deleting private speech assessments
also deletes derived skill evidence. See `SKILL-ESTIMATION.md` for stability and confidence gates.

## Approach

Perception before production. Research on second-language phonology (e.g. high-variability
phonetic training) shows that learners who cannot _hear_ a contrast rarely produce it reliably, so
every target starts with discrimination drills and only then moves to speaking.

Targets are `pronunciation` concepts in `content/concepts/` with IPA, articulation steps in
Portuguese, a Brazilian-specific note, examples and minimal pairs. A0 covers the four contrasts that
cause the most trouble for Brazilian speakers:

| Target                  | Why it is hard                                                                              | Pairs                                      |
| ----------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `/y/` vs `/u/`          | Portuguese has no `/y/`; _tu_ is heard as _tout_                                            | tu/tout, rue/roue, vu/vous, dessus/dessous |
| Silent final consonants | Portuguese pronounces (and adds a vowel to) final consonants                                | petit/petite, grand/grande                 |
| Nasal vowels            | Similar in Portuguese, but French adds no final _n_ and denasalises before a pronounced _n_ | bon/bonne, vin/vent, vent/vont             |
| French R                | The Portuguese tap appears between vowels and after consonants                              | — (example words)                          |

## What is measured, and how honestly

| Dimension                    | Activity                                  | Evidence                                                                                                                                                                        |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listening` (perception)     | Minimal pairs, "which word did you hear?" | Deterministic, objective                                                                                                                                                        |
| `pronunciation` (production) | Repeat / read aloud                       | With a provider: Azure overall score + word-level accuracy + intelligibility. Without: self-rating (weaker evidence — it moves the schedule but never counts toward "mastered") |

Word feedback uses the red-pen convention: wavy underline = needs attention, highlighter = almost,
struck-through = word not said.

### What Azure measures for French (checked 2026-10-08)

Sources: Microsoft Learn — [How to use pronunciation assessment](https://learn.microsoft.com/azure/ai-services/speech-service/how-to-pronunciation-assessment)
("Supported features per locale", updated 2026-07), [Language support → Pronunciation
assessment](https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=pronunciation-assessment),
[REST API for short audio](https://learn.microsoft.com/azure/ai-services/speech-service/rest-speech-to-text-short).

| Output                                                           | `fr-FR`                             | `fr-CA` | Used by the product                                  |
| ---------------------------------------------------------------- | ----------------------------------- | ------- | ---------------------------------------------------- |
| Scripted assessment (reference text)                             | yes                                 | yes     | yes                                                  |
| Overall score (`PronScore`)                                      | yes                                 | yes     | yes — the number shown, and the evidence for mastery |
| Accuracy (full text)                                             | yes                                 | yes     | stored                                               |
| Fluency (full text)                                              | yes                                 | yes     | stored                                               |
| Completeness                                                     | yes                                 | yes     | stored                                               |
| Word accuracy + miscue (omission / insertion / mispronunciation) | yes                                 | yes     | yes — red-pen word marks                             |
| Phoneme accuracy **scores**                                      | yes                                 | yes     | no — see below                                       |
| Phoneme **names** (IPA / SAPI)                                   | no (IPA: en-US; SAPI: en-US, zh-CN) | no      | —                                                    |
| N-best spoken phonemes ("you said /ə/ instead of /ɛ/")           | no (en-US only)                     | no      | —                                                    |
| Syllable groups                                                  | no (en-US only)                     | no      | —                                                    |
| Prosody (stress, intonation, rhythm)                             | **no** (en-US only)                 | no      | —                                                    |
| Content (vocabulary, grammar, topic; unscripted)                 | no (en-US only)                     | no      | —                                                    |

Notes:

- An earlier version of this document said "no phoneme data for French". That was too broad:
  Azure _does_ return per-phoneme accuracy scores for French, just without phoneme labels. A list of
  unlabelled numbers cannot tell a learner which sound to fix (and aligning them to letters would be
  guesswork in a language with this much silent spelling), so the product requests `Word`
  granularity and says so in the UI.
- Prosody: Microsoft's current documentation states twice that "Prosody assessment is only available
  in the en-US locale". It is also a paid add-on. We do not request it for French. The adapter
  parses `ProsodyScore` and the UI shows "Entonação e ritmo" only when the locale's capability
  says prosody is supported, so enabling it later is a one-line change in
  `AZURE_PRONUNCIATION_FEATURES` (`src/lib/ai/speech/azure.ts`).
- `fr-FR` and `fr-CA` currently have identical capabilities. They are still declared separately:
  the provider exposes `features(locale)` and callers never assume locales are equal.

## Where it appears

- Inside lessons (A0 unit "Os sons do francês" and speaking steps everywhere).
- The **Pronunciation Lab** (`/pronuncia`): one page per target with articulation, examples,
  minimal pairs, an 8-round perception drill and a 3-round production drill (varied exercises per
  round). Drills update memory traces like any practice.
- The daily planner schedules a pronunciation focus block when pronunciation targets are weak.

## Shadowing

`/pronuncia/sombra` trains connected speech — rhythm, linking (_liaison_, _enchaînement_) and
intonation — which single-word drills do not reach. Lines come from the listening dialogues of
lessons the learner has studied (or the first dialogues at their level), 3–16 words long, in the
voice of their destination first. For each line the learner can listen (normal or slow), hide the
text, record on their own or **speak along** with the voice (with headphones), and compare their
recording with the model. With a pronunciation provider the recording can also be scored at word
level; otherwise it stays practice, never a score. Time spent counts as study and speaking time.

## Provider readiness and live smoke test

Azure calls have a 20-second deadline including response decoding, no automatic paid retries,
and validated JSON with scores in 0–100. Missing metrics are rejected, never replaced with zero.
The upload must be an actual WAV container: PCM16, mono, 16 kHz, nonempty, at most 37 seconds
and 1,200,000 bytes. Invalid recordings receive HTTP 400 before consuming quota or contacting Azure.
Network failures, bad output and timeouts return a retryable service error without upstream details.
Unit tests cover both locales, HTTP failures, network failure, timeout, invalid audio/output and
unsupported locale/prosody handling. Raw audio is neither logged nor stored.

Set `SPEECH_PROVIDER=azure`, `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` in the server environment
for the application. For the standalone smoke command only the two Azure variables are required.
Use two recordings of the same reference phrase (one per locale):

```sh
npm run smoke:speech -- /private/fr-FR.wav /private/fr-CA.wav "Bonjour, je voudrais un café, s’il vous plaît."
```

This uses the application adapter for four paid calls (STT and scripted assessment per locale),
prints statuses only, validates unsupported prosody stays absent and rejects malformed audio locally.
It exits unsuccessfully if credentials, files, recognition or required metrics are missing.
Failure/timeout tests use injected responses, not intentional paid failures. **Live validation has
not run: Azure credentials were absent on 2026-10-08.** Browser TTS and explicit self-rating remain
available without Azure; they never become objective pronunciation evidence.

## Planned

More targets (`/ø/` and `/œ/`, schwa, liaison and enchaînement, intonation), Québec-specific
features (affrication _tu → tsu_, diphthongised long vowels) as _recognition_ targets, varied
voices for perception training, shadowing with prosody comparison.
