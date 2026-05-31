import { z } from "zod";
import { BaseAgent } from "./base";
import { CriticScoresSchema, type CriticScores } from "../schemas";

interface CriticInput {
  message: {
    channel: "email" | "linkedin";
    subject?: string;
    body: string;
    personalizationUsed: string[];
    cta: string;
  };
  companyName: string;
  personName: string;
  personTitle: string;
  productService: string;
}

export class CriticAgent extends BaseAgent<CriticInput, CriticScores> {
  constructor(provider: import("../providers/openai").AIProvider, promptManager: import("../prompts/manager").PromptManager) {
    super(provider, promptManager, {
      promptName: "critic-v1",
      timeout: 30000,
      maxRetries: 2,
    });
  }

  buildUserPrompt(input: CriticInput): string {
    const parts = [
      `Channel: ${input.message.channel}`,
      input.message.subject ? `Subject: ${input.message.subject}` : null,
      `Body:\n${input.message.body}`,
      `CTA: ${input.message.cta}`,
      `Personalization: ${input.message.personalizationUsed.join(", ") || "None"}`,
      "",
      `Recipient: ${input.personName}, ${input.personTitle}`,
      `Company: ${input.companyName}`,
      `Product: ${input.productService}`,
    ].filter(Boolean);

    return `Evaluate this outreach message:\n\n${parts.join("\n")}`;
  }

  protected getOutputSchema(): z.ZodSchema<CriticScores> {
    return CriticScoresSchema;
  }
}
