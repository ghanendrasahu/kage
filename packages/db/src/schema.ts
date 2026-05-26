import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
  uniqueIndex,
  pgEnum,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import {
  UserRole,
  ProspectStatus,
  JobStatus,
  OutreachChannel,
  MessageStatus,
  ResearchSourceType,
  SignalType,
  IntegrationType,
  SubscriptionStatus,
  CampaignStatus,
  AuditAction,
} from "@kage/shared";

export const userRoleEnum = pgEnum("user_role", Object.values(UserRole) as [string, ...string[]]);
export const prospectStatusEnum = pgEnum("prospect_status", Object.values(ProspectStatus) as [string, ...string[]]);
export const jobStatusEnum = pgEnum("job_status", Object.values(JobStatus) as [string, ...string[]]);
export const outreachChannelEnum = pgEnum("outreach_channel", Object.values(OutreachChannel) as [string, ...string[]]);
export const messageStatusEnum = pgEnum("message_status", Object.values(MessageStatus) as [string, ...string[]]);
export const researchSourceTypeEnum = pgEnum("research_source_type", Object.values(ResearchSourceType) as [string, ...string[]]);
export const signalTypeEnum = pgEnum("signal_type", Object.values(SignalType) as [string, ...string[]]);
export const integrationTypeEnum = pgEnum("integration_type", Object.values(IntegrationType) as [string, ...string[]]);
export const subscriptionStatusEnum = pgEnum("subscription_status", Object.values(SubscriptionStatus) as [string, ...string[]]);
export const campaignStatusEnum = pgEnum("campaign_status", Object.values(CampaignStatus) as [string, ...string[]]);
export const auditActionEnum = pgEnum("audit_action", Object.values(AuditAction) as [string, ...string[]]);

const timestamps = {
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

const softDelete = {
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
};

// =============================================================================
// USERS
// =============================================================================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  password_hash: varchar("password_hash", { length: 255 }),
  avatar_url: text("avatar_url"),
  email_verified: timestamp("email_verified", { withTimezone: true }),
  mfa_enabled: boolean("mfa_enabled").default(false).notNull(),
  mfa_secret: varchar("mfa_secret", { length: 255 }),
  ...timestamps,
  ...softDelete,
}, (table) => [
  index("users_email_idx").on(table.email),
]);

// =============================================================================
// ORGANIZATIONS
// =============================================================================
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logo_url: text("logo_url"),
  website: text("website"),
  settings: jsonb("settings").default({}).notNull(),
  ...timestamps,
  ...softDelete,
});

// =============================================================================
// ORGANIZATION MEMBERS
// =============================================================================
export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull().default(UserRole.SALES_REP),
  invited_at: timestamp("invited_at", { withTimezone: true }),
  joined_at: timestamp("joined_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("org_members_org_user_idx").on(table.organization_id, table.user_id),
  index("org_members_user_idx").on(table.user_id),
]);

// =============================================================================
// TEAMS
// =============================================================================
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ...timestamps,
}, (table) => [
  index("teams_org_idx").on(table.organization_id),
]);

// =============================================================================
// TEAM MEMBERS
// =============================================================================
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  team_id: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull().default(UserRole.SALES_REP),
  ...timestamps,
}, (table) => [
  uniqueIndex("team_members_team_user_idx").on(table.team_id, table.user_id),
]);

// =============================================================================
// COMPANIES
// =============================================================================
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  linkedin_url: text("linkedin_url"),
  industry: varchar("industry", { length: 255 }),
  employee_range: varchar("employee_range", { length: 50 }),
  headquarters: varchar("headquarters", { length: 255 }),
  description: text("description"),
  founded_year: integer("founded_year"),
  website: text("website"),
  ...timestamps,
  ...softDelete,
}, (table) => [
  index("companies_org_idx").on(table.organization_id),
  index("companies_domain_idx").on(table.domain),
  uniqueIndex("companies_org_domain_idx").on(table.organization_id, table.domain),
]);

