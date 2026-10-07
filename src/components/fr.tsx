import { cn } from "@/lib/utils";

/**
 * French text. Always marked with lang="fr" so screen readers switch voice and
 * the serif typeface signals the target language.
 */
export function Fr({
  children,
  className,
  as: Component = "span",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3" | "blockquote";
}) {
  return (
    <Component lang="fr" className={cn("font-fr", className)}>
      {children}
    </Component>
  );
}
