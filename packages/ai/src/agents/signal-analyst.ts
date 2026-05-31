import { z } from "zod";
import { BaseAgent } from "./base";
import { SignalSchema, type Signal } from "../schemas";

interface SignalAnalystInput {
  findings: import("../schemas").RawFinding[];
  companyName: string;
  industry?: string;
}

const SignalAnalystOutputSchema = z.object({
  signals: z.array(SignalSchema),
  painPoints: z.array(z.string()),
  opportunities: z.array(z.string()),
  personalizationAngles: z.array(z.string()),
});

type SignalAnalystOutput = z.infer<typeof SignalAnalystOutputSchema>;

export class SignalAnalystAgent extends BaseAgent<SignalAnalystInput, SignalAnalystOutput> {
  constructor(provider: import("../providers/openai").AIProvider, promptManager: import("../prompts/manager").PromptManager) {
    super(provider, promptManager, {
      promptName: "signal-analyst-v1",
      timeout: 30000,
      maxRetries: 2,
    });
  }

  buildUserPrompt(input: SignalAnalystInput): string {
    const findingsSummary = input.findings
      .map((f) => `[${f.category}] ${f.title}: ${f.description} (confidence: ${f.confidence})`)
      .join("\n");

    return `Company: ${input.companyName}
Industry: ${input.industry ?? "Unknown"}

Research findings:
${findingsSummary}

Identify business signals, pain points, opportunities, and personalization angles.`;
  }

  protected getOutputSchema(): z.ZodSchema<SignalAnalystOutput> {
    return SignalAnalystOutputSchema;
  }
}