// =============================================================================
// PROSPECTS
// =============================================================================
export const prospects = pgTable("prospects", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  company_name: varchar("company_name", { length: 255 }).notNull(),
  company_domain: varchar("company_domain", { length: 255 }),
  company_linkedin_url: text("company_linkedin_url"),
  person_name: varchar("person_name", { length: 255 }).notNull(),
  person_title: varchar("person_title", { length: 255 }),
  person_linkedin_url: text("person_linkedin_url"),
  email: varchar("email", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  company_size: varchar("company_size", { length: 50 }),
  location: varchar("location", { length: 255 }),
  status: prospectStatusEnum("status").notNull().default(ProspectStatus.NEW),
  source: varchar("source", { length: 255 }),
  notes: text("notes"),
  tags: jsonb("tags").default([]).notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  created_by: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
  ...softDelete,
}, (table) => [
  index("prospects_org_idx").on(table.organization_id),
  index("prospects_status_idx").on(table.status),
  index("prospects_company_idx").on(table.company_id),
  index("prospects_created_by_idx").on(table.created_by),
]);

// =============================================================================
// RESEARCH REPORTS
// =============================================================================
export const researchReports = pgTable("research_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  prospect_id: uuid("prospect_id").references(() => prospects.id, { onDelete: "cascade" }),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  summary: text("summary"),
  company_snapshot: jsonb("company_snapshot"),
  confidence: real("confidence"),
  ai_model: varchar("ai_model", { length: 100 }),
  ai_run_id: uuid("ai_run_id"),
  prompt_version: varchar("prompt_version", { length: 50 }),
  token_usage: integer("token_usage"),
  status: varchar("status", { length: 50 }).default("PENDING").notNull(),
  error: text("error"),
  ...timestamps,
}, (table) => [
  index("research_reports_org_idx").on(table.organization_id),
  index("research_reports_prospect_idx").on(table.prospect_id),
  index("research_reports_company_idx").on(table.company_id),
]);

// =============================================================================
// RESEARCH SOURCES
// =============================================================================
export const researchSources = pgTable("research_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  report_id: uuid("report_id").notNull().references(() => researchReports.id, { onDelete: "cascade" }),
  source_type: researchSourceTypeEnum("source_type").notNull(),
  url: text("url").notNull(),
  title: varchar("title", { length: 500 }),
  accessed_at: timestamp("accessed_at", { withTimezone: true }).defaultNow().notNull(),
  status_code: integer("status_code"),
  content_hash: varchar("content_hash", { length: 64 }),
  ...timestamps,
}, (table) => [
  index("research_sources_report_idx").on(table.report_id),
]);

// =============================================================================
// RESEARCH FINDINGS
// =============================================================================
export const researchFindings = pgTable("research_findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  report_id: uuid("report_id").notNull().references(() => researchReports.id, { onDelete: "cascade" }),
  source_id: uuid("source_id").references(() => researchSources.id, { onDelete: "set null" }),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  snippet: text("snippet"),
  confidence: real("confidence").notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  ...timestamps,
}, (table) => [
  index("research_findings_report_idx").on(table.report_id),
  index("research_findings_category_idx").on(table.category),
]);

// =============================================================================
// CAMPAIGNS
// =============================================================================
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: campaignStatusEnum("status").notNull().default(CampaignStatus.DRAFT),
  product_service: text("product_service"),
  icp_description: text("icp_description"),
  sales_context: text("sales_context"),
  settings: jsonb("settings").default({}).notNull(),
  ...timestamps,
  ...softDelete,
}, (table) => [
  index("campaigns_org_idx").on(table.organization_id),
  index("campaigns_status_idx").on(table.status),
]);

// =============================================================================
// CAMPAIGN PROSPECTS
// =============================================================================
export const campaignProspects = pgTable("campaign_prospects", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaign_id: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  prospect_id: uuid("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  status: prospectStatusEnum("status").notNull().default(ProspectStatus.NEW),
  ...timestamps,
}, (table) => [
  uniqueIndex("campaign_prospects_unique_idx").on(table.campaign_id, table.prospect_id),
]);

