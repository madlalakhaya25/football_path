import { cn } from "@/lib/utils";

interface RatingRingProps {
  /** Overall rating 0–100. */
  value: number;
  size?: number;
  label?: string;
  className?: string;
}

function ratingColor(value: number) {
  if (value >= 80) return "var(--rating-high)";
  if (value >= 65) return "var(--rating-mid)";
  return "var(--rating-low)";
}

/** Circular overall-rating gauge (the signature "78 Overall" badge). */
export function RatingRing({
  value,
  size = 96,
  label = "Overall",
  className,
}: RatingRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const stroke = Math.max(5, Math.round(size * 0.08));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ratingColor(clamped)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-2xl font-bold tabular-nums">{clamped}</span>
        <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
