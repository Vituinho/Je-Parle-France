# AI and speech

All external AI goes through interfaces in `src/lib/ai/` (ADR-004). Business logic never imports a
vendor SDK.

| Interface                                | Adapter                                                        | Without configuration                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `LLMProvider` (`lib/ai/llm`)             | `AnthropicProvider` (Claude)                                   | `MockProvider` — scripted replies, rule-based corrections, heuristic report, **labelled "simulado"** in the UI |
| `TextToSpeechProvider` (`lib/ai/speech`) | Azure neural voices (fr-FR Denise/Henri, fr-CA Sylvie/Antoine) | Browser `speechSynthesis` with the best installed French voice; one notice per screen if none                  |
| `SpeechToTextProvider`                   | Azure short-audio REST (`/api/speech/transcribe`)              | Not available — no transcript is ever invented; the mic is not offered                                         |
| `PronunciationAssessmentProvider`        | Azure pronunciation assessment (word granularity)              | Self-rating against the model recording                                                                        |

There is intentionally **no speech mock in the product path**: a fake score would become fake
evidence about the learner. Mocks for speech exist only in tests (`azure.test.ts` stubs `fetch`).

## Configuration

```env
LLM_PROVIDER=anthropic          # or mock
ANTHROPIC_API_KEY=...
LLM_MODEL=                      # default claude-opus-5-5; a smaller model costs less
TUTOR_DAILY_TURNS=80            # per learner per day
TUTOR_DAILY_REPORTS=10

SPEECH_PROVIDER=azure           # or mock (= not configured)
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=canadacentral
```

Secrets are read only on the server (`src/lib/env.ts`). The browser learns three booleans
(`serverTts`, `pronunciation`, `speechRecognition`) through `publicCapabilities()`.

## Tutor

- **One structured call per learner message** (`tutorTurnSchema`: `reply` + `corrections`),
  validated by Zod via structured outputs, at `effort: "low"` — conversation does not need deep
  reasoning, and short replies keep latency down.
- **Report** at the end (`tutorReportSchema`) at `effort: "medium"`, fed with the transcript and
  the corrections already collected (no re-analysis of every turn).
- **Deterministic detectors first** (`lib/learning/errors/patterns.ts`): the most frequent
  Brazilian errors (_je besoin_, _je suis 25 ans_, missing elision, _à le_) are caught by rules and
  merged with the model's corrections — free, explainable, never hallucinated.
- **Correction modes**: `immediate` (all), `important_only` (meaning/core structure), `no_interruptions`
  and `report_only` (nothing during the chat). The model also recasts the correct form in its
  reply only in the first two modes.
- **Context**: level and description, destination (Québec vs France register), words the learner
  already knows (familiar+), items they struggle with, recent personal mistakes — all from real
  mastery data.
- **Review integration**: important corrections become `PersonalItem`s with failed FSRS traces
  (`personal:<id>` × recognition/writing), so they come back in reviews as error-correction and
  choose-the-right-form exercises.
- **Mastery integration**: each deterministic detector names the course concepts it is evidence
  against (_je suis 25 ans_ → `gram:age-avoir`). On every turn, a detected error records a failed
  review of that concept on the dimension used — writing, or speaking for a spoken turn — but only
  for concepts the learner has already met, so the course concept itself comes back in reviews.
  Model-generated corrections carry no concept id and never touch course mastery.
- **Cost controls**: daily per-learner quotas (`usage_counters`), a 1.5 s throttle, 500-character
  messages, a cached system prompt, token usage recorded per day.
- **Safety**: validated structured output; a refusal or provider error
  shows a friendly message; the report degrades to the corrections already collected.
- **Privacy**: conversations are stored so the learner can reread them and can be deleted; their
  content is not logged.

### Real tutor readiness

The adapter uses the SDK's stable `messages.parse` / `zodOutputFormat` API, then validates the
result with the original Zod schema (including numeric bounds and array/string limits).
Calls have a 30-second SDK timeout and zero automatic retries to bound latency and paid calls.
Timeout, rate limit, refusal, truncation, invalid JSON/output and network failures become friendly
provider errors; failed turns are not saved and a failed report falls back to collected corrections.
Daily quotas and throttling still apply before provider calls; failed calls consume a quota slot.

Context reads at most 120 recent concept traces and eight personal corrections, selecting at most
60 known words and ten weaknesses. It sends only the latest 24 conversation turns, at most 1,200
characters each and 14,000 in total. Reports explicitly identify a truncated excerpt, with at most
eight already noted corrections. Full conversations remain stored locally for the learner.
Tutor reports are relative practice feedback, not objective CEFR or pronunciation measurements.

