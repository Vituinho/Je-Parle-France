import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AnthropicProvider } from "./anthropic";

const schema = z.object({
  reply: z.string().min(1).max(20),
  corrections: z.array(z.string()).max(3),
});
const params = {
  purpose: "tutor_turn" as const,
  schema,
  system: "Teach French.",
  messages: [{ role: "user" as const, content: "Bonjour" }],
  maxTokens: 100,
};
const message = (object: unknown, stop_reason = "end_turn") => ({
  id: "msg_test",
  type: "message",
  role: "assistant",
  model: "test-model",
  stop_reason,
  stop_sequence: null,
  content: [{ type: "text", text: JSON.stringify(object) }],
  usage: { input_tokens: 10, output_tokens: 5 },
});

describe("Anthropic application adapter", () => {
  it("uses stable structured output and validates locally, reporting real token usage", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(message({ reply: "Bonjour !", corrections: [] })));
    const provider = new AnthropicProvider("private-key", "test-model", { fetch: fetchMock });
    expect(await provider.generateObject(params)).toMatchObject({
      object: { reply: "Bonjour !" },
      simulated: false,
      usage: { inputTokens: 10, outputTokens: 5 },
    });
    const init = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      max_tokens: 100,
      output_config: { effort: "low", format: { type: "json_schema" } },
    });
    expect(body).not.toHaveProperty("fallbacks");
  });

  it.each([
    { reply: "This output exceeds the application's maximum", corrections: [] },
    { reply: "Oui", corrections: ["a", "b", "c", "d"] },
    { reply: 3, corrections: [] },
  ])("rejects invalid constrained output without saving it", async (object) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(message(object)));
    await expect(
      new AnthropicProvider("key", "test-model", { fetch: fetchMock }).generateObject(params),
    ).rejects.toMatchObject({ reason: "invalid_output" });
  });

  it.each([
    [429, "rate_limited"],
    [401, "unavailable"],
    [500, "unavailable"],
  ])("handles HTTP %s once without leaking provider details", async (status, reason) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json(
          { error: { type: "api_error", message: "private details" } },
          { status: Number(status) },
        ),
      );
    await expect(
      new AnthropicProvider("key", "test-model", { fetch: fetchMock }).generateObject(params),
    ).rejects.toMatchObject({ reason });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("classifies the SDK timeout gracefully", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Anthropic.APIConnectionTimeoutError());
    await expect(
      new AnthropicProvider("key", "test-model", {
        fetch: fetchMock,
        timeoutMs: 10,
      }).generateObject(params),
    ).rejects.toMatchObject({ reason: "timeout" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("aborts an actual hanging fetch through the SDK deadline", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    await expect(
      new AnthropicProvider("key", "test-model", {
        fetch: fetchMock,
        timeoutMs: 10,
      }).generateObject(params),
    ).rejects.toMatchObject({ reason: "timeout" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each([
    ["refusal", "refusal"],
    ["max_tokens", "invalid_output"],
  ])("does not accept %s as a complete answer", async (stopReason, reason) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(message({ reply: "Oui", corrections: [] }, stopReason)));
    await expect(
      new AnthropicProvider("key", "test-model", { fetch: fetchMock }).generateObject(params),
    ).rejects.toMatchObject({ reason });
  });
});
