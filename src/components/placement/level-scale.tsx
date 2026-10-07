import { CEFR_LEVELS, readTheta, SCALE_MAX } from "@/lib/learning/cefr";
import { cn } from "@/lib/utils";

/**
 * A skill estimate on the A0–C1 scale: a marker at the estimate and a band for
 * ±1 SD, so uncertainty is visible instead of hidden behind a single label.
 * The text label next to it carries the same information (never color alone).
 */
export function LevelScale({
  theta,
  sd,
  muted = false,
  className,
}: {
  theta: number;
  sd: number;
  muted?: boolean;
  className?: string;
}) {
  const clamp = (value: number) => Math.min(Math.max(value, 0), SCALE_MAX);
  const pct = (value: number) => (clamp(value) / SCALE_MAX) * 100;
  const low = readTheta(theta - sd).level;
  const high = readTheta(theta + sd).level;
  const range = low === high ? `provavelmente ${low}` : `provavelmente entre ${low} e ${high}`;
  return (
    <div className={cn("w-full", className)} title={range}>
      <div className="relative h-3" role="img" aria-label={range}>
        <div className="absolute inset-0 flex gap-[2px]">
          {CEFR_LEVELS.map((level) => (
            <span
              key={level}
              className="bg-muted h-full flex-1 first:rounded-l-full last:rounded-r-full"
            />
          ))}
        </div>
        <span
          className={cn(
            "absolute inset-y-0 rounded-full",
            muted ? "bg-muted-foreground/25" : "bg-primary/25",
          )}
          style={{ left: `${pct(theta - sd)}%`, width: `${pct(theta + sd) - pct(theta - sd)}%` }}
        />
        <span
          className={cn(
            "ring-background absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2",
            muted ? "bg-muted-foreground" : "bg-primary",
          )}
          style={{ left: `${pct(theta)}%` }}
        />
      </div>
      <div className="text-muted-foreground mt-1 flex text-[0.7rem]" aria-hidden>
        {CEFR_LEVELS.map((level) => (
          <span key={level} className="flex-1 text-center">
            {level}
          </span>
        ))}
      </div>
    </div>
  );
}
