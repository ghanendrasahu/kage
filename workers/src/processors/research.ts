import { Job } from "bullmq";
import { BaseWorker, type JobResult } from "@kage/queue";
import { getDb, prospects, researchReports, researchSources, researchFindings } from "@kage/db";
import { eq } from "drizzle-orm";
import { ResearchPipeline } from "@kage/research";
import {
  OpenAIProvider,
  PromptManager,
  ResearchPlannerAgent,
  ResearcherAgent,
  SignalAnalystAgent,
} from "@kage/ai";
import { ProspectStatus } from "@kage/shared";

export type ResearchJobPayload = {
  organizationId: string;
  userId: string;
  prospectId: string;
  /** Existing PENDING report created by the API route. */
  reportId?: string;
  companyName?: string;
  companyDomain?: string;
  correlationId?: string;
};

/**
 * Run the research pipeline for one prospect.
 *
 * Shared by the BullMQ worker and the Next.js API route (via `after()`), so
 * deployments without a paid background worker can still complete research.
 */
export async function runResearchJob(data: ResearchJobPayload): Promise<JobResult> {
  const { organizationId, prospectId, reportId } = data;
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

    const pipeline = new ResearchPipeline();
    const provider = new OpenAIProvider();
    const promptManager = new PromptManager();

    const researchResult = await pipeline.execute({
      companyName: existingProspect.company_name,
      companyDomain: existingProspect.company_domain ?? undefined,
    });

    const plannerAgent = new ResearchPlannerAgent(provider, promptManager);
    const plan = await plannerAgent.run({
      companyName: existingProspect.company_name,
      companyDomain: existingProspect.company_domain ?? undefined,
    });

    const researcherAgent = new ResearcherAgent(provider, promptManager);
    const researchOutput = await researcherAgent.run({
      researchPlan: plan.data,
      rawContent: researchResult.rawContent.map((r) => ({
        url: r.url,
        title: r.title,
        content: r.content,
        sourceType: r.sourceType,
      })),
    });

    const signalAgent = new SignalAnalystAgent(provider, promptManager);
    const signals = await signalAgent.run({
      findings: researchOutput.data.findings,
      companyName: existingProspect.company_name,
      industry: existingProspect.industry ?? undefined,
    });

    const reportValues = {
      summary: JSON.stringify(signals.data),
      confidence: signals.data.signals.length > 0 ? 0.7 : 0.3,
      ai_model: process.env["AI_MODEL"] ?? "gpt-4o",
      prompt_version: "1.0.0",
      token_usage:
        plan.usage.inputTokens +
        plan.usage.outputTokens +
        researchOutput.usage.inputTokens +
        researchOutput.usage.outputTokens +
        signals.usage.inputTokens +
        signals.usage.outputTokens,
      status: "COMPLETED",
      error: null,
    };

    const report = reportId
      ? (
          await db
            .update(researchReports)
            .set(reportValues)
            .where(eq(researchReports.id, reportId))
            .returning()
        )[0]
      : (
          await db
            .insert(researchReports)
            .values({
              organization_id: organizationId,
              prospect_id: prospectId,
              ...reportValues,
            })
            .returning()
        )[0];

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

    if (reportId) {
      await db
        .update(researchReports)
        .set({
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
        })
        .where(eq(researchReports.id, reportId));
    }

    throw error;
  }
}

export class ResearchWorker extends BaseWorker {
  constructor() {
    super({ queueName: "research", concurrency: 2 });
  }

  async process(job: Job): Promise<JobResult> {
    if (job.name !== "research_company" && job.name !== "research_prospect") {
      return { success: false, error: `Unknown job type: ${job.name}` };
    }

    // The queue payload is validated by the producer schema.
    return runResearchJob(job.data as ResearchJobPayload);
  }
}
