import { cn } from "@/lib/utils";

/** KAGE mark: a faceted "K" cut from a rounded square. */
export function KageMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px]",
        "bg-[linear-gradient(145deg,#9a8cff_0%,#6d5ae6_55%,#4b3bb3_100%)]",
        "shadow-[0_6px_18px_-8px_rgba(139,124,255,0.95),inset_0_1px_0_rgba(255,255,255,0.35)]",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-4 text-[#0b0716]" fill="none">
        <path
          d="M7 5.5v13M7 12.4l6.2-6.9M9.6 10.2l6.6 8.3"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function KageWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <KageMark />
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-[0.14em] text-foreground">
            KAGE
          </span>
          <span className="mt-1 text-[10px] font-medium tracking-[0.06em] text-subtle">
            OUTREACH OS
          </span>
        </span>
      ) : null}
    </span>
  );
}
