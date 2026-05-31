import { z } from "zod";
import { BaseAgent } from "./base";
import { OutreachPackageSchema, type OutreachPackageOutput } from "../schemas";

interface WriterInput {
  companyName: string;
  personName: string;
  personTitle: string;
  signals: import("../schemas").Signal[];
  painPoints: string[];
  opportunities: string[];
  personalizationAngles: string[];
  opportunityScore: import("../schemas").OpportunityScore;
  productService: string;
  icpDescription?: string;
  salesContext?: string;
}

export class OutreachWriterAgent extends BaseAgent<WriterInput, OutreachPackageOutput> {
  constructor(provider: import("../providers/openai").AIProvider, promptManager: import("../prompts/manager").PromptManager) {
    super(provider, promptManager, {
      promptName: "writer-v1",
      timeout: 60000,
      maxRetries: 2,
    });
  }

  buildUserPrompt(input: WriterInput): string {
    const signalsList = input.signals
      .map((s) => `- ${s.type}: ${s.title}`)
      .join("\n");

    const anglesList = input.personalizationAngles
      .map((a) => `- ${a}`)
      .join("\n");

    return `Write outreach for:
Person: ${input.personName}, ${input.personTitle}
Company: ${input.companyName}

Key signals:
${signalsList || "None"}

Pain points: ${input.painPoints.join("; ") || "None identified"}
Opportunities: ${input.opportunities.join("; ") || "None identified"}

Personalization angles:
${anglesList || "None"}

Opportunity score: ${input.opportunityScore.overallScore}/100
Score reasoning: ${input.opportunityScore.reasoning}

Product: ${input.productService}
ICP: ${input.icpDescription ?? "Not provided"}
Context: ${input.salesContext ?? "Not provided"}

Generate 5 email variants and 5 LinkedIn messages with a follow-up sequence.`;
  }

  protected getOutputSchema(): z.ZodSchema<OutreachPackageOutput> {
    return OutreachPackageSchema;
  }
}
