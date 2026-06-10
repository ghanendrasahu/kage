import { Job } from "bullmq";
import { BaseWorker, type JobData, type JobResult } from "@kage/queue";
import { getDb, prospects, researchReports, researchSources, researchFindings } from "@kage/db";
import { eq } from "drizzle-orm";
import { ResearchPipeline } from "@kage/research";
import { OpenAIProvider } from "@kage/ai";
import { PromptManager } from "@kage/ai";
import { ResearchPlannerAgent } from "@kage/ai";
import { ResearcherAgent } from "@kage/ai";
import { SignalAnalystAgent } from "@kage/ai";
import { ProspectStatus } from "@kage/shared";

export class ResearchWorker extends BaseWorker {
  private pipeline: ResearchPipeline;
  private provider: OpenAIProvider;
  private promptManager: PromptManager;

  constructor() {
    super({ queueName: "research", concurrency: 2 });
    this.pipeline = new ResearchPipeline();
    this.provider = new OpenAIProvider();
    this.promptManager = new PromptManager();
  }

  async process(job: Job<JobData>): Promise<JobResult> {
    if (job.name !== "research_company" && job.name !== "research_prospect") {
      return { success: false, error: `Unknown job type: ${job.name}` };
    }

    const { organizationId, userId, prospectId } = job.data as {
      organizationId: string;
      userId: string;
      prospectId: string;
      companyDomain?: string;
      companyName: string;
    };

    const db = getDb();

    try {
      await db
        .update(prospects)
        .set({ status: ProspectStatus.RESEARCHING })
        .where(eq(prospects.id, prospectId));

      const [existingProspect] = await db
        .select()
        .from(prospects)
        .where(eq(prospects.id, prospectId))
        .limit(1);

      if (!existingProspect) {
        return { success: false, error: "Prospect not found" };
      }

      const researchResult = await this.pipeline.execute({
        companyName: existingProspect.company_name,
        companyDomain: existingProspect.company_domain ?? undefined,
      });

      const plannerAgent = new ResearchPlannerAgent(this.provider, this.promptManager);
      const plan = await plannerAgent.run({
        companyName: existingProspect.company_name,
        companyDomain: existingProspect.company_domain ?? undefined,
      });

      const researcherAgent = new ResearcherAgent(this.provider, this.promptManager);
      const researchOutput = await researcherAgent.run({
        researchPlan: plan.data,
        rawContent: researchResult.rawContent.map((r) => ({
          url: r.url,
          title: r.title,
          content: r.content,
          sourceType: r.sourceType,
        })),
      });

      const signalAgent = new SignalAnalystAgent(this.provider, this.promptManager);
      const signals = await signalAgent.run({
        findings: researchOutput.data.findings,
        companyName: existingProspect.company_name,
        industry: existingProspect.industry ?? undefined,
      });

      const [report] = await db
        .insert(researchReports)
        .values({
          organization_id: organizationId,
          prospect_id: prospectId,
          summary: JSON.stringify(signals.data),
          confidence: signals.data.signals.length > 0 ? 0.7 : 0.3,
          ai_model: "gpt-4o",
          prompt_version: "1.0.0",
          token_usage: plan.usage.inputTokens + plan.usage.outputTokens + researchOutput.usage.inputTokens + researchOutput.usage.outputTokens + signals.usage.inputTokens + signals.usage.outputTokens,
          status: "COMPLETED",
        })
        .returning();

      if (report) {
        for (const finding of researchOutput.data.findings) {
          const [source] = await db
            .insert(researchSources)
            .values({
              organization_id: organizationId,
              report_id: report.id,
              source_type: finding.sourceUrl.includes("news") ? "NEWS" : "COMPANY_WEBSITE",
              url: finding.sourceUrl,
              title: finding.title,
            })
            .returning();

          if (source) {
            await db.insert(researchFindings).values({
              organization_id: organizationId,
              report_id: report.id,
              source_id: source.id,
              category: finding.category,
              title: finding.title,
              description: finding.description,
              snippet: finding.snippet,
              confidence: finding.confidence,
            });
          }
        }
      }

      await db
        .update(prospects)
        .set({ status: ProspectStatus.RESEARCHED })
        .where(eq(prospects.id, prospectId));

      return {
        success: true,
        data: {
          reportId: report?.id,
          signalsCount: signals.data.signals.length,
          findingsCount: researchOutput.data.findings.length,
        },
      };
    } catch (error) {
      await db
        .update(prospects)
        .set({ status: ProspectStatus.NEW })
        .where(eq(prospects.id, prospectId));

      throw error;
    }
  }
}
