import { cn } from "@/lib/utils";

/**
 * Inline sparkline. Renders a smooth area + line, and falls back to a neutral
 * flat baseline when there is no data (never invents a shape).
 */
export function Sparkline({
  data,
  className,
  tone = "brand",
}: {
  data: number[];
  className?: string;
  tone?: "brand" | "success" | "warning" | "danger" | "info";
}) {
  const width = 120;
  const height = 34;
  const padding = 2;

  const safe = data.length >= 2 ? data : [0, 0];
  const max = Math.max(...safe);
  const min = Math.min(...safe);
  const range = max - min || 1;
  const step = (width - padding * 2) / (safe.length - 1);

  const points = safe.map((value, index) => {
    const x = padding + index * step;
    const y =
      max === min
        ? height - padding - 4
        : height - padding - ((value - min) / range) * (height - padding * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;

  const stroke = {
    brand: "var(--color-brand)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
    info: "var(--color-info)",
  }[tone];

  const gradientId = `spark-${tone}`;
  const flat = max === 0 && min === 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-9 w-full", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={flat ? 0 : 0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      {!flat ? <polygon points={area} fill={`url(#${gradientId})`} /> : null}
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth={flat ? 1 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={flat ? "4 4" : undefined}
        opacity={flat ? 0.45 : 1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
