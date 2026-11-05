"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { cn, formatDate } from "@/lib/utils";
import { statusVariant } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { Campaign } from "@/components/dashboard/types";

const PIPELINE: Array<{ key: string; label: string; color: string }> = [
  { key: "NEW", label: "New", color: "bg-subtle" },
  { key: "RESEARCHING", label: "Researching", color: "bg-info" },
  { key: "RESEARCHED", label: "Researched", color: "bg-brand" },
  { key: "DRAFTED", label: "Drafted", color: "bg-warning" },
  { key: "REVIEW", label: "In review", color: "bg-orange-400" },
  { key: "APPROVED", label: "Approved", color: "bg-success" },
  { key: "SENT", label: "Sent", color: "bg-emerald-500" },
  { key: "REPLIED", label: "Replied", color: "bg-teal-400" },
];

function PipelineBar({ counts }: { counts: Record<string, number> }) {
  const total = PIPELINE.reduce((sum, stage) => sum + (counts[stage.key] ?? 0), 0);

  if (total === 0) {
    return (
      <div className="space-y-3">
        <div className="h-2.5 w-full rounded-full bg-elevated" />
        <p className="text-xs text-subtle">
          Pipeline distribution appears once prospects enter research.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-elevated">
        {PIPELINE.filter((stage) => (counts[stage.key] ?? 0) > 0).map((stage) => (
          <div
            key={stage.key}
            className={cn("h-full", stage.color)}
            style={{ width: `${((counts[stage.key] ?? 0) / total) * 100}%` }}
            title={`${stage.label}: ${counts[stage.key]}`}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {PIPELINE.map((stage) => (
          <li key={stage.key} className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className={cn("size-1.5 rounded-full", stage.color)} aria-hidden />
            {stage.label}
            <span className="tabular-nums text-subtle">{counts[stage.key] ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CampaignChartIllustration() {
  return (
    <svg width="132" height="72" viewBox="0 0 132 72" fill="none" aria-hidden>
      <defs>
        <linearGradient id="campaign-empty-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="131" height="71" rx="10" stroke="var(--color-line)" />
      <path
        d="M12 52C26 52 30 40 42 40C54 40 58 46 70 34C82 22 88 28 100 20C110 13 116 16 120 14V60H12V52Z"
        fill="url(#campaign-empty-fill)"
      />
      <path
        d="M12 52C26 52 30 40 42 40C54 40 58 46 70 34C82 22 88 28 100 20C110 13 116 16 120 14"
        stroke="var(--color-brand)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="70" cy="34" r="3" fill="var(--color-brand)" />
      <circle cx="70" cy="34" r="6" stroke="var(--color-brand)" strokeOpacity="0.3" />
      <path d="M12 60H120" stroke="var(--color-line-strong)" strokeDasharray="3 4" />
    </svg>
  );
}

export function CampaignPerformance({
  campaigns,
  loading,
  prospectsByStatus,
}: {
  campaigns: Campaign[];
  loading: boolean;
  prospectsByStatus: Record<string, number>;
}) {
  const [tab, setTab] = React.useState("all");

  const filtered = React.useMemo(() => {
    if (tab === "active") return campaigns.filter((item) => item.status === "ACTIVE");
    if (tab === "completed") return campaigns.filter((item) => item.status === "COMPLETED");
    return campaigns;
  }, [campaigns, tab]);

  const counts = {
    all: campaigns.length,
    active: campaigns.filter((item) => item.status === "ACTIVE").length,
    completed: campaigns.filter((item) => item.status === "COMPLETED").length,
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Campaign performance</CardTitle>
          <p className="mt-0.5 text-xs text-muted">
            Pipeline health across every prospect in the workspace.
          </p>
        </div>
        <Tabs
          value={tab}
          onValueChange={setTab}
          items={[
            { value: "all", label: "All", count: counts.all },
            { value: "active", label: "Active", count: counts.active },
            { value: "completed", label: "Completed", count: counts.completed },
          ]}
        />
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        <PipelineBar counts={prospectsByStatus} />

        <div className="h-px bg-line" />

        <div className="flex-1">
          {loading ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-line bg-elevated/40 p-3"
                >
                  <Skeleton className="size-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              illustration={<CampaignChartIllustration />}
              title={tab === "all" ? "No campaigns yet" : `No ${tab} campaigns`}
              description={
                tab === "all"
                  ? "Campaigns group prospects around one product or motion, so you can measure replies per offer."
                  : "Nothing in this state right now. Switch tabs to see the rest of your pipeline."
              }
              action={
                tab === "all" ? (
                  <Link
                    href="/campaigns?new=1"
                    className={buttonVariants({ variant: "primary", size: "sm" })}
                  >
                    <Plus />
                    Create your first campaign
                  </Link>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setTab("all")}>
                    View all campaigns
                  </Button>
                )
              }
            />
          ) : (
            <ul className="space-y-2">
              {filtered.map((campaign) => (
                <li key={campaign.id}>
                  <div className="group flex items-center gap-3 rounded-lg border border-line bg-elevated/40 p-3 transition-colors hover:border-line-strong hover:bg-hover/60">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-subtle">
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
                        <path
                          d="M4 9v6h3l5 4V5L7 9H4zM16 8.5a4 4 0 010 7"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {campaign.name}
                      </p>
                      <p className="truncate text-[11px] text-subtle">
                        {campaign.product_service || campaign.description || "No description"}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-[11px] text-subtle">Created</p>
                      <p className="text-[11px] text-muted">{formatDate(campaign.created_at)}</p>
                    </div>
                    <Badge variant={statusVariant(campaign.status)} dot>
                      {campaign.status}
                    </Badge>
                    <ArrowRight className="size-3.5 shrink-0 text-transparent transition-colors group-hover:text-muted" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-[11px] text-subtle">
            {counts.active} active · {campaigns.length} total
          </span>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-muted transition-colors hover:text-foreground"
          >
            Manage campaigns
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
