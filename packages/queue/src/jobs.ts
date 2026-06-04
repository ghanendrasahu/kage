import { z } from "zod";

export const JobTypes = {
  RESEARCH_COMPANY: "research_company",
  RESEARCH_PROSPECT: "research_prospect",
  GENERATE_OUTREACH: "generate_outreach",
  CRITIC_OUTREACH: "critic_outreach",
  COMPLIANCE_REVIEW: "compliance_review",
  SEND_EMAIL: "send_email",
  PROCESS_FOLLOWUP: "process_followup",
} as const;

export type JobType = (typeof JobTypes)[keyof typeof JobTypes];

const BaseJobSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  correlationId: z.string().uuid(),
});

export const ResearchCompanyJobSchema = BaseJobSchema.extend({
  prospectId: z.string().uuid(),
  companyDomain: z.string(),
  companyName: z.string(),
});

export const GenerateOutreachJobSchema = BaseJobSchema.extend({
  prospectId: z.string().uuid(),
  researchReportId: z.string().uuid(),
  productService: z.string(),
  icpDescription: z.string().optional(),
  salesContext: z.string().optional(),
});

export const SendEmailJobSchema = BaseJobSchema.extend({
  messageId: z.string().uuid(),
  gmailAccountId: z.string().uuid(),
});

export const ProcessFollowupJobSchema = BaseJobSchema.extend({
  sequenceId: z.string().uuid(),
  stepId: z.string().uuid(),
});

export type JobData =
  | z.infer<typeof ResearchCompanyJobSchema>
  | z.infer<typeof GenerateOutreachJobSchema>
  | z.infer<typeof SendEmailJobSchema>
  | z.infer<typeof ProcessFollowupJobSchema>;

export type JobResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};
