import {
  UserRole,
  ProspectStatus,
  MessageStatus,
} from "./enums";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.OWNER]: 5,
  [UserRole.ADMIN]: 4,
  [UserRole.MANAGER]: 3,
  [UserRole.SALES_REP]: 2,
  [UserRole.VIEWER]: 1,
} as const;

export const ROLE_PERMISSIONS = {
  [UserRole.OWNER]: [
    "organization:manage",
    "team:manage",
    "user:manage",
    "prospect:all",
    "research:all",
    "outreach:all",
    "campaign:all",
    "integration:manage",
    "billing:manage",
    "audit:read",
    "settings:manage",
  ],
  [UserRole.ADMIN]: [
    "team:manage",
    "user:manage",
    "prospect:all",
    "research:all",
    "outreach:all",
    "campaign:all",
    "integration:manage",
    "audit:read",
    "settings:read",
  ],
  [UserRole.MANAGER]: [
    "prospect:all",
    "research:all",
    "outreach:all",
    "campaign:all",
    "audit:read",
  ],
  [UserRole.SALES_REP]: [
    "prospect:own",
    "research:own",
    "outreach:own",
    "campaign:read",
  ],
  [UserRole.VIEWER]: [
    "prospect:read",
    "research:read",
    "outreach:read",
    "campaign:read",
  ],
} as const;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PROSPECT_TRANSITIONS: Record<ProspectStatus, ProspectStatus[]> = {
  [ProspectStatus.NEW]: [ProspectStatus.RESEARCHING, ProspectStatus.DISQUALIFIED],
  [ProspectStatus.RESEARCHING]: [ProspectStatus.RESEARCHED, ProspectStatus.DISQUALIFIED],
  [ProspectStatus.RESEARCHED]: [ProspectStatus.DRAFTED, ProspectStatus.DISQUALIFIED],
  [ProspectStatus.DRAFTED]: [ProspectStatus.REVIEW, ProspectStatus.DISQUALIFIED],
  [ProspectStatus.REVIEW]: [ProspectStatus.APPROVED, ProspectStatus.DRAFTED, ProspectStatus.DISQUALIFIED],
  [ProspectStatus.APPROVED]: [ProspectStatus.SENT],
  [ProspectStatus.SENT]: [ProspectStatus.REPLIED, ProspectStatus.DISQUALIFIED],
  [ProspectStatus.REPLIED]: [ProspectStatus.MEETING],
  [ProspectStatus.MEETING]: [ProspectStatus.CLOSED, ProspectStatus.DISQUALIFIED],
  [ProspectStatus.CLOSED]: [],
  [ProspectStatus.DISQUALIFIED]: [],
};

export const MESSAGE_TRANSITIONS: Record<MessageStatus, MessageStatus[]> = {
  [MessageStatus.DRAFT]: [MessageStatus.AI_REVIEW, MessageStatus.REJECTED],
  [MessageStatus.AI_REVIEW]: [MessageStatus.HUMAN_REVIEW, MessageStatus.REJECTED],
  [MessageStatus.HUMAN_REVIEW]: [MessageStatus.APPROVED, MessageStatus.REJECTED, MessageStatus.DRAFT],
  [MessageStatus.APPROVED]: [MessageStatus.SENT, MessageStatus.REJECTED],
  [MessageStatus.REJECTED]: [MessageStatus.DRAFT],
  [MessageStatus.SENT]: [MessageStatus.BOUNCED, MessageStatus.COMPLAINED],
  [MessageStatus.BOUNCED]: [],
  [MessageStatus.COMPLAINED]: [],
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_NAME_LENGTH = 500;

export const AI_MODELS = {
  RESEARCH: "gpt-4o",
  GENERATION: "gpt-4o",
  ANALYSIS: "gpt-4o-mini",
  CRITIC: "gpt-4o",
} as const;

export const TOKEN_BUDGETS = {
  RESEARCH_PLANNER: 2000,
  RESEARCHER: 4000,
  SIGNAL_ANALYST: 3000,
  PERSONALIZATION: 2000,
  WRITER: 3000,
  CRITIC: 2000,
  COMPLIANCE: 1500,
} as const;

export const EMAIL_LENGTH = {
  MIN: 50,
  TARGET_MIN: 50,
  TARGET_MAX: 150,
  MAX: 300,
} as const;

export const LINKEDIN_LENGTH = {
  MIN: 20,
  TARGET_MIN: 30,
  TARGET_MAX: 100,
  MAX: 200,
} as const;
