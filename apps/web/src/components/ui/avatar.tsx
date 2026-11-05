import { cn, initials } from "@/lib/utils";

const SIZES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
} as const;

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full",
        "border border-brand/30 bg-brand-soft font-semibold uppercase tracking-wide text-brand-strong",
        SIZES[size],
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
