import { z } from "zod";

export const ResearchPlanSchema = z.object({
  searchQueries: z.array(z.string()),
  websitesToCheck: z.array(z.string()),
  newsTopics: z.array(z.string()),
  dataPoints: z.array(z.string()),
});

export type ResearchPlan = z.infer<typeof ResearchPlanSchema>;

export const RawFindingSchema = z.object({
  category: z.string(),
  title: z.string(),
  description: z.string(),
  snippet: z.string().optional(),
  sourceUrl: z.string().url(),
  sourceDate: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export type RawFinding = z.infer<typeof RawFindingSchema>;

export const SignalSchema = z.object({
  type: z.enum([
    "funding",
    "hiring",
    "product_launch",
    "leadership_change",
    "partnership",
    "expansion",
    "earnings",
    "acquisition",
    "awards",
    "regulatory",
  ]),
  title: z.string(),
  description: z.string(),
  sourceUrl: z.string().url(),
  sourceDate: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export type Signal = z.infer<typeof SignalSchema>;

export const ResearchReportOutputSchema = z.object({
  company: z.object({
    name: z.string(),
    domain: z.string().optional(),
    industry: z.string(),
    description: z.string(),
    employeeRange: z.string().optional(),
    headquarters: z.string().optional(),
  }),
  signals: z.array(SignalSchema),
  painPoints: z.array(z.string()),
  opportunities: z.array(z.string()),
  personalizationAngles: z.array(z.string()),
  summary: z.string(),
  confidence: z.number().min(0).max(1),
});

export type ResearchReportOutput = z.infer<typeof ResearchReportOutputSchema>;

export const OpportunityScoreSchema = z.object({
  fitScore: z.number().min(0).max(100),
  triggerScore: z.number().min(0).max(100),
  personalizationScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  reasoning: z.string(),
});

export type OpportunityScore = z.infer<typeof OpportunityScoreSchema>;

export const EmailVariantSchema = z.object({
  subject: z.string(),
  body: z.string(),
  personalizationUsed: z.array(z.string()),
  cta: z.string(),
  confidence: z.number().min(0).max(1),
});

export type EmailVariant = z.infer<typeof EmailVariantSchema>;

export const LinkedInVariantSchema = z.object({
  body: z.string(),
  personalizationUsed: z.array(z.string()),
  cta: z.string(),
  confidence: z.number().min(0).max(1),
});

export type LinkedInVariant = z.infer<typeof LinkedInVariantSchema>;

export const FollowUpStepSchema = z.object({
  delayDays: z.number().int().min(0),
  channel: z.enum(["email", "linkedin"]),
  subject: z.string().optional(),
  body: z.string(),
});

export type FollowUpStep = z.infer<typeof FollowUpStepSchema>;

export const OutreachPackageSchema = z.object({
  emails: z.array(EmailVariantSchema),
  linkedinMessages: z.array(LinkedInVariantSchema),
  followUpSequence: z.array(FollowUpStepSchema),
  warnings: z.array(z.string()),
});

export type OutreachPackageOutput = z.infer<typeof OutreachPackageSchema>;

export const CriticScoresSchema = z.object({
  personalization: z.number().min(0).max(10),
  specificity: z.number().min(0).max(10),
  clarity: z.number().min(0).max(10),
  accuracy: z.number().min(0).max(10),
  value: z.number().min(0).max(10),
  tone: z.number().min(0).max(10),
  ctaQuality: z.number().min(0).max(10),
  spamminess: z.number().min(0).max(10),
  overall: z.number().min(0).max(10),
  feedback: z.string(),
});

export type CriticScores = z.infer<typeof CriticScoresSchema>;

export const ComplianceCheckSchema = z.object({
  approved: z.boolean(),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type ComplianceCheck = z.infer<typeof ComplianceCheckSchema>;
