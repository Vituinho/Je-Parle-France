import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A large selectable option backed by a native radio/checkbox input, so
 * keyboard and screen-reader behaviour comes for free.
 */
export function ChoiceTile({
  type,
  name,
  value,
  checked,
  onChange,
  title,
  description,
  badge,
  lang,
  className,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  lang?: "fr";
  className?: string;
}) {
  return (
    <label
      className={cn(
        "border-border bg-card relative flex cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] px-4 py-3.5 transition-colors",
        "hover:border-primary/40 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
        checked && "border-primary bg-accent",
        className,
      )}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center border-[1.5px] transition-colors",
          type === "radio" ? "rounded-full" : "rounded-md",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-background",
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span lang={lang} className={cn("font-semibold", lang === "fr" && "font-fr text-lg")}>
            {title}
          </span>
          {badge}
        </span>
        {description && (
          <span className="text-muted-foreground mt-0.5 block text-sm leading-relaxed">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
