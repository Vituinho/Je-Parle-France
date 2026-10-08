import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  LLMUnavailableError,
  type GenerateObjectParams,
  type GenerateObjectResult,
  type LLMProvider,
} from "./types";

/**
 * Claude adapter. Uses structured outputs so every response is validated
 * against a Zod schema, adaptive thinking at an explicit effort, a cached
 * system prompt. Local Zod validation also enforces constraints the API format omits.
 */
export class AnthropicProvider implements LLMProvider {
  readonly id = "anthropic" as const;
  readonly simulated = false;
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
    options: { timeoutMs?: number; fetch?: typeof fetch } = {},
  ) {
    this.client = new Anthropic({
      apiKey,
      maxRetries: 0,
      timeout: options.timeoutMs ?? 30_000,
      fetch: options.fetch,
    });
  }

  async generateObject<T>(params: GenerateObjectParams<T>): Promise<GenerateObjectResult<T>> {
    try {
      const response = await this.client.messages.parse({
        model: this.model,
        max_tokens: params.maxTokens ?? 4000,
        system: [{ type: "text", text: params.system, cache_control: { type: "ephemeral" } }],
        messages: params.messages,
        output_config: {
          effort: params.effort ?? "low",
          format: zodOutputFormat(params.schema),
        },
      });
      if (response.stop_reason === "refusal") {
        throw new LLMUnavailableError("O tutor não pôde responder a esta mensagem.", "refusal");
      }
      const parsed = params.schema.safeParse(response.parsed_output);
      if (response.stop_reason === "max_tokens" || !parsed.success) {
        throw new LLMUnavailableError("Resposta inválida do tutor.", "invalid_output");
      }
      return {
        object: parsed.data,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        simulated: false,
        model: response.model,
      };
    } catch (error) {
      if (error instanceof LLMUnavailableError) throw error;
      if (error instanceof Anthropic.APIConnectionTimeoutError)
        throw new LLMUnavailableError("O tutor demorou a responder. Tente de novo.", "timeout");
      if (error instanceof z.ZodError || error instanceof SyntaxError)
        throw new LLMUnavailableError("Resposta inválida do tutor.", "invalid_output");
      if (error instanceof Anthropic.RateLimitError) {
        throw new LLMUnavailableError(
          "O tutor está ocupado. Tente de novo em instantes.",
          "rate_limited",
        );
      }
      if (error instanceof Anthropic.APIError) {
        throw new LLMUnavailableError("O tutor está indisponível no momento.", "unavailable");
      }
      // The SDK wraps JSON/Zod parsing failures in its base (non-HTTP) error.
      if (error instanceof Anthropic.AnthropicError)
        throw new LLMUnavailableError("Resposta inválida do tutor.", "invalid_output");
      throw new LLMUnavailableError("O tutor está indisponível no momento.", "unavailable");
    }
  }
}
