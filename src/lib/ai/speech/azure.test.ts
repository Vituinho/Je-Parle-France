import { afterEach, describe, expect, it, vi } from "vitest";
import { AzureSpeechProvider } from "./azure";

afterEach(() => vi.unstubAllGlobals());

function stubFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const fetchMock = vi.fn(async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
    arrayBuffer: async () => new ArrayBuffer(8),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Azure speech adapter", () => {
  const provider = new AzureSpeechProvider("key", "canadacentral");
  const wav = new ArrayBuffer(16);

  it("requests word-level pronunciation assessment and parses scores", async () => {
    const fetchMock = stubFetch({
      RecognitionStatus: "Success",
      DisplayText: "Bonjour.",
      NBest: [
        {
          Display: "Bonjour.",
          AccuracyScore: 82,
          FluencyScore: 90,
          CompletenessScore: 100,
          PronScore: 87.5,
          Words: [{ Word: "bonjour", AccuracyScore: 82, ErrorType: "Mispronunciation" }],
        },
      ],
    });
    const result = await provider.assess(wav, "Bonjour.", "fr-CA");
    expect(result).toMatchObject({
      status: "ok",
      transcript: "Bonjour.",
      granularity: "word",
      scores: { accuracy: 82, fluency: 90, completeness: 100, prosody: null, overall: 87.5 },
      words: [{ word: "bonjour", accuracy: 82, error: "mispronunciation" }],
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toContain("canadacentral.stt.speech.microsoft.com");
    expect(url).toContain("language=fr-CA");
    const params = JSON.parse(
      Buffer.from(init.headers["Pronunciation-Assessment"]!, "base64").toString("utf8"),
    );
    expect(params).toMatchObject({
      ReferenceText: "Bonjour.",
      Granularity: "Word",
      GradingSystem: "HundredMark",
    });
    // Prosody is en-US only (and billed as an add-on): never requested for French.
    expect(params).not.toHaveProperty("EnableProsodyAssessment");
  });

  it("declares per-locale capabilities instead of assuming parity", () => {
    for (const locale of ["fr-FR", "fr-CA"] as const) {
      expect(provider.features(locale)).toMatchObject({
        overall: true,
        wordAccuracy: true,
        phonemeAccuracy: true,
        phonemeNames: false,
        spokenPhonemeAlternatives: false,
        syllables: false,
        prosody: false,
      });
    }
  });

  it("ignores a prosody score the locale does not support", async () => {
    stubFetch({
      RecognitionStatus: "Success",
      NBest: [{ Display: "Oui.", AccuracyScore: 90, PronScore: 90, ProsodyScore: 70, Words: [] }],
    });
    const result = await provider.assess(wav, "Oui.", "fr-FR");
    expect(result.scores?.prosody).toBeNull();
  });

  it("reports silence instead of inventing a transcript", async () => {
    stubFetch({ RecognitionStatus: "InitialSilenceTimeout" });
    expect(await provider.assess(wav, "Bonjour.", "fr-FR")).toMatchObject({
      status: "no_speech",
      transcript: null,
      scores: null,
    });
  });

  it("escapes SSML and picks a regional voice", async () => {
    const fetchMock = stubFetch({});
    await provider.synthesize({
      text: "Tom & Jerry <3",
      locale: "fr-CA",
      gender: "m",
      rate: "slow",
    });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, { body: string }];
    expect(init.body).toContain("fr-CA-AntoineNeural");
    expect(init.body).toContain("Tom &amp; Jerry &lt;3");
    expect(init.body).toContain('rate="-25%"');
  });

  it("throws on HTTP errors", async () => {
    stubFetch({}, { ok: false, status: 401 });
    await expect(provider.transcribe(wav, "fr-FR")).rejects.toThrow("401");
  });
});
