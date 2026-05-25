import { z } from "zod";
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
} from "./enums";

export const UserRoleSchema = z.nativeEnum(UserRole);
export const ProspectStatusSchema = z.nativeEnum(ProspectStatus);
export const JobStatusSchema = z.nativeEnum(JobStatus);
export const OutreachChannelSchema = z.nativeEnum(OutreachChannel);
export const MessageStatusSchema = z.nativeEnum(MessageStatus);
export const ResearchSourceTypeSchema = z.nativeEnum(ResearchSourceType);
export const SignalTypeSchema = z.nativeEnum(SignalType);
export const IntegrationTypeSchema = z.nativeEnum(IntegrationType);
export const SubscriptionStatusSchema = z.nativeEnum(SubscriptionStatus);
export const CampaignStatusSchema = z.nativeEnum(CampaignStatus);
export const AuditActionSchema = z.nativeEnum(AuditAction);

export const UuidSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const UrlSchema = z.string().url();
export const DateSchema = z.string().datetime();
export const NonEmptyStringSchema = z.string().min(1).max(10000);

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const SortOrderSchema = z.enum(["asc", "desc"]);

export const ConfidenceSchema = z.number().min(0).max(1);

export const ScoreSchema = z.number().min(0).max(100);
