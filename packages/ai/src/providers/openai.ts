import OpenAI from "openai";
import type { z } from "zod";

export interface AIProvider {
  complete(params: {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ content: string; usage: { inputTokens: number; outputTokens: number } }>;

  completeStructured<T>(params: {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    schema: z.ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ data: T; usage: { inputTokens: number; outputTokens: number } }>;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    this.client = new OpenAI({ apiKey });
  }

  async complete(params: {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ content: string; usage: { inputTokens: number; outputTokens: number } }> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 4096,
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error("No content returned from AI");
    }

    return {
      content: choice.message.content,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }

  async completeStructured<T>(params: {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    schema: z.ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ data: T; usage: { inputTokens: number; outputTokens: number } }> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 4096,
      response_format: { type: "json_object" },
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error("No content returned from AI");
    }

    const parsed = JSON.parse(choice.message.content) as unknown;
    const result = params.schema.safeParse(parsed);

    if (!result.success) {
      throw new Error(`AI output validation failed: ${result.error.message}`);
    }

    return {
      data: result.data,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }
}
