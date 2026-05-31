import { z } from "zod";
import { BaseAgent } from "./base";
import { ComplianceCheckSchema, type ComplianceCheck } from "../schemas";

interface ComplianceInput {
  channel: "email" | "linkedin";
  subject?: string;
  body: string;
  cta: string;
  recipientEmail?: string;
  companyName: string;
  personName: string;
}

export class ComplianceAgent extends BaseAgent<ComplianceInput, ComplianceCheck> {
  constructor(provider: import("../providers/openai").AIProvider, promptManager: import("../prompts/manager").PromptManager) {
    super(provider, promptManager, {
      promptName: "compliance-v1",
      timeout: 30000,
      maxRetries: 2,
    });
  }

  buildUserPrompt(input: ComplianceInput): string {
    const parts = [
      `Channel: ${input.channel}`,
      input.subject ? `Subject: ${input.subject}` : null,
      `Body:\n${input.body}`,
      `CTA: ${input.cta}`,
      input.recipientEmail ? `Recipient email: ${input.recipientEmail}` : null,
      `Recipient: ${input.personName} at ${input.companyName}`,
    ].filter(Boolean);

    return `Review this message for compliance:\n\n${parts.join("\n")}`;
  }

  protected getOutputSchema(): z.ZodSchema<ComplianceCheck> {
    return ComplianceCheckSchema;
  }
}
