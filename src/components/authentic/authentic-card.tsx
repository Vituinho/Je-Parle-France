import { AudioLines, ExternalLink, Newspaper, Podcast, Radio, Tv } from "lucide-react";
import { Inline } from "@/components/activities/rich-text";
import { Fr } from "@/components/fr";
import type { AuthenticContent } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

const KIND = {
  video: { label: "Vídeo", icon: Tv },
  audio: { label: "Áudio", icon: AudioLines },
  podcast: { label: "Podcast", icon: Podcast },
  radio: { label: "Rádio", icon: Radio },
  article: { label: "Texto", icon: Newspaper },
} as const;

export const REGION_LABEL: Record<AuthenticContent["region"], string> = {
  intl: "Internacional",
  "fr-FR": "França",
  "fr-CA": "Canadá / Québec",
  "fr-BE": "Bélgica",
  "fr-CH": "Suíça",
  "fr-AF": "África",
};

const TRANSCRIPT = {
  available: "com texto ou transcrição",
  partial: "transcrição em parte do conteúdo",
  none: "sem transcrição",
} as const;

const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/** A link to authentic material at its official source. Nothing is rehosted. */
export function AuthenticCard({
  item,
  compact = false,
  className,
}: {
  item: AuthenticContent;
  compact?: boolean;
  className?: string;
}) {
  const kind = KIND[item.kind];
  const Icon = kind.icon;
  return (
    <article className={cn("border-border bg-card rounded-2xl border px-5 py-4", className)}>
      <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <Icon className="size-4" aria-hidden />
        <span>{kind.label}</span>
        <span aria-hidden>·</span>
        <span>a partir do {item.level}</span>
        <span aria-hidden>·</span>
        <span>{REGION_LABEL[item.region]}</span>
      </p>
      <h3 className="mt-1.5 text-lg leading-snug font-semibold">
        <Fr>{item.title}</Fr>
      </h3>
      <p className="text-muted-foreground text-sm">{item.source}</p>
      {item.note && !compact && (
        <p className="mt-2 leading-relaxed">
          <Inline text={item.note.pt} />
        </p>
      )}
      {!compact && (
        <p className="text-muted-foreground mt-2 text-sm">
          {TRANSCRIPT[item.transcript]} · {item.topics.join(", ")}
        </p>
      )}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
      >
        Abrir em {host(item.url)}
        <ExternalLink className="size-3.5" aria-hidden />
        <span className="sr-only">(abre em outra aba)</span>
      </a>
    </article>
  );
}
