import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import {
  LLMUnavailableError,
  type GenerateObjectParams,
  type GenerateObjectResult,
  type LLMProvider,
} from "./types";

/**
 * Claude adapter. Uses structured outputs so every response is validated
 * against a Zod schema, adaptive thinking at an explicit effort, a cached
 * system prompt, and server-side refusal fallbacks.
 */
export class AnthropicProvider implements LLMProvider {
  readonly id = "anthropic" as const;
  readonly simulated = false;
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 });
  }

  async generateObject<T>(params: GenerateObjectParams<T>): Promise<GenerateObjectResult<T>> {
    try {
      const response = await this.client.beta.messages.parse({
        model: this.model,
        max_tokens: params.maxTokens ?? 4000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: [{ type: "text", text: params.system, cache_control: { type: "ephemeral" } }],
        messages: params.messages,
        output_config: {
          effort: params.effort ?? "low",
          format: betaZodOutputFormat(params.schema),
        },
      });
      if (response.stop_reason === "refusal") {
        throw new LLMUnavailableError("O tutor não pôde responder a esta mensagem.", "refusal");
      }
      if (response.parsed_output == null) {
        throw new LLMUnavailableError("Resposta inválida do tutor.", "invalid_output");
      }
      return {
        object: response.parsed_output as T,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        simulated: false,
        model: response.model,
      };
    } catch (error) {
      if (error instanceof LLMUnavailableError) throw error;
      if (error instanceof Anthropic.RateLimitError) {
        throw new LLMUnavailableError(
          "O tutor está ocupado. Tente de novo em instantes.",
          "rate_limited",
        );
      }
      if (error instanceof Anthropic.APIError) {
        throw new LLMUnavailableError("O tutor está indisponível no momento.", "unavailable");
      }
      throw error;
    }
  }
}
