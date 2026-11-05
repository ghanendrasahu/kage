import { CheckCheck, Search, Send, Sparkles } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { momentum } from "@/lib/series";
import type { Analytics } from "@/components/dashboard/types";

export function KpiGrid({
  analytics,
  loading,
}: {
  analytics: Analytics | null;
  loading: boolean;
}) {
  const overview = analytics?.overview;
  const series = analytics?.timeseries;
  const rates = analytics?.rates;
  const messages = analytics?.messagesByStatus ?? {};

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Prospects researched"
        value={overview?.totalResearch ?? 0}
        icon={<Search />}
        tone="brand"
        trend={momentum(series?.research)}
        series={series?.research}
        hint="AI research reports completed"
        loading={loading}
      />
      <StatCard
        label="Messages generated"
        value={overview?.totalMessages ?? 0}
        icon={<Sparkles />}
        tone="info"
        trend={momentum(series?.messagesGenerated)}
        series={series?.messagesGenerated}
        hint={`${analytics?.recentActivity.messagesGenerated ?? 0} drafted in the last 30 days`}
        loading={loading}
      />
      <StatCard
        label="Messages approved"
        value={messages["APPROVED"] ?? 0}
        icon={<CheckCheck />}
        tone="success"
        trend={momentum(series?.messagesApproved)}
        series={series?.messagesApproved}
        hint={`${rates?.approvalRate ?? 0}% approval rate`}
        loading={loading}
      />
      <StatCard
        label="Messages sent"
        value={messages["SENT"] ?? 0}
        icon={<Send />}
        tone="warning"
        trend={momentum(series?.messagesSent)}
        series={series?.messagesSent}
        hint={`${rates?.sendRate ?? 0}% of approved messages sent`}
        loading={loading}
      />
    </div>
  );
}
