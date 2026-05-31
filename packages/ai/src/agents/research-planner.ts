import { z } from "zod";
import { BaseAgent } from "./base";
import { ResearchPlanSchema, type ResearchPlan } from "../schemas";

interface ResearchPlannerInput {
  companyName: string;
  companyDomain?: string;
  targetPersona?: string;
  productService?: string;
  icpDescription?: string;
}

export class ResearchPlannerAgent extends BaseAgent<ResearchPlannerInput, ResearchPlan> {
  constructor(provider: import("../providers/openai").AIProvider, promptManager: import("../prompts/manager").PromptManager) {
    super(provider, promptManager, {
      promptName: "research-planner-v1",
      timeout: 30000,
      maxRetries: 2,
    });
  }

  buildUserPrompt(input: ResearchPlannerInput): string {
    const parts = [
      `Company: ${input.companyName}`,
      input.companyDomain ? `Website: ${input.companyDomain}` : null,
      input.targetPersona ? `Target persona: ${input.targetPersona}` : null,
      input.productService ? `Product/service: ${input.productService}` : null,
      input.icpDescription ? `ICP: ${input.icpDescription}` : null,
    ].filter(Boolean);

    return `Create a research plan for:\n\n${parts.join("\n")}`;
  }

  protected getOutputSchema(): z.ZodSchema<ResearchPlan> {
    return ResearchPlanSchema;
  }
}
