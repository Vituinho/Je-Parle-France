import { cn } from "@/lib/utils";
import type { StateGroup } from "@/server/services/progress";

const KIND_LABEL = {
  lexical: "Palavras e expressões",
  grammar: "Gramática",
  pronunciation: "Sons",
} as const;

/** One hue from light to dark for growing mastery; red only for "needs review". */
const SEGMENTS: { key: StateGroup; label: string; className: string }[] = [
  { key: "learning", label: "Aprendendo", className: "bg-primary/25" },
  { key: "familiar", label: "Familiar", className: "bg-primary/50" },
  { key: "strong", label: "Firme", className: "bg-primary/80" },
  { key: "mastered", label: "Dominado", className: "bg-primary" },
  { key: "decaying", label: "Precisa revisar", className: "bg-destructive/75" },
];

export interface MasteryRow {
  kind: keyof typeof KIND_LABEL;
  counts: Record<StateGroup, number>;
  total: number;
}

export function MasteryBars({ rows }: { rows: MasteryRow[] }) {
  return (
    <div className="space-y-6">
      <ul className="space-y-5">
        {rows.map((row) => {
          const met = SEGMENTS.reduce((sum, segment) => sum + row.counts[segment.key], 0);
          return (
            <li key={row.kind}>
              <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold">{KIND_LABEL[row.kind]}</span>
                <span className="text-muted-foreground">
                  {met} de {row.total} do curso já estudados
                </span>
              </p>
              <div
                aria-hidden
                className="bg-muted mt-2 flex h-3 gap-[2px] overflow-hidden rounded-full"
              >
                {SEGMENTS.map((segment) =>
                  row.counts[segment.key] > 0 ? (
                    <span
                      key={segment.key}
                      className={cn(
                        "h-full first:rounded-l-full last:rounded-r-full",
                        segment.className,
                      )}
                      style={{
                        width: `${(row.counts[segment.key] / Math.max(1, row.total)) * 100}%`,
                      }}
                      title={`${segment.label}: ${row.counts[segment.key]}`}
                    />
                  ) : null,
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {SEGMENTS.map((segment) => (
          <span key={segment.key} className="flex items-center gap-2">
            <span aria-hidden className={cn("size-3 rounded-[3px]", segment.className)} />
            {segment.label}
          </span>
        ))}
      </p>
      <table className="sr-only">
        <caption>Itens do curso por nível de domínio</caption>
        <thead>
          <tr>
            <th scope="col">Tipo</th>
            {SEGMENTS.map((segment) => (
              <th key={segment.key} scope="col">
                {segment.label}
              </th>
            ))}
            <th scope="col">Total no curso</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.kind}>
              <th scope="row">{KIND_LABEL[row.kind]}</th>
              {SEGMENTS.map((segment) => (
                <td key={segment.key}>{row.counts[segment.key]}</td>
              ))}
              <td>{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
