# Manual provider validation

Live calls are opt-in and never part of CI or `npm test`. Neither provider had local credentials
at the staging audit on 2026-10-09 or the local/Railway checks on 2026-10-10; no live success is
claimed. Status: **READY FOR LIVE VALIDATION**, not **LIVE VALIDATED**. The app defaults to labelled mocks.
Selecting a real provider without its credentials fails environment validation.
See [PILOT.md](PILOT.md) for independent flags, quotas, consent, current Railway configuration
and exact operator steps. No paid smoke is run by CI or the maintenance cron.

## Offline failure checks (no API cost)

```sh
npm test -- --project=unit src/lib/ai/speech/audio.test.ts src/lib/ai/speech/azure.test.ts src/lib/ai/llm/anthropic.test.ts src/lib/learning/tutor/tutor.test.ts
npm test -- --project=unit scripts/provider-smoke.test.ts
```

Injected HTTP responses exercise authentication failures, rate limits, malformed output and
deadlines (20 seconds for Azure; 30 seconds for Anthropic, with no automatic retries). The
Anthropic deadline test aborts a hanging fetch through the real SDK. These are adapter tests,
not evidence of live service availability. Missing-credential smoke commands exit `1` before
network access. Azure also rejects malformed WAV and unsupported locales locally.

## Azure Speech: four bounded paid calls

1. Create an Azure Speech resource. Obtain its key and canonical region identifier, then set
   `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` in the local environment. The adapter constructs
   the regional endpoint; do not put an endpoint URL in the region field.
2. Put two non-sensitive recordings in `.data/provider-fixtures/`, which Git ignores. Use an
   adult volunteer reading a generic authored sentence with consent; do not reuse learner audio.
   Record WAV PCM16, mono, 16 kHz, at most 30 seconds (prefer 2–10 seconds). For this REST path,
   longer scripted assessments require a different API and are rejected.
   [Microsoft assessment limits](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment).
3. Both files must read the same reference sentence. The default is
   `Bonjour, je voudrais un café, s’il vous plaît.` Use matching France/Quebec fixture readings.
4. Run explicitly:

   ```sh
   npm run smoke:speech -- .data/provider-fixtures/fr-FR.wav .data/provider-fixtures/fr-CA.wav
   ```

   An optional third argument supplies the authored reference text. Never put private text in
   shell arguments. Both files are validated before the first paid call.

5. Expect a local preflight record followed by JSON per **operation and locale**: provider,
   locale, operation, case, adapter capabilities, `requestSuccess`, recognition status,
   latency, returned metric names, warnings and `passed`. No transcript/target/audio is printed.
   Exit `0` in the normal speech case means both locales passed STT and scripted assessment.
   The CLI stops on the first failure, so four is a maximum, not a guaranteed call count.
   Silence/error in that normal case is not a passing fallback.

Separate fixture cases explicitly validate rejection/recognition behaviour:

```sh
npm run smoke:speech -- .data/provider-fixtures/fr-FR-silence.wav .data/provider-fixtures/fr-CA-silence.wav --case silence
npm run smoke:speech -- .data/provider-fixtures/fr-FR-short.wav .data/provider-fixtures/fr-CA-short.wav --case short
```

Silence expects no speech/not understood; short requires subsecond recordings and warns that
it does not validate assessment quality. Malformed audio is rejected in local preflight;
timeout, rate limit/provider errors, unavailable credentials and unsupported metrics are covered
by injected deterministic tests. Never invent a metric when capability/output is unavailable.

French assessment requests word granularity: overall, accuracy, fluency, completeness and word
scores. Prosody, named phonemes, spoken-phoneme alternatives and syllable groups are not claimed.
The returned capability map documents what this adapter requests and exposes; it is not a live
discovery API. Raw scores require human calibration before claims about proficiency.

For the deployed app also set `SPEECH_PROVIDER=azure`, redeploy and test `/pronuncia`, TTS and
an assessed recording in each locale. The CLI bypasses app quotas but is bounded to four calls;
do not run it on a loop. Delete volunteer fixture audio according to the agreed retention period.

## Anthropic: one scenario or up to five bounded paid calls

Set `ANTHROPIC_API_KEY` and explicitly choose `LLM_MODEL` with access to structured output and
the configured effort levels. The current default is `claude-opus-5-5`; verify access in your
account. [Anthropic structured output](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

```sh
npm run smoke:tutor
npm run smoke:tutor -- --case writing
npm run smoke:tutor -- --suite
```

The default constructs the application tutor prompt for a synthetic intermediate B1 learner.
`--case beginner|intermediate|correction|roleplay|writing` selects one scenario; `--suite` runs
all five and stops immediately at the first failure. Writing uses an existing placement rubric;
roleplay uses a generic cafe. No actual learner record/name/history is used. Context is bounded
at 12,000 serialized characters; output budgets are 1,000 tutor tokens or 2,200 writing tokens.
SDK and local Zod validation check the result. JSON prints provider/model, case, validation,
latency and returned usage units (unknown stays null), without model replies/prompts. Exit `0`
with `passed: true` and `structuredOutputValid: true` proves that bounded call authenticated
and parsed; it does not establish educational validity or currency cost.
Invalid JSON, schema violations, refusal, truncation, timeout, rate limiting and unavailable
service yield exit `1`. Offline fixtures cover those failures; do not deliberately buy failing
live calls. First-time schema preparation may exceed the bounded deadline: investigate and
rerun manually rather than enabling automatic retries or silently substituting a mock.

For the app set `LLM_PROVIDER=anthropic`, configure conservative per-learner tutor/writing quotas,
redeploy, and check a tutor turn, its report and an authored placement writing rubric. Course
writing without a reviewed rubric remains unassessed. The CLI bypasses
those quotas. Live writing quality and educational usefulness still require human review.

## Safe diagnostics

Production failures emit a small structured `provider_failure` event containing only provider,
operation and reason. Reasons distinguish unavailable, timeout, rate-limited, invalid output,
unsupported capability and refusal. A credential/HTTP failure is unavailable; inspect the
resource settings rather than logging headers or response bodies. Local malformed WAV is a
caller input error and does not generate a remote-provider failure event.

No API keys, audio, prompts, transcripts, conversation text or learner IDs are logged by these
diagnostics or smokes. Do not enable vendor debug logging or paste raw failed responses into
Railway logs. Record only redacted smoke output, deployment commit, date, model/resource region
and locale in the staging validation record. Never commit local recordings or private exports.
