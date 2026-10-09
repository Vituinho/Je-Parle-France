# Manual provider validation

Live calls are opt-in and never part of CI or `npm test`. Neither provider had local credentials
at the staging audit on 2026-10-09; no live success is claimed. The app defaults to labelled mocks.
Selecting a real provider without its credentials fails environment validation.

## Offline failure checks (no API cost)

```sh
npm test -- --project=unit src/lib/ai/speech/audio.test.ts src/lib/ai/speech/azure.test.ts src/lib/ai/llm/anthropic.test.ts src/lib/learning/tutor/tutor.test.ts
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

5. Expect a local preflight record followed by one JSON record per locale: `stt: "ok"`,
   `pronunciation: "ok"`, `metricsPresent: true`, `unsupportedProsodyAbsent: true`, `passed: true`.
   Exit `0` means both locales passed STT and scripted assessment. Silence, provider failure or
   incomplete scores produce exit `1`; this is a failed smoke, not a passing fallback.

French assessment requests word granularity: overall, accuracy, fluency, completeness and word
scores. Prosody, named phonemes, spoken-phoneme alternatives and syllable groups are not claimed.
The returned capability map documents what this adapter requests and exposes; it is not a live
discovery API. Raw scores require human calibration before claims about proficiency.

For the deployed app also set `SPEECH_PROVIDER=azure`, redeploy and test `/pronuncia`, TTS and
an assessed recording in each locale. The CLI bypasses app quotas but is bounded to four calls;
do not run it on a loop. Delete volunteer fixture audio according to the agreed retention period.

## Anthropic: one bounded paid call

Set `ANTHROPIC_API_KEY` and explicitly choose `LLM_MODEL` with access to structured output and
the configured effort levels. The current default is `claude-opus-5-5`; verify access in your
account. [Anthropic structured output](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

```sh
npm run smoke:tutor
```

This constructs the application tutor prompt for a synthetic A2 Quebec learner with known/weak
vocabulary, a correction preference and one generic request. It makes one call with an 800-token
output budget, validates the tutor schema through the SDK and local Zod constraints, and prints
only provider/model, synthetic scenario, validation status and token counts. Exit `0` with
`passed: true` and `structuredOutputValid: true` proves that call authenticated and parsed.
Invalid JSON, schema violations, refusal, truncation, timeout, rate limiting and unavailable
service yield exit `1`. Offline fixtures cover those failures; do not deliberately buy failing
live calls. First-time schema preparation may exceed the bounded deadline: investigate and
rerun manually rather than enabling automatic retries or silently substituting a mock.

For the app set `LLM_PROVIDER=anthropic`, configure conservative per-learner tutor/writing quotas,
redeploy, and check a tutor turn, its report and an authored writing rubric. The CLI bypasses
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
