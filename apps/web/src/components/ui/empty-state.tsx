import * as React from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
  className,
}: {
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  variant?: "default" | "compact";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-elevated/40 text-center",
        variant === "compact" ? "gap-3 px-6 py-8" : "gap-4 px-6 py-14",
        className
      )}
    >
      {illustration ? (
        <div className="mb-1">{illustration}</div>
      ) : (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl border border-line bg-elevated text-brand",
            variant === "compact" ? "size-10" : "size-12"
          )}
        >
          <span className="absolute inset-0 rounded-2xl bg-brand/10 blur-md" aria-hidden />
          <span className="relative [&_svg]:size-5">{icon}</span>
        </div>
      )}

      <div className="max-w-sm space-y-1.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-[13px] leading-relaxed text-muted">{description}</p>
      </div>

      {action || secondaryAction ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
