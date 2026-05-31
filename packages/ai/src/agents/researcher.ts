import { z } from "zod";
import { BaseAgent } from "./base";
import { RawFindingSchema, type RawFinding } from "../schemas";

interface ResearcherInput {
  researchPlan: import("../schemas").ResearchPlan;
  rawContent: Array<{
    url: string;
    title: string;
    content: string;
    sourceType: string;
  }>;
}

const ResearcherOutputSchema = z.object({
  findings: z.array(RawFindingSchema),
});

type ResearcherOutput = z.infer<typeof ResearcherOutputSchema>;

export class ResearcherAgent extends BaseAgent<ResearcherInput, ResearcherOutput> {
  constructor(provider: import("../providers/openai").AIProvider, promptManager: import("../prompts/manager").PromptManager) {
    super(provider, promptManager, {
      promptName: "researcher-v1",
      timeout: 60000,
      maxRetries: 2,
    });
  }

  buildUserPrompt(input: ResearcherInput): string {
    const contentSummary = input.rawContent
      .map((item) => `[${item.sourceType}] ${item.title}\nURL: ${item.url}\nContent: ${item.content.slice(0, 2000)}`)
      .join("\n\n---\n\n");

    return `Research Plan:
Search queries: ${input.researchPlan.searchQueries.join(", ")}
Websites to check: ${input.researchPlan.websitesToCheck.join(", ")}
Data points needed: ${input.researchPlan.dataPoints.join(", ")}

Raw content collected:
${contentSummary}

Extract structured findings from this content.`;
  }

  protected getOutputSchema(): z.ZodSchema<ResearcherOutput> {
    return ResearcherOutputSchema;
  }
}