Configure the server with `LLM_PROVIDER=anthropic`, `ANTHROPIC_API_KEY` and a supported `LLM_MODEL`.
The standalone command requires only the key and an explicit model:

```sh
npm run smoke:tutor
```

It makes one paid adapter call using synthetic A2/Québec context, checks the structured result and
prints only status and token usage. **Live validation has not run: the Anthropic key was absent on
2026-10-08.** `LLM_PROVIDER=mock` continues to show the simulation label. Adapter tests inject HTTP
responses through the real SDK, including 429/401/500, timeout, refusal and invalid constrained output.
Reference: [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

## Voice conversation

- **Speaking a turn** (when speech recognition is configured): the learner records up to 15 s,
  `/api/speech/transcribe` returns the transcript, and it goes into the message box. The learner
  sees exactly what was understood and can fix it before sending — the app never sends a
  transcript on its own. Audio is processed in memory and discarded; nothing is stored unless the
  learner sends the message.
- **Spoken turns are marked** (`[falado]`, see `SPOKEN_MARKER`) when sent to the model, and the
  system prompt tells it to ignore spelling, accents, punctuation and capitalisation in them: those
  come from the recogniser, not the learner. The marker is never stored or shown. A conversation
  with a spoken turn is recorded as `mode: voice`.
- **Hearing the tutor**: every reply has a play button (Azure neural voice in the scenario's
  region, or the browser's French voice), and learners can turn on automatic playback; that
  preference stays in their browser.
- Quotas: transcription shares the per-learner daily speech quota with pronunciation assessment.

## Speech

- `/api/tts` (GET, authenticated, ≤ 300 characters, daily quota) synthesises with Azure and keeps an
  in-memory clip cache; the client caches object URLs per visit. Persistent audio caching in object
  storage is planned.
- `/api/speech/assess` (POST multipart, authenticated, throttled, quota) receives 16 kHz mono WAV
  (converted in the browser from the recording, ≤ 15 s), returns word-level scores, and stores
  **scores only** in `speech_attempts`. Audio is processed in memory and discarded.
- Grading never trusts client-sent transcripts or scores: speaking answers reference a
  `speechAttemptId`, and the server reads transcript and score from its own record (≤ 30 min old,
  same learner). Score = ½ word recall + ½ pronunciation accuracy.
  The saved reference must also match the current exercise, and the provider result must be
  successful with a valid overall score. Self-ratings never score objective placement items.

Placement perception audio uses `/api/placement/audio` with attempt/item identifiers only;
the correct played word stays server-side. It requires a real speech provider. The tutor's
LLM capability enables only reviewed open-writing tasks with a matching expected-level rubric;
the mock never enables assessment. See [PLACEMENT.md](PLACEMENT.md).

## Structured writing engine

`lib/learning/writing/assessment.ts` uses seven ordinal criteria (0–4): task completion,
comprehensibility, grammar, vocabulary, cohesion, orthography and CEFR appropriateness. Every
nonzero judgment needs an exact excerpt from the original answer. Missing/out-of-range dimensions
or invented excerpts invalidate the judgment. The original text stays intact. Local word counting
only limits task completion for an undersized response. Communication and completion account for
half the aggregate, avoiding disproportionate penalties for ambitious grammar.

The semantic service uses the same real LLM adapter with an explicit versioned, expected-level
task rubric, maximum 2,000 input characters, 2,200 output tokens, daily quota
`WRITING_DAILY_ASSESSMENTS` (default 10) and throttling. It never calls the mock for assessment.
Confidence is capped at 0.65 and assessment quality at 0.5; confidence below 0.5, insufficient text,
missing provider and invalid/failing output remain ungraded. This is uncalibrated practice evidence,
not certification. At most three important corrections are selected; model corrections never
assign course concepts. Only important local detections with a known concept at or below the task
level can feed memory; quoted examples are excluded. The caller must persist the assessment with
the answer and must skip evidence when its score is null.

Placement activation is limited to the existing reviewed A2 and B1 tasks, with original answers
and evaluations persisted in placement responses and shown in the final report. Invalid or
low-confidence results remain unscored. Constrained practice stays deterministic; open writing
without a reviewed rubric remains ungraded.

## Planned

Streaming (full-duplex) voice conversation, shadowing with prosody comparison, additional
OpenAI/Google adapters, persistent TTS cache in object storage.
