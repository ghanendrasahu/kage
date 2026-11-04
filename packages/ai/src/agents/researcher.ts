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
      maxTokens: 2048,
    });
  }

  buildUserPrompt(input: ResearcherInput): string {
    // Free-tier providers cap tokens per minute. Budget the untrusted source
    // material so a broad crawl cannot push a single request over the limit.
    const totalBudget = 12000;
    let used = 0;
    const sections: string[] = [];
    for (const item of input.rawContent.slice(0, 12)) {
      const remaining = totalBudget - used;
      if (remaining <= 0) {
        break;
      }
      const content = item.content.slice(0, Math.min(1500, remaining));
      used += content.length;
      sections.push(
        `[${item.sourceType}] ${item.title}\nURL: ${item.url}\nContent: ${content}`
      );
    }
    const contentSummary = sections.join("\n\n---\n\n");

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
