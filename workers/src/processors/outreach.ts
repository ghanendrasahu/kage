import { Job } from "bullmq";
import { BaseWorker, type JobData, type JobResult } from "@kage/queue";
import { getDb, prospects, outreachPackages, outreachMessages, researchReports, researchFindings } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { OpenAIProvider } from "@kage/ai";
import { PromptManager } from "@kage/ai";
import { OutreachWriterAgent, CriticAgent, PersonalizationAgent } from "@kage/ai";
import { ProspectStatus, MessageStatus, OutreachChannel } from "@kage/shared";

export class OutreachWorker extends BaseWorker {
  private provider: OpenAIProvider;
  private promptManager: PromptManager;

  constructor() {
    super({ queueName: "outreach", concurrency: 2 });
    this.provider = new OpenAIProvider();
    this.promptManager = new PromptManager();
  }

  async process(job: Job<JobData>): Promise<JobResult> {
    if (job.name !== "generate_outreach") {
      return { success: false, error: `Unknown job type: ${job.name}` };
    }

    const { organizationId, prospectId, researchReportId, productService, icpDescription, salesContext } = job.data as {
      organizationId: string;
      prospectId: string;
      researchReportId: string;
      productService: string;
      icpDescription?: string;
      salesContext?: string;
    };

    const db = getDb();

    try {
      const [existingProspect] = await db
        .select()
        .from(prospects)
        .where(
          and(
            eq(prospects.id, prospectId),
            eq(prospects.organization_id, organizationId)
          )
        )
        .limit(1);

      if (!existingProspect) {
        return { success: false, error: "Prospect not found" };
      }

      const [existingReport] = await db
        .select()
        .from(researchReports)
        .where(
          and(
            eq(researchReports.id, researchReportId),
            eq(researchReports.organization_id, organizationId)
          )
        )
        .limit(1);

      if (!existingReport) {
        return { success: false, error: "Research report not found" };
      }

      const findings = await db
        .select()
        .from(researchFindings)
        .where(eq(researchFindings.report_id, researchReportId));

      let signals: Array<{ type: string; title: string; description: string; sourceUrl: string; confidence: number }> = [];
      let painPoints: string[] = [];
      let opportunities: string[] = [];
      let personalizationAngles: string[] = [];

      try {
        const reportData = JSON.parse(existingReport.summary ?? "{}");
        signals = reportData.signals ?? [];
        painPoints = reportData.painPoints ?? [];
        opportunities = reportData.opportunities ?? [];
        personalizationAngles = reportData.personalizationAngles ?? [];
      } catch {
        // Use empty arrays if parsing fails
      }

      const personalizationAgent = new PersonalizationAgent(this.provider, this.promptManager);
      const opportunityScore = await personalizationAgent.run({
        companyName: existingProspect.company_name,
        personName: existingProspect.person_name,
        personTitle: existingProspect.person_title ?? "",
        signals: signals.map((s) => ({
          type: s.type as any,
          title: s.title,
          description: s.description,
          sourceUrl: s.sourceUrl,
          confidence: s.confidence,
        })),
        painPoints,
        opportunities,
        productService,
        icpDescription,
      });

      const writerAgent = new OutreachWriterAgent(this.provider, this.promptManager);
      const outreachOutput = await writerAgent.run({
        companyName: existingProspect.company_name,
        personName: existingProspect.person_name,
        personTitle: existingProspect.person_title ?? "",
        signals: signals.map((s) => ({
          type: s.type as any,
          title: s.title,
          description: s.description,
          sourceUrl: s.sourceUrl,
          confidence: s.confidence,
        })),
        painPoints,
        opportunities,
        personalizationAngles,
        opportunityScore: opportunityScore.data,
        productService,
        icpDescription,
        salesContext,
      });

      const [outreachPackage] = await db
        .insert(outreachPackages)
        .values({
          organization_id: organizationId,
          prospect_id: prospectId,
          research_report_id: researchReportId,
          opportunity_score: opportunityScore.data.overallScore,
          fit_score: opportunityScore.data.fitScore,
          trigger_score: opportunityScore.data.triggerScore,
          personalization_score: opportunityScore.data.personalizationScore,
          confidence_score: opportunityScore.data.confidenceScore,
          score_reasoning: opportunityScore.data.reasoning,
          ai_model: "gpt-4o",
          prompt_version: "1.0.0",
          token_usage: opportunityScore.usage.inputTokens + opportunityScore.usage.outputTokens + outreachOutput.usage.inputTokens + outreachOutput.usage.outputTokens,
          status: "COMPLETED",
        })
        .returning();

      if (outreachPackage) {
        for (let i = 0; i < outreachOutput.data.emails.length; i++) {
          const email = outreachOutput.data.emails[i];
          if (!email) continue;

          await db.insert(outreachMessages).values({
            organization_id: organizationId,
            package_id: outreachPackage.id,
            prospect_id: prospectId,
            channel: OutreachChannel.EMAIL,
            variant: i + 1,
            subject: email.subject,
            body: email.body,
            personalization_used: email.personalizationUsed,
            cta: email.cta,
            confidence: email.confidence,
            status: MessageStatus.DRAFT,
          });
        }

        for (let i = 0; i < outreachOutput.data.linkedinMessages.length; i++) {
          const linkedin = outreachOutput.data.linkedinMessages[i];
          if (!linkedin) continue;

          await db.insert(outreachMessages).values({
            organization_id: organizationId,
            package_id: outreachPackage.id,
            prospect_id: prospectId,
            channel: OutreachChannel.LINKEDIN,
            variant: i + 1,
            body: linkedin.body,
            personalization_used: linkedin.personalizationUsed,
            cta: linkedin.cta,
            confidence: linkedin.confidence,
            status: MessageStatus.DRAFT,
          });
        }
      }

      await db
        .update(prospects)
        .set({ status: ProspectStatus.DRAFTED })
        .where(eq(prospects.id, prospectId));

      return {
        success: true,
        data: {
          packageId: outreachPackage?.id,
          emailCount: outreachOutput.data.emails.length,
          linkedinCount: outreachOutput.data.linkedinMessages.length,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
