import type { AIProvider } from "../providers/openai";
import { PromptManager } from "../prompts/manager";

export interface AgentConfig {
  promptName: string;
  timeout?: number;
  maxRetries?: number;
}

export interface AgentResult<T> {
  data: T;
  usage: { inputTokens: number; outputTokens: number };
  latencyMs: number;
}

export abstract class BaseAgent<TInput, TOutput> {
  protected provider: AIProvider;
  protected promptManager: PromptManager;
  protected config: AgentConfig;

  constructor(provider: AIProvider, promptManager: PromptManager, config: AgentConfig) {
    this.provider = provider;
    this.promptManager = promptManager;
    this.config = config;
  }

  abstract buildUserPrompt(input: TInput): string;

  async run(input: TInput): Promise<AgentResult<TOutput>> {
    const prompt = this.promptManager.getPrompt(this.config.promptName);
    const userPrompt = this.buildUserPrompt(input);
    const startTime = Date.now();

    let lastError: Error | null = null;
    const maxRetries = this.config.maxRetries ?? 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.provider.completeStructured({
          model: prompt.model,
          systemPrompt: prompt.systemPrompt,
          userPrompt,
          schema: this.getOutputSchema(),
          temperature: prompt.temperature,
        });

        return {
          data: result.data,
          usage: result.usage,
          latencyMs: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError ?? new Error("Agent failed after retries");
  }

  protected abstract getOutputSchema(): import("zod").ZodSchema<TOutput>;
}
