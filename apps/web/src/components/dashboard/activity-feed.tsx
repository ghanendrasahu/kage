"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Check,
  FileText,
  LogIn,
  Mail,
  Plug,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { cn, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditLog } from "@/components/dashboard/types";

const ACTION_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; tone: string; verb: string }
> = {
  CREATE: { icon: Plus, tone: "text-brand border-brand/25 bg-brand-soft", verb: "created" },
  READ: { icon: Search, tone: "text-info border-info/25 bg-info-soft", verb: "viewed" },
  UPDATE: { icon: FileText, tone: "text-info border-info/25 bg-info-soft", verb: "updated" },
  DELETE: { icon: Trash2, tone: "text-danger border-danger/25 bg-danger-soft", verb: "deleted" },
  APPROVE: { icon: Check, tone: "text-success border-success/25 bg-success-soft", verb: "approved" },
  REJECT: { icon: X, tone: "text-danger border-danger/25 bg-danger-soft", verb: "rejected" },
  SEND: { icon: Send, tone: "text-success border-success/25 bg-success-soft", verb: "sent" },
  LOGIN: { icon: LogIn, tone: "text-muted border-line-strong bg-elevated", verb: "signed in" },
  LOGOUT: { icon: LogIn, tone: "text-muted border-line-strong bg-elevated", verb: "signed out" },
  CONNECT: { icon: Plug, tone: "text-success border-success/25 bg-success-soft", verb: "connected" },
  DISCONNECT: { icon: Plug, tone: "text-danger border-danger/25 bg-danger-soft", verb: "disconnected" },
  // Legacy action names kept so an older deployment still renders sensibly.
  PROSPECT_CREATED: { icon: UserPlus, tone: "text-brand border-brand/25 bg-brand-soft", verb: "created" },
  RESEARCH_STARTED: { icon: Search, tone: "text-info border-info/25 bg-info-soft", verb: "researched" },
  OUTREACH_GENERATED: { icon: Sparkles, tone: "text-brand border-brand/25 bg-brand-soft", verb: "drafted" },
  MESSAGE_APPROVED: { icon: Check, tone: "text-success border-success/25 bg-success-soft", verb: "approved" },
  MESSAGE_REJECTED: { icon: X, tone: "text-danger border-danger/25 bg-danger-soft", verb: "rejected" },
  EMAIL_SENT: { icon: Send, tone: "text-success border-success/25 bg-success-soft", verb: "sent" },
};

const RESOURCE_LABEL: Record<string, string> = {
  PROSPECT: "Prospect",
  RESEARCH_REPORT: "Research report",
  OUTREACH_PACKAGE: "Outreach package",
  EMAIL_MESSAGE: "Message",
  CAMPAIGN: "Campaign",
  USER: "User",
  INTEGRATION: "Integration",
  GMAIL: "Gmail",
};

function resourceLabel(resourceType: string): string {
  return (
    RESOURCE_LABEL[resourceType] ??
    resourceType
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

/**
 * Prefer human identifiers captured in `details` over a raw UUID. Falls back to
 * a short id so old entries (written before details were recorded) stay useful.
 */
function logSummary(log: AuditLog): string {
  const details = log.details ?? {};
  const person = typeof details["person_name"] === "string" ? details["person_name"] : null;
  const company = typeof details["company_name"] === "string" ? details["company_name"] : null;
  const subject = typeof details["subject"] === "string" ? details["subject"] : null;

  if (person && company) return `${person} · ${company}`;
  if (person) return person;
  if (subject) return subject;
  if (company) return company;
  if (log.resource_id) return `ID ${log.resource_id.slice(0, 8)}`;
  return "Workspace";
}

const QUICK_LINKS = [
  { href: "/prospects/new", label: "Add a prospect", icon: UserPlus },
  { href: "/research", label: "Run account research", icon: Search },
  { href: "/campaigns?new=1", label: "Create a campaign", icon: Plus },
];

export function ActivityFeed({
  logs,
  loading,
}: {
  logs: AuditLog[];
  loading: boolean;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Recent activity</CardTitle>
          <p className="mt-0.5 text-xs text-muted">Live audit stream for this workspace.</p>
        </div>
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-4 p-5">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="size-7 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-4">
            <EmptyState
              variant="compact"
              icon={<Activity />}
              title="No recent activity"
              description="Actions across prospects, research and outreach will stream here as your team works."
              action={
                <Link
                  href="/prospects"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-line-strong hover:bg-hover"
                >
                  <Users className="size-3.5" />
                  View prospects
                </Link>
              }
            />

            <div className="mt-4 space-y-1">
              <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
                Quick actions
              </p>
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-[12px] text-muted transition-colors hover:text-foreground"
                  >
                    <span className="flex size-6 items-center justify-center rounded-md border border-line bg-elevated text-subtle group-hover:text-brand">
                      <Icon className="size-3.5" />
                    </span>
                    {link.label}
                    <ArrowRight className="ml-auto size-3.5 text-transparent transition-colors group-hover:text-subtle" />
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <ol className="relative max-h-[420px] overflow-y-auto p-5">
            <span
              className="absolute bottom-6 left-[34px] top-7 w-px bg-line"
              aria-hidden
            />
            {logs.slice(0, 8).map((log) => {
              const meta = ACTION_META[log.action] ?? {
                icon: Activity,
                tone: "text-muted border-line-strong bg-elevated",
                verb: "changed",
              };
              const Icon = meta.icon;
              const label = resourceLabel(log.resource_type);

              return (
                <li key={log.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border [&_svg]:size-3.5",
                      meta.tone
                    )}
                  >
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium leading-5 text-foreground">
                      {label} {meta.verb}
                    </p>
                    <p className="truncate text-[11px] text-subtle">
                      {logSummary(log)}
                    </p>
                  </div>
                  <time className="shrink-0 pt-1 text-[10px] tabular-nums text-subtle">
                    {timeAgo(log.created_at)}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>

      <div className="border-t border-line px-5 py-3">
        <Link
          href="/audit"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-muted transition-colors hover:text-foreground"
        >
          <Mail className="size-3.5" />
          View full audit log
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Card>
  );
}
