import type { BadgeProps } from "@/components/ui/badge";

type StatusVariant = NonNullable<BadgeProps["variant"]>;

const STATUS_VARIANTS: Record<string, StatusVariant> = {
  // prospects
  NEW: "neutral",
  RESEARCHING: "info",
  RESEARCHED: "brand",
  DRAFTING: "warning",
  REVIEWING: "warning",
  APPROVED: "success",
  SENT: "brand",
  REPLIED: "success",
  // campaigns, packages, reports
  ACTIVE: "success",
  COMPLETED: "info",
  PAUSED: "warning",
  ARCHIVED: "neutral",
  DRAFT: "neutral",
  FAILED: "danger",
  REJECTED: "danger",
  // roles / billing
  OWNER: "brand",
  ADMIN: "danger",
  MANAGER: "info",
  SALES_REP: "success",
  VIEWER: "neutral",
  TRIALING: "warning",
  CANCELED: "danger",
  PAST_DUE: "danger",
};

export function statusVariant(status: string): StatusVariant {
  return STATUS_VARIANTS[status?.toUpperCase?.() ?? ""] ?? "neutral";
}

export function humanizeStatus(status: string): string {
  if (!status) return "—";
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
