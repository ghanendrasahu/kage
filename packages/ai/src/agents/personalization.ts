import { z } from "zod";
import { BaseAgent } from "./base";
import { OpportunityScoreSchema, type OpportunityScore } from "../schemas";

interface PersonalizationInput {
  companyName: string;
  personName: string;
  personTitle: string;
  signals: import("../schemas").Signal[];
  painPoints: string[];
  opportunities: string[];
  productService: string;
  icpDescription?: string;
}

export class PersonalizationAgent extends BaseAgent<PersonalizationInput, OpportunityScore> {
  constructor(provider: import("../providers/openai").AIProvider, promptManager: import("../prompts/manager").PromptManager) {
    super(provider, promptManager, {
      promptName: "personalization-v1",
      timeout: 30000,
      maxRetries: 2,
    });
  }

  buildUserPrompt(input: PersonalizationInput): string {
    const signalsList = input.signals
      .map((s) => `- ${s.type}: ${s.title} (${s.description})`)
      .join("\n");

    return `Target: ${input.personName}, ${input.personTitle} at ${input.companyName}

Business signals:
${signalsList || "None identified"}

Pain points: ${input.painPoints.join(", ") || "None identified"}
Opportunities: ${input.opportunities.join(", ") || "None identified"}

Product/service: ${input.productService}
ICP: ${input.icpDescription ?? "Not provided"}

Score the opportunity and explain your reasoning.`;
  }

  protected getOutputSchema(): z.ZodSchema<OpportunityScore> {
    return OpportunityScoreSchema;
  }
}
