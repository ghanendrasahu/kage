import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-elevated",
        "bg-[linear-gradient(90deg,var(--color-elevated)_25%,var(--color-hover)_37%,var(--color-elevated)_63%)]",
        "bg-[length:400%_100%] animate-shimmer",
        className
      )}
    />
  );
}

export function StatSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-8 w-16" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}