// =============================================================================
// OUTREACH PACKAGES
// =============================================================================
export const outreachPackages = pgTable("outreach_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  prospect_id: uuid("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  campaign_id: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  research_report_id: uuid("research_report_id").references(() => researchReports.id, { onDelete: "set null" }),
  opportunity_score: real("opportunity_score"),
  fit_score: real("fit_score"),
  trigger_score: real("trigger_score"),
  personalization_score: real("personalization_score"),
  confidence_score: real("confidence_score"),
  score_reasoning: text("score_reasoning"),
  status: varchar("status", { length: 50 }).default("PENDING").notNull(),
  ai_model: varchar("ai_model", { length: 100 }),
  ai_run_id: uuid("ai_run_id"),
  prompt_version: varchar("prompt_version", { length: 50 }),
  token_usage: integer("token_usage"),
  error: text("error"),
  ...timestamps,
}, (table) => [
  index("outreach_packages_org_idx").on(table.organization_id),
  index("outreach_packages_prospect_idx").on(table.prospect_id),
  index("outreach_packages_campaign_idx").on(table.campaign_id),
]);

// =============================================================================
// OUTREACH MESSAGES
// =============================================================================
export const outreachMessages = pgTable("outreach_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  package_id: uuid("package_id").notNull().references(() => outreachPackages.id, { onDelete: "cascade" }),
  prospect_id: uuid("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  channel: outreachChannelEnum("channel").notNull(),
  variant: integer("variant").notNull(),
  subject: varchar("subject", { length: 500 }),
  body: text("body").notNull(),
  personalization_used: jsonb("personalization_used").default([]).notNull(),
  cta: text("cta"),
  confidence: real("confidence"),
  status: messageStatusEnum("status").notNull().default(MessageStatus.DRAFT),
  critic_scores: jsonb("critic_scores"),
  compliance_notes: jsonb("compliance_notes"),
  warnings: jsonb("warnings").default([]).notNull(),
  approved_by: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
  approved_at: timestamp("approved_at", { withTimezone: true }),
  edited_by: uuid("edited_by").references(() => users.id, { onDelete: "set null" }),
  edited_at: timestamp("edited_at", { withTimezone: true }),
  sent_by: uuid("sent_by").references(() => users.id, { onDelete: "set null" }),
  sent_at: timestamp("sent_at", { withTimezone: true }),
  idempotency_key: varchar("idempotency_key", { length: 255 }),
  send_result: jsonb("send_result"),
  ...timestamps,
}, (table) => [
  index("outreach_messages_org_idx").on(table.organization_id),
  index("outreach_messages_package_idx").on(table.package_id),
  index("outreach_messages_prospect_idx").on(table.prospect_id),
  index("outreach_messages_status_idx").on(table.status),
  index("outreach_messages_channel_idx").on(table.channel),
  uniqueIndex("outreach_messages_idempotency_idx").on(table.idempotency_key),
]);

// =============================================================================
// FOLLOW-UP SEQUENCES
// =============================================================================
export const followUpSequences = pgTable("follow_up_sequences", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  package_id: uuid("package_id").notNull().references(() => outreachPackages.id, { onDelete: "cascade" }),
  prospect_id: uuid("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }),
  status: varchar("status", { length: 50 }).default("PENDING").notNull(),
  ...timestamps,
}, (table) => [
  index("follow_up_sequences_org_idx").on(table.organization_id),
  index("follow_up_sequences_package_idx").on(table.package_id),
]);

// =============================================================================
// FOLLOW-UP STEPS
// =============================================================================
export const followUpSteps = pgTable("follow_up_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sequence_id: uuid("sequence_id").notNull().references(() => followUpSequences.id, { onDelete: "cascade" }),
  step_number: integer("step_number").notNull(),
  delay_days: integer("delay_days").notNull(),
  channel: outreachChannelEnum("channel").notNull(),
  subject: varchar("subject", { length: 500 }),
  body: text("body").notNull(),
  status: messageStatusEnum("status").notNull().default(MessageStatus.DRAFT),
  sent_at: timestamp("sent_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("follow_up_steps_sequence_idx").on(table.sequence_id),
]);

