"use client";

import { Flag, Info, Landmark, Lightbulb, MessageCircle, Snowflake } from "lucide-react";
import { Fr } from "@/components/fr";
import type { ActivityOf, Note } from "@/lib/content/schema";
import type { SupportMode } from "@/lib/learning/language-support";
import { cn } from "@/lib/utils";
import { AudioButton } from "../audio-button";
import { LocalizedText } from "../localized-text";
import { RichText } from "../rich-text";

const NOTE_STYLE: Record<Note["kind"], { label: string; icon: typeof Info; className: string }> = {
  brazil: { label: "Para brasileiros", icon: Flag, className: "border-chart-2 bg-success-soft/60" },
  quebec: { label: "No Québec", icon: Snowflake, className: "border-chart-1 bg-accent" },
  france: { label: "Na França", icon: Landmark, className: "border-chart-4 bg-accent" },
  culture: { label: "Cultura", icon: MessageCircle, className: "border-chart-3 bg-muted" },
  tip: { label: "Dica", icon: Lightbulb, className: "border-highlight bg-highlight/15" },
  register: { label: "Registro", icon: Info, className: "border-border bg-muted" },
};

export function NoteBox({ note, support }: { note: Note; support: SupportMode }) {
  const style = NOTE_STYLE[note.kind];
  const Icon = style.icon;
  return (
    <aside className={cn("rounded-2xl border-l-[3px] px-4 py-3", style.className)}>
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4" aria-hidden />
        {style.label}
      </p>
      <div className="leading-relaxed">
        {support === "fr" || support === "fr-pt" ? (
          <LocalizedText value={note.text} support={support} />
        ) : (
          <RichText text={note.text.pt} />
        )}
      </div>
    </aside>
  );
}

export function TeachCard({
  activity,
  support,
}: {
  activity: ActivityOf<"teach">;
  support: SupportMode;
}) {
  const body = support === "fr" && activity.body.fr ? activity.body.fr : activity.body.pt;
  return (
    <article className="space-y-6">
      <h2 className="text-[1.75rem] leading-tight font-bold">
        <LocalizedText value={activity.title} support={support === "fr" ? "fr" : "pt"} />
      </h2>
      <RichText text={body} className="text-[1.05rem] leading-relaxed" />
      {activity.examples.length > 0 && (
        <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
          {activity.examples.map((example) => (
            <li key={example.fr} className="flex items-center gap-4 px-4 py-3.5">
              <AudioButton
                size="sm"
                showSlow={false}
                lines={[{ text: example.fr, region: activity.audioRegion }]}
                label={`Ouvir: ${example.fr}`}
              />
              <div className="min-w-0">
                <Fr as="p" className="text-[1.3rem] leading-snug">
                  {example.fr}
                </Fr>
                <p className="text-muted-foreground text-sm">{example.pt}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {activity.notes.map((note, index) => (
        <NoteBox key={index} note={note} support={support} />
      ))}
    </article>
  );
}
