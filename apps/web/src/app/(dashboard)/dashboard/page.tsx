"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Plus, Users } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { CampaignPerformance } from "@/components/dashboard/campaign-performance";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import type { Analytics, AuditLog, Campaign } from "@/components/dashboard/types";

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    async function load() {
      const [analyticsData, campaignsData, logsData] = await Promise.all([
        getJson<Analytics>("/api/analytics"),
        getJson<{ campaigns: Campaign[] }>("/api/campaigns"),
        getJson<{ logs: AuditLog[] }>("/api/audit-logs?page=1&limit=8"),
      ]);

      if (!active) return;
      setAnalytics(analyticsData);
      setCampaigns(campaignsData?.campaigns ?? []);
      setLogs(logsData?.logs ?? []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Where the pipeline stands right now — research coverage, message throughput, and what your team touched last."
        actions={
          <>
            <span className="hidden items-center gap-1.5 rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs text-muted sm:inline-flex">
              <CalendarDays className="size-3.5 text-subtle" />
              Last 7 days
            </span>
            <Link
              href="/prospects"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <Users />
              Prospects
            </Link>
            <Link
              href="/campaigns?new=1"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              <Plus />
              New campaign
            </Link>
          </>
        }
      />

      <KpiGrid analytics={analytics} loading={loading} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CampaignPerformance
            campaigns={campaigns}
            loading={loading}
            prospectsByStatus={analytics?.prospectsByStatus ?? {}}
          />
        </div>
        <ActivityFeed logs={logs} loading={loading} />
      </div>
    </div>
  );
}