// =============================================================================
// INTEGRATIONS
// =============================================================================
export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: integrationTypeEnum("type").notNull(),
  status: varchar("status", { length: 50 }).default("ACTIVE").notNull(),
  config: jsonb("config").default({}).notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  ...timestamps,
}, (table) => [
  index("integrations_org_idx").on(table.organization_id),
  index("integrations_user_idx").on(table.user_id),
  index("integrations_type_idx").on(table.type),
]);

// =============================================================================
// GMAIL ACCOUNTS
// =============================================================================
export const gmailAccounts = pgTable("gmail_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  integration_id: uuid("integration_id").references(() => integrations.id, { onDelete: "set null" }),
  email: varchar("email", { length: 255 }).notNull(),
  access_token_encrypted: text("access_token_encrypted"),
  refresh_token_encrypted: text("refresh_token_encrypted"),
  token_expires_at: timestamp("token_expires_at", { withTimezone: true }),
  scope: varchar("scope", { length: 500 }),
  profile: jsonb("profile"),
  ...timestamps,
}, (table) => [
  index("gmail_accounts_org_idx").on(table.organization_id),
  index("gmail_accounts_user_idx").on(table.user_id),
  uniqueIndex("gmail_accounts_user_email_idx").on(table.user_id, table.email),
]);

// =============================================================================
// AI RUNS
// =============================================================================
export const aiRuns = pgTable("ai_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  job_id: uuid("job_id"),
  agent_name: varchar("agent_name", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  prompt_version: varchar("prompt_version", { length: 50 }),
  input_tokens: integer("input_tokens"),
  output_tokens: integer("output_tokens"),
  estimated_cost_cents: integer("estimated_cost_cents"),
  latency_ms: integer("latency_ms"),
  status: jobStatusEnum("status").notNull().default(JobStatus.PENDING),
  input: jsonb("input"),
  output: jsonb("output"),
  error: text("error"),
  ...timestamps,
}, (table) => [
  index("ai_runs_org_idx").on(table.organization_id),
  index("ai_runs_agent_idx").on(table.agent_name),
  index("ai_runs_status_idx").on(table.status),
  index("ai_runs_job_idx").on(table.job_id),
]);

// =============================================================================
// AI USAGE
// =============================================================================
export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  period_start: timestamp("period_start", { withTimezone: true }).notNull(),
  period_end: timestamp("period_end", { withTimezone: true }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  input_tokens: integer("input_tokens").default(0).notNull(),
  output_tokens: integer("output_tokens").default(0).notNull(),
  total_cost_cents: integer("total_cost_cents").default(0).notNull(),
  run_count: integer("run_count").default(0).notNull(),
  ...timestamps,
}, (table) => [
  index("ai_usage_org_idx").on(table.organization_id),
  uniqueIndex("ai_usage_org_period_model_idx").on(table.organization_id, table.period_start, table.model),
]);

// =============================================================================
// AUDIT LOGS
// =============================================================================
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: auditActionEnum("action").notNull(),
  resource_type: varchar("resource_type", { length: 100 }).notNull(),
  resource_id: uuid("resource_id"),
  details: jsonb("details"),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_logs_org_idx").on(table.organization_id),
  index("audit_logs_user_idx").on(table.user_id),
  index("audit_logs_action_idx").on(table.action),
  index("audit_logs_resource_idx").on(table.resource_type, table.resource_id),
  index("audit_logs_created_at_idx").on(table.created_at),
]);

