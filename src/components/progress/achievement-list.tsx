import { Award } from "lucide-react";
import type { AchievementStatus } from "@/lib/learning/achievements";
import { cn } from "@/lib/utils";

const earnedDate = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" });

export function AchievementList({ achievements }: { achievements: AchievementStatus[] }) {
  const ordered = [...achievements].sort(
    (a, b) =>
      Number(b.earned) - Number(a.earned) ||
      (b.earnedAt ?? "").localeCompare(a.earnedAt ?? "") ||
      b.value / b.target - a.value / a.target,
  );
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {ordered.map((achievement) => (
        <li
          key={achievement.id}
          className={cn(
            "flex gap-3 rounded-2xl border px-4 py-3",
            achievement.earned ? "border-primary/40 bg-accent" : "border-border",
          )}
        >
          <Award
            aria-hidden
            className={cn(
              "mt-0.5 size-5 shrink-0",
              achievement.earned ? "text-primary" : "text-muted-foreground/50",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className={cn("font-semibold", !achievement.earned && "text-foreground/80")}>
              {achievement.title}
              <span className="sr-only">
                {achievement.earned ? " (conquistada)" : " (ainda não)"}
              </span>
            </p>
            <p className="text-muted-foreground text-sm leading-snug">{achievement.description}</p>
            {achievement.earned && achievement.earnedAt ? (
              <p className="text-primary mt-1 text-xs">
                Conquistada em {earnedDate.format(new Date(achievement.earnedAt))}
              </p>
            ) : achievement.target > 1 ? (
              <div className="mt-2 flex items-center gap-2">
                <span aria-hidden className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                  <span
                    className="bg-primary/70 block h-full rounded-full"
                    style={{ width: `${(achievement.value / achievement.target) * 100}%` }}
                  />
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {achievement.value} de {achievement.target}
                  {achievement.unit ? ` ${achievement.unit}` : ""}
                </span>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
