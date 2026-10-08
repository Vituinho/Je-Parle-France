import { Check } from "lucide-react";
import { Inline, RichText } from "@/components/activities/rich-text";
import { Fr } from "@/components/fr";
import type { Activity, Localized } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

/**
 * Read-only view of an authored activity with its answers and evidence
 * targets, for content review. Never shown to learners.
 */
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground mt-3 text-xs font-semibold">{children}</p>;
}

function Loc({ value }: { value?: Localized }) {
  if (!value) return null;
  return (
    <span>
      <Inline text={value.pt} />
      {value.fr && <Fr className="text-muted-foreground ml-2">{value.fr}</Fr>}
    </span>
  );
}

function Accept({ forms }: { forms: readonly string[] }) {
  return (
    <ul className="mt-1 flex flex-wrap gap-1.5">
      {forms.map((form, index) => (
        <li
          key={form}
          className={cn(
            "rounded-md border px-2 py-0.5",
            index === 0 ? "border-success bg-success-soft" : "border-border",
          )}
        >
          <Fr>{form}</Fr>
        </li>
      ))}
    </ul>
  );
}

function Options({
  options,
  correct,
  lang,
  feedback,
}: {
  options: readonly string[];
  correct: readonly number[];
  lang: "fr" | "pt";
  feedback?: readonly (Localized | null)[];
}) {
  return (
    <ol className="mt-1 space-y-1">
      {options.map((option, index) => (
        <li key={option} className="flex items-start gap-2">
          <span
            className={cn(
              "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-xs",
              correct.includes(index) ? "border-success bg-success text-white" : "border-border",
            )}
          >
            {correct.includes(index) ? <Check className="size-3" strokeWidth={3} /> : index + 1}
          </span>
          <span>
            {lang === "fr" ? <Fr>{option}</Fr> : option}
            {feedback?.[index] && (
              <span className="text-muted-foreground block text-sm">
                ↳ <Loc value={feedback[index] ?? undefined} />
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Prompt({
  prompt,
}: {
  prompt: { fr?: string; pt?: string; audio?: { text: string; region: string }; hideText: boolean };
}) {
  return (
    <div className="mt-1 space-y-0.5">
      {prompt.pt && <RichText text={prompt.pt} />}
      {prompt.fr && <Fr as="p">{prompt.fr}</Fr>}
      {prompt.audio && (
        <p className="text-muted-foreground text-sm">
          🔊 {prompt.audio.region}: <Fr>{prompt.audio.text}</Fr>
          {prompt.hideText && " (texto oculto até responder)"}
        </p>
      )}
    </div>
  );
}

function Body({ activity }: { activity: Activity }) {
  switch (activity.type) {
    case "teach":
      return (
        <>
          <p className="font-semibold">
            <Loc value={activity.title} />
          </p>
          <RichText text={activity.body.pt} className="mt-1 leading-relaxed" />
          {activity.examples.length > 0 && (
            <>
              <Label>Exemplos ({activity.audioRegion})</Label>
              <ul className="mt-1 space-y-0.5">
                {activity.examples.map((example) => (
                  <li key={example.fr}>
                    <Fr>{example.fr}</Fr> — {example.pt}
                  </li>
                ))}
              </ul>
            </>
          )}
          {activity.notes.map((note, index) => (
            <p key={index} className="bg-muted mt-2 rounded-lg px-3 py-2 text-sm">
              <strong>{note.kind}:</strong> {note.text.pt}
            </p>
          ))}
          <Label>Apresenta</Label>
          <p className="font-mono text-sm">{activity.introduces.join(", ") || "—"}</p>
        </>
      );
    case "choice":
      return (
        <>
          <Prompt prompt={activity.prompt} />
          <Options
            options={activity.options}
            correct={[activity.answer]}
            lang={activity.optionsLang}
            feedback={activity.optionFeedback}
          />
        </>
      );
    case "multi_select":
      return (
        <>
          <Prompt prompt={activity.prompt} />
          <Options
            options={activity.options}
            correct={activity.answers}
            lang={activity.optionsLang}
          />
        </>
      );
    case "match":
      return (
        <ul className="mt-1 space-y-0.5">
          {activity.pairs.map((pair) => (
            <li key={pair.left}>
              {activity.leftLang === "fr" ? <Fr>{pair.left}</Fr> : pair.left} ↔ {pair.right}
            </li>
          ))}
        </ul>
      );
    case "order":
      return (
        <>
          <Fr as="p">{activity.tokens.join(" ")}</Fr>
          {activity.translation && (
            <p className="text-muted-foreground text-sm">{activity.translation}</p>
          )}
          {activity.distractors.length > 0 && (
            <p className="text-sm">Distratores: {activity.distractors.join(", ")}</p>
          )}
        </>
      );
    case "fill":
      return (
        <>
          <Fr as="p">{activity.sentence}</Fr>
          {activity.blanks.map((blank, index) => (
            <div key={index}>
              <Label>Lacuna {index + 1}</Label>
              <Accept forms={blank.accept} />
            </div>
          ))}
          {activity.wordBank && (
            <p className="mt-2 text-sm">Banco: {activity.wordBank.join(", ")}</p>
          )}
        </>
      );
    case "type":
      return (
        <>
          <Prompt prompt={activity.prompt} />
          <Label>Aceita</Label>
          <Accept forms={activity.accept} />
        </>
      );
    case "dictation":
      return (
        <>
          <p className="text-sm">
            🔊 {activity.audio.region}: <Fr>{activity.audio.text}</Fr>
          </p>
          <Label>Aceita</Label>
          <Accept forms={activity.accept} />
        </>
      );
    case "error_correction":
      return (
        <>
          <Fr as="p" className="correction">
            {activity.sentence}
          </Fr>
          <Label>Aceita</Label>
          <Accept forms={activity.accept} />
        </>
      );
    case "speak":
      return (
        <>
          <p className="text-sm">
            Modo <strong>{activity.mode}</strong> · voz {activity.region}
          </p>
          {activity.prompt && <Prompt prompt={activity.prompt} />}
          <Fr as="p" className="mt-1">
            {activity.text}
          </Fr>
          {activity.translation && (
            <p className="text-muted-foreground text-sm">{activity.translation}</p>
          )}
          {activity.accept.length > 0 && (
            <>
              <Label>Respostas aceitas</Label>
              <Accept forms={activity.accept} />
            </>
          )}
        </>
      );
    case "minimal_pair":
      return (
        <p>
          {activity.pair.map((word, index) => (
            <span
              key={word.word}
              className={cn("mr-4", index === activity.answer && "font-semibold")}
            >
              <Fr>{word.word}</Fr> {word.ipa}
              {index === activity.answer && " ✓"}
            </span>
          ))}
        </p>
      );
    case "reading":
    case "listening":
      return (
        <>
          {activity.type === "reading" ? (
            <div className="bg-muted rounded-lg px-3 py-2">
              {activity.passage.title && <p className="font-semibold">{activity.passage.title}</p>}
              <Fr as="p">{activity.passage.text}</Fr>
            </div>
          ) : (
            <ul className="bg-muted space-y-0.5 rounded-lg px-3 py-2">
              {activity.lines.map((line, index) => (
                <li key={index}>
                  <span className="text-muted-foreground text-sm">
                    {line.speaker} ({line.region}, {line.gender}):
                  </span>{" "}
                  <Fr>{line.text}</Fr>
                </li>
              ))}
            </ul>
          )}
          {activity.type === "listening" && activity.context && (
            <p className="text-muted-foreground mt-1 text-sm">
              Contexto: <Loc value={activity.context} />
            </p>
          )}
          {activity.questions.map((question, index) => (
            <div key={index}>
              <Label>
                Pergunta {index + 1}:{" "}
                <Loc value={{ pt: question.prompt.pt ?? "", fr: question.prompt.fr }} />
              </Label>
              <Options
                options={question.options}
                correct={[question.answer]}
                lang={question.optionsLang}
              />
            </div>
          ))}
        </>
      );
    case "open_writing":
      return (
        <>
          <Loc value={activity.prompt} />
          <p className="text-sm">Mínimo {activity.minWords} palavras</p>
          <Label>Modelo</Label>
          <Fr as="p">{activity.modelAnswer}</Fr>
          <Label>Foco</Label>
          <p className="text-sm">{activity.focus.join(" · ")}</p>
        </>
      );
    case "self_assess":
      return <Loc value={activity.statement} />;
  }
}

export function ActivitySpec({ activity, position }: { activity: Activity; position: number }) {
  return (
    <article className="border-border rounded-2xl border px-5 py-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-sm">
          {position}. {activity.id}
        </p>
        <span className="bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs font-semibold">
          {activity.type}
        </span>
      </header>
      {activity.type !== "teach" && activity.instruction && (
        <p className="text-muted-foreground mt-1 text-sm">
          <Loc value={activity.instruction} />
        </p>
      )}
      <div className="mt-2">
        <Body activity={activity} />
      </div>
      {activity.type !== "teach" && (
        <>
          {activity.explanation && (
            <p className="text-muted-foreground mt-2 text-sm">
              Explicação: <Loc value={activity.explanation} />
            </p>
          )}
          <Label>Evidência</Label>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {activity.targets.map((target) => (
              <li
                key={`${target.concept}-${target.dimension}`}
                className={cn(
                  "rounded-md border px-2 py-0.5 font-mono text-xs",
                  target.weight < 0.5 ? "border-dashed opacity-70" : "border-border",
                )}
              >
                {target.concept} · {target.dimension}
                {target.weight !== 1 && ` · ${target.weight}`}
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
