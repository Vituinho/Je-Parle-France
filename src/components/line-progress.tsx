import { cn } from "@/lib/utils";

export type StationState = "done" | "current" | "upcoming";

export interface Station {
  id: string;
  label: React.ReactNode;
  detail?: React.ReactNode;
  state: StationState;
}

/**
 * Progress drawn as a métro line: stations joined by a track. Used for the
 * learner's path (levels, units) and for steps inside a lesson. The list is an
 * ordered sequence, so it is rendered as <ol> with aria-current on the
 * current station.
 */
export function LineProgress({
  stations,
  orientation = "horizontal",
  className,
  showLabels = true,
  ariaLabel,
}: {
  stations: Station[];
  orientation?: "horizontal" | "vertical";
  className?: string;
  showLabels?: boolean;
  ariaLabel?: string;
}) {
  const vertical = orientation === "vertical";
  return (
    <ol
      aria-label={ariaLabel}
      className={cn("relative flex", vertical ? "flex-col gap-0" : "w-full items-start", className)}
    >
      {stations.map((station, index) => {
        const last = index === stations.length - 1;
        const trackDone = station.state === "done";
        return (
          <li
            key={station.id}
            aria-current={station.state === "current" ? "step" : undefined}
            className={cn(
              "relative flex",
              vertical ? "min-h-14 gap-4 pb-2" : "flex-1 flex-col items-center",
            )}
          >
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute rounded-full",
                  vertical
                    ? "top-5 bottom-0 left-[9px] w-[3px]"
                    : "top-[9px] right-0 left-1/2 h-[3px] translate-x-[10px]",
                  !vertical && "w-[calc(100%-20px)]",
                  trackDone ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "relative z-10 grid size-[21px] shrink-0 place-items-center rounded-full border-[3px] transition-colors",
                station.state === "done" && "border-primary bg-primary",
                station.state === "current" &&
                  "border-primary bg-background ring-primary/20 ring-4",
                station.state === "upcoming" && "border-border bg-background",
              )}
            >
              {station.state === "current" && (
                <span className="bg-primary size-[7px] rounded-full" />
              )}
            </span>
            {showLabels ? (
              <span
                className={cn(
                  vertical ? "pt-0.5" : "mt-2 max-w-[9rem] px-1 text-center",
                  "text-sm leading-tight",
                  station.state === "upcoming" ? "text-muted-foreground" : "text-foreground",
                  station.state === "current" && "font-semibold",
                )}
              >
                {station.label}
                {station.detail && (
                  <span className="text-muted-foreground mt-0.5 block text-xs font-normal">
                    {station.detail}
                  </span>
                )}
              </span>
            ) : (
              <span className="sr-only">{station.label}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
