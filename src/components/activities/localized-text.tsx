"use client";

import { useState } from "react";
import type { Localized } from "@/lib/content/schema";
import type { SupportMode } from "@/lib/learning/language-support";
import { cn } from "@/lib/utils";
import { Inline } from "./rich-text";

/**
 * Renders instructional text according to the learner's Portuguese support
 * level, always with a way back to Portuguese when French is shown alone.
 */
export function LocalizedText({
  value,
  support,
  className,
}: {
  value: Localized;
  support: SupportMode;
  className?: string;
}) {
  const [showPt, setShowPt] = useState(false);
  const fr = value.fr;
  if (!fr || support === "pt") {
    return (
      <span className={className}>
        <Inline text={value.pt} />
      </span>
    );
  }
  if (support === "pt-fr") {
    return (
      <span className={className}>
        <Inline text={value.pt} />
        <span lang="fr" className="font-fr text-muted-foreground ml-2 text-[0.95em]">
          {fr}
        </span>
      </span>
    );
  }
  if (support === "fr-pt") {
    return (
      <span className={className}>
        <span lang="fr" className="font-fr text-[1.05em]">
          {fr}
        </span>
        <span className="text-muted-foreground ml-2 text-[0.9em]">
          <Inline text={value.pt} />
        </span>
      </span>
    );
  }
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span lang="fr" className="font-fr text-[1.05em]">
        {fr}
      </span>
      {showPt ? (
        <span className="text-muted-foreground text-[0.9em]">
          <Inline text={value.pt} />
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setShowPt(true)}
          className="text-primary text-xs font-medium underline-offset-4 hover:underline"
        >
          Explicar em português
        </button>
      )}
    </span>
  );
}
