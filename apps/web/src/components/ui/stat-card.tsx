import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/ui/sparkline";
import { Skeleton } from "@/components/ui/skeleton";

export type StatTone = "brand" | "success" | "warning" | "danger" | "info";

const TONE_BG: Record<StatTone, string> = {
  brand: "bg-brand-soft text-brand border-brand/20",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/20",
  danger: "bg-danger-soft text-danger border-danger/20",
  info: "bg-info-soft text-info border-info/20",
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  series,
  hint,
  tone = "brand",
  loading = false,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number | null;
  series?: number[];
  hint?: string;
  tone?: StatTone;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-card border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
        <Skeleton className="mt-4 h-8 w-16" />
        <Skeleton className="mt-3 h-8 w-full" />
      </div>
    );
  }

  const hasTrend = typeof trend === "number" && Number.isFinite(trend);
  const up = hasTrend && trend > 0;
  const down = hasTrend && trend < 0;
  const flat = hasTrend && trend === 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-card border border-line bg-surface p-5 shadow-card",
        "transition-colors hover:border-line-strong"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted">{label}</p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg border [&_svg]:size-4",
            TONE_BG[tone]
          )}
        >
          {icon}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {hasTrend ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
              up && "border-success/25 bg-success-soft text-success",
              down && "border-danger/25 bg-danger-soft text-danger",
              flat && "border-line-strong bg-elevated text-subtle"
            )}
          >
            {up ? <ArrowUpRight className="size-3" /> : null}
            {down ? <ArrowDownRight className="size-3" /> : null}
            {up ? "+" : ""}
            {trend}%
          </span>
        ) : null}
      </div>

      {series ? (
        <div className="-mx-1 mt-3">
          <Sparkline data={series} tone={tone} />
        </div>
      ) : null}

      {hint ? <p className="mt-1.5 text-[11px] text-subtle">{hint}</p> : null}
    </div>
  );
}