// =============================================================================
// NOTIFICATIONS
// =============================================================================
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  read: boolean("read").default(false).notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  ...timestamps,
}, (table) => [
  index("notifications_org_idx").on(table.organization_id),
  index("notifications_user_idx").on(table.user_id),
  index("notifications_read_idx").on(table.read),
]);

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  stripe_subscription_id: varchar("stripe_subscription_id", { length: 255 }),
  stripe_customer_id: varchar("stripe_customer_id", { length: 255 }),
  plan_name: varchar("plan_name", { length: 100 }).notNull(),
  status: subscriptionStatusEnum("status").notNull().default(SubscriptionStatus.TRIALING),
  current_period_start: timestamp("current_period_start", { withTimezone: true }),
  current_period_end: timestamp("current_period_end", { withTimezone: true }),
  cancel_at: timestamp("cancel_at", { withTimezone: true }),
  cancelled_at: timestamp("cancelled_at", { withTimezone: true }),
  limits: jsonb("limits").default({}).notNull(),
  ...timestamps,
}, (table) => [
  index("subscriptions_org_idx").on(table.organization_id),
  index("subscriptions_stripe_idx").on(table.stripe_subscription_id),
]);

// =============================================================================
// JOBS (BullMQ metadata)
// =============================================================================
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  type: varchar("type", { length: 100 }).notNull(),
  status: jobStatusEnum("status").notNull().default(JobStatus.PENDING),
  priority: integer("priority").default(0).notNull(),
  payload: jsonb("payload").default({}).notNull(),
  result: jsonb("result"),
  error: text("error"),
  attempts: integer("attempts").default(0).notNull(),
  max_attempts: integer("max_attempts").default(3).notNull(),
  scheduled_at: timestamp("scheduled_at", { withTimezone: true }),
  started_at: timestamp("started_at", { withTimezone: true }),
  completed_at: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("jobs_org_idx").on(table.organization_id),
  index("jobs_status_idx").on(table.status),
  index("jobs_type_idx").on(table.type),
  index("jobs_scheduled_idx").on(table.scheduled_at),
]);

// =============================================================================
// RELATIONS
// =============================================================================
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(organizationMembers),
  teamMemberships: many(teamMembers),
  createdProspects: many(prospects),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  teams: many(teams),
  companies: many(companies),
  prospects: many(prospects),
  campaigns: many(campaigns),
  researchReports: many(researchReports),
  outreachPackages: many(outreachPackages),
  outreachMessages: many(outreachMessages),
  integrations: many(integrations),
  gmailAccounts: many(gmailAccounts),
  aiRuns: many(aiRuns),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
  subscriptions: many(subscriptions),
  jobs: many(jobs),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, { fields: [organizationMembers.organization_id], references: [organizations.id] }),
  user: one(users, { fields: [organizationMembers.user_id], references: [users.id] }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, { fields: [teams.organization_id], references: [organizations.id] }),
  members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.team_id], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.user_id], references: [users.id] }),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  organization: one(organizations, { fields: [companies.organization_id], references: [organizations.id] }),
  prospects: many(prospects),
}));

export const prospectsRelations = relations(prospects, ({ one, many }) => ({
  organization: one(organizations, { fields: [prospects.organization_id], references: [organizations.id] }),
  company: one(companies, { fields: [prospects.company_id], references: [companies.id] }),
  createdBy: one(users, { fields: [prospects.created_by], references: [users.id] }),
  researchReports: many(researchReports),
  outreachPackages: many(outreachPackages),
  outreachMessages: many(outreachMessages),
  followUpSequences: many(followUpSequences),
}));

export const researchReportsRelations = relations(researchReports, ({ one, many }) => ({
  organization: one(organizations, { fields: [researchReports.organization_id], references: [organizations.id] }),
  prospect: one(prospects, { fields: [researchReports.prospect_id], references: [prospects.id] }),
  company: one(companies, { fields: [researchReports.company_id], references: [companies.id] }),
  sources: many(researchSources),
  findings: many(researchFindings),
}));

export const researchSourcesRelations = relations(researchSources, ({ one }) => ({
  organization: one(organizations, { fields: [researchSources.organization_id], references: [organizations.id] }),
  report: one(researchReports, { fields: [researchSources.report_id], references: [researchReports.id] }),
}));

