import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * The mark is a "ç": the letter Portuguese and French share, set in Spectral
 * italic on fountain-pen ink.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-primary text-primary-foreground font-fr inline-grid size-8 shrink-0 place-items-center rounded-[0.6rem] text-[1.35rem] leading-none italic",
        className,
      )}
    >
      <span className="-mt-1">ç</span>
    </span>
  );
}

export function Wordmark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark />
      {!compact && (
        <span lang="fr" className="font-fr text-[1.15rem] font-semibold tracking-tight">
          {brand.name}
        </span>
      )}
      {compact && <span className="sr-only">{brand.name}</span>}
    </span>
  );
}
