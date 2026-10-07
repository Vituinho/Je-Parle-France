import { Fragment } from "react";
import { Fr } from "@/components/fr";

/**
 * Minimal markup for authored text: paragraphs separated by blank lines,
 * **bold**, and *french* (rendered in the French serif with lang="fr").
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className={className}>
      {paragraphs.map((paragraph, p) => (
        <p key={p} className={p > 0 ? "mt-3" : undefined}>
          <Inline text={paragraph} />
        </p>
      ))}
    </div>
  );
}

export function Inline({ text }: { text: string }) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g);
  return (
    <>
      {tokens.map((token, i) => {
        if (token === "\n") return <br key={i} />;
        if (token.startsWith("**") && token.endsWith("**")) {
          return <strong key={i}>{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
          return (
            <Fr key={i} className="text-[1.08em]">
              {token.slice(1, -1)}
            </Fr>
          );
        }
        return <Fragment key={i}>{token}</Fragment>;
      })}
    </>
  );
}