export const researchFindingsRelations = relations(researchFindings, ({ one }) => ({
  organization: one(organizations, { fields: [researchFindings.organization_id], references: [organizations.id] }),
  report: one(researchReports, { fields: [researchFindings.report_id], references: [researchReports.id] }),
  source: one(researchSources, { fields: [researchFindings.source_id], references: [researchSources.id] }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  organization: one(organizations, { fields: [campaigns.organization_id], references: [organizations.id] }),
  prospects: many(campaignProspects),
}));

export const campaignProspectsRelations = relations(campaignProspects, ({ one }) => ({
  campaign: one(campaigns, { fields: [campaignProspects.campaign_id], references: [campaigns.id] }),
  prospect: one(prospects, { fields: [campaignProspects.prospect_id], references: [prospects.id] }),
}));

export const outreachPackagesRelations = relations(outreachPackages, ({ one, many }) => ({
  organization: one(organizations, { fields: [outreachPackages.organization_id], references: [organizations.id] }),
  prospect: one(prospects, { fields: [outreachPackages.prospect_id], references: [prospects.id] }),
  campaign: one(campaigns, { fields: [outreachPackages.campaign_id], references: [campaigns.id] }),
  researchReport: one(researchReports, { fields: [outreachPackages.research_report_id], references: [researchReports.id] }),
  messages: many(outreachMessages),
  followUpSequences: many(followUpSequences),
}));

export const outreachMessagesRelations = relations(outreachMessages, ({ one }) => ({
  organization: one(organizations, { fields: [outreachMessages.organization_id], references: [organizations.id] }),
  package: one(outreachPackages, { fields: [outreachMessages.package_id], references: [outreachPackages.id] }),
  prospect: one(prospects, { fields: [outreachMessages.prospect_id], references: [prospects.id] }),
}));

export const followUpSequencesRelations = relations(followUpSequences, ({ one, many }) => ({
  organization: one(organizations, { fields: [followUpSequences.organization_id], references: [organizations.id] }),
  package: one(outreachPackages, { fields: [followUpSequences.package_id], references: [outreachPackages.id] }),
  prospect: one(prospects, { fields: [followUpSequences.prospect_id], references: [prospects.id] }),
  steps: many(followUpSteps),
}));

export const followUpStepsRelations = relations(followUpSteps, ({ one }) => ({
  organization: one(organizations, { fields: [followUpSteps.organization_id], references: [organizations.id] }),
  sequence: one(followUpSequences, { fields: [followUpSteps.sequence_id], references: [followUpSequences.id] }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  organization: one(organizations, { fields: [integrations.organization_id], references: [organizations.id] }),
  user: one(users, { fields: [integrations.user_id], references: [users.id] }),
}));

export const gmailAccountsRelations = relations(gmailAccounts, ({ one }) => ({
  organization: one(organizations, { fields: [gmailAccounts.organization_id], references: [organizations.id] }),
  user: one(users, { fields: [gmailAccounts.user_id], references: [users.id] }),
  integration: one(integrations, { fields: [gmailAccounts.integration_id], references: [integrations.id] }),
}));

export const aiRunsRelations = relations(aiRuns, ({ one }) => ({
  organization: one(organizations, { fields: [aiRuns.organization_id], references: [organizations.id] }),
  user: one(users, { fields: [aiRuns.user_id], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, { fields: [auditLogs.organization_id], references: [organizations.id] }),
  user: one(users, { fields: [auditLogs.user_id], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  organization: one(organizations, { fields: [notifications.organization_id], references: [organizations.id] }),
  user: one(users, { fields: [notifications.user_id], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, { fields: [subscriptions.organization_id], references: [organizations.id] }),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  organization: one(organizations, { fields: [jobs.organization_id], references: [organizations.id] }),
  user: one(users, { fields: [jobs.user_id], references: [users.id] }),
}));
