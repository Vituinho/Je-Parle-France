import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AzureSpeechProvider } from "./azure";
import { encodeWav } from "@/components/activities/wav";

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
  let wav: ArrayBuffer;
  beforeAll(async () => {
    wav = await encodeWav(new Float32Array(1600), 16_000).arrayBuffer();
  });

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
      NBest: [
        {
          Display: "Oui.",
          AccuracyScore: 90,
          FluencyScore: 90,
          CompletenessScore: 100,
          PronScore: 90,
          ProsodyScore: 70,
          Words: [],
        },
      ],
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
  it("classifies provider rate limiting without a retry", async () => {
    const fetchMock = stubFetch({ secret: "private output" }, { ok: false, status: 429 });
    await expect(provider.transcribe(wav, "fr-FR")).rejects.toMatchObject({
      reason: "rate_limited",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("rejects missing credentials before sending audio", () => {
    const fetchMock = stubFetch({});
    expect(() => new AzureSpeechProvider("", "canadacentral")).toThrow(
      "credentials not configured",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["fr-FR", "fr-CA"] as const)(
    "transcribes %s without fabricated metrics",
    async (locale) => {
      const fetchMock = stubFetch({ RecognitionStatus: "Success", DisplayText: "Bonjour." });
      expect(await provider.transcribe(wav, locale)).toEqual({
        status: "ok",
        transcript: "Bonjour.",
      });
      expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toContain(`language=${locale}`);
      await expect(provider.assess(wav, "Bonjour.", locale)).rejects.toMatchObject({
        reason: "invalid_output",
      });
    },
  );

  it.each([{}, { RecognitionStatus: "Success", NBest: [{ AccuracyScore: 101 }] }])(
    "rejects malformed provider output",
    async (body) => {
      stubFetch(body);
      await expect(provider.assess(wav, "Bonjour.", "fr-FR")).rejects.toMatchObject({
        reason: "invalid_output",
      });
    },
  );

  it("rejects malformed audio and unsupported locales before a paid request", async () => {
    const fetchMock = stubFetch({});
    await expect(provider.transcribe(new ArrayBuffer(16), "fr-FR")).rejects.toMatchObject({
      reason: "malformed_audio",
    });
    await expect(provider.transcribe(wav, "en-US" as "fr-FR")).rejects.toMatchObject({
      reason: "unsupported",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bounds a hanging provider request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      ),
    );
    await expect(
      new AzureSpeechProvider("key", "canadacentral", 10).transcribe(wav, "fr-FR"),
    ).rejects.toMatchObject({ reason: "timeout" });
  });

  it("does not leak network error details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("secret response body")));
    await expect(provider.transcribe(wav, "fr-FR")).rejects.toThrow("Speech service unavailable.");
  });
});
