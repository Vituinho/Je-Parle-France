import { cn } from "@/lib/utils";

interface Day {
  date: string;
  seconds: number;
  minutes: number;
  reviews: number;
  active: boolean;
}

const dateLabel = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const weekdayLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const asDate = (date: string) => new Date(`${date}T12:00:00Z`);

/**
 * Minutes studied per day over four weeks. Bars are focusable and show their
 * value on hover/focus; a table carries the same data for screen readers.
 */
export function ActivityChart({ days, goalMinutes }: { days: Day[]; goalMinutes: number }) {
  const max = Math.max(goalMinutes, ...days.map((day) => day.seconds / 60), 5);
  const label = (day: Day) =>
    day.seconds > 0 && day.minutes === 0 ? "< 1 min" : `${day.minutes} min`;
  const goalTop = 100 - (goalMinutes / max) * 100;
  return (
    <figure className="space-y-3">
      <div className="relative">
        <div
          aria-hidden
          className="border-muted-foreground/40 absolute inset-x-0 border-t border-dashed"
          style={{ top: `${goalTop}%` }}
        >
          <span className="text-muted-foreground bg-background absolute -top-2.5 right-0 pl-1 text-xs">
            meta diária: {goalMinutes} min
          </span>
        </div>
        <ol aria-hidden className="grid h-40 grid-cols-28 items-end gap-[3px] sm:gap-1">
          {days.map((day) => (
            <li key={day.date} className="group relative flex h-full items-end">
              <span
                tabIndex={0}
                className={cn(
                  "focus-visible:outline-ring block w-full rounded-t-[4px] outline-offset-2 transition-opacity focus-visible:outline-2",
                  day.seconds === 0
                    ? "bg-border h-[2px] rounded-[2px]"
                    : day.active
                      ? "bg-primary"
                      : "bg-primary/35",
                )}
                style={
                  day.seconds > 0
                    ? { height: `${Math.max(3, (day.seconds / 60 / max) * 100)}%` }
                    : undefined
                }
              />
              <span className="bg-foreground text-background pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md px-2 py-1 text-xs whitespace-nowrap group-focus-within:block group-hover:block">
                {dateLabel.format(asDate(day.date))}: {label(day)}
                {day.reviews > 0 && ` · ${day.reviews} revisões`}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div
        aria-hidden
        className="text-muted-foreground grid grid-cols-28 gap-[3px] text-[0.65rem] sm:gap-1"
      >
        {days.map((day, index) => (
          <span key={day.date} className="text-center">
            {index % 7 === 0 || index === days.length - 1
              ? dateLabel.format(asDate(day.date)).replace(" de ", " ").replace(".", "")
              : ""}
          </span>
        ))}
      </div>
      <figcaption className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span className="flex items-center gap-2">
          <span aria-hidden className="bg-primary size-3 rounded-[3px]" /> dia ativo (2 min ou mais,
          ou sessão concluída)
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="bg-primary/35 size-3 rounded-[3px]" /> estudo curto
        </span>
      </figcaption>
      <table className="sr-only">
        <caption>Minutos de estudo por dia nas últimas quatro semanas</caption>
        <thead>
          <tr>
            <th scope="col">Dia</th>
            <th scope="col">Tempo</th>
            <th scope="col">Revisões</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <th scope="row">
                {weekdayLabel.format(asDate(day.date))}, {dateLabel.format(asDate(day.date))}
              </th>
              <td>{label(day)}</td>
              <td>{day.reviews}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
