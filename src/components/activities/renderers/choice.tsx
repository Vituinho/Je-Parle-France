"use client";

import { Fr } from "@/components/fr";
import type { ClientQuestion } from "@/lib/learning/activities/client";
import { cn } from "@/lib/utils";
import { AudioButton } from "../audio-button";
import { OptionRow, optionState, PromptView, type RendererProps } from "./shared";

export function ChoiceRenderer({
  activity,
  draft,
  onDraft,
  locked,
  feedback,
}: RendererProps<"choice">) {
  const selected = draft.kind === "choice" ? draft.choice : null;
  return (
    <div className="space-y-6">
      <PromptView prompt={activity.prompt} revealed={locked} />
      <div role="radiogroup" className="grid gap-2.5">
        {activity.options.map((option, index) => (
          <OptionRow
            key={option}
            type="radio"
            name={activity.id}
            index={index}
            label={option}
            lang={activity.optionsLang}
            disabled={locked}
            state={optionState({
              index,
              selected: selected === index,
              feedback,
              correctIndex: feedback?.correctOption,
            })}
            onSelect={() => onDraft({ kind: "choice", choice: index })}
          />
        ))}
      </div>
    </div>
  );
}

export function MultiSelectRenderer({
  activity,
  draft,
  onDraft,
  locked,
  feedback,
}: RendererProps<"multi_select">) {
  const chosen = draft.kind === "choices" ? draft.choices : [];
  return (
    <div className="space-y-6">
      <PromptView prompt={activity.prompt} revealed={locked} />
      <p className="text-muted-foreground text-sm">Marque todas as opções certas.</p>
      <div className="grid gap-2.5">
        {activity.options.map((option, index) => {
          const isChosen = chosen.includes(index);
          const isRight = feedback?.correctOptions?.includes(index);
          const state = !feedback
            ? isChosen
              ? "selected"
              : "idle"
            : isRight
              ? isChosen
                ? "correct"
                : "missed"
              : isChosen
                ? "wrong"
                : "idle";
          return (
            <OptionRow
              key={option}
              type="checkbox"
              name={activity.id}
              index={index}
              label={option}
              lang={activity.optionsLang}
              disabled={locked}
              state={state}
              onSelect={() =>
                onDraft({
                  kind: "choices",
                  choices: isChosen ? chosen.filter((i) => i !== index) : [...chosen, index],
                })
              }
            />
          );
        })}
      </div>
    </div>
  );
}

export function MinimalPairRenderer({
  activity,
  draft,
  onDraft,
  locked,
  feedback,
}: RendererProps<"minimal_pair">) {
  const selected = draft.kind === "choice" ? draft.choice : null;
  return (
    <div className="space-y-6">
      <div className="flex justify-center py-2">
        <AudioButton size="lg" lines={[{ text: activity.playText, region: activity.region }]} />
      </div>
      <div role="radiogroup" className="grid grid-cols-2 gap-3">
        {activity.pair.map((word, index) => {
          const state = optionState({
            index,
            selected: selected === index,
            feedback,
            correctIndex: feedback?.correctOption,
          });
          return (
            <label
              key={word.word}
              className={cn(
                "border-border bg-card flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-[1.5px] px-3 py-6 text-center transition-colors",
                "has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
                state === "selected" && "border-primary bg-accent",
                state === "correct" && "border-success bg-success-soft",
                state === "wrong" && "border-destructive bg-destructive-soft",
                state === "missed" && "border-success border-dashed",
              )}
            >
              <input
                type="radio"
                name={activity.id}
                checked={selected === index}
                onChange={() => onDraft({ kind: "choice", choice: index })}
                disabled={locked}
                className="sr-only"
              />
              <Fr className="text-3xl">{word.word}</Fr>
              <span className="text-muted-foreground font-mono text-sm">{word.ipa}</span>
              {locked && word.pt && (
                <span className="text-muted-foreground text-sm">{word.pt}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function Questions({
  name,
  questions,
  answers,
  onAnswer,
  locked,
  correctAnswers,
}: {
  name: string;
  questions: ClientQuestion[];
  answers: (number | null)[];
  onAnswer: (question: number, option: number) => void;
  locked: boolean;
  correctAnswers?: number[];
}) {
  return (
    <div className="space-y-6">
      {questions.map((question, q) => (
        <fieldset key={q} className="space-y-3">
          <legend className="mb-3 font-semibold">
            {question.prompt.fr ? (
              <Fr className="text-lg">{question.prompt.fr}</Fr>
            ) : (
              question.prompt.pt
            )}
            {question.prompt.fr && question.prompt.pt && (
              <span className="text-muted-foreground ml-2 text-sm font-normal">
                {question.prompt.pt}
              </span>
            )}
          </legend>
          <div className="grid gap-2">
            {question.options.map((option, index) => (
              <OptionRow
                key={option}
                type="radio"
                name={`${name}-q${q}`}
                index={index}
                label={option}
                lang={question.optionsLang}
                disabled={locked}
                state={
                  correctAnswers
                    ? index === correctAnswers[q]
                      ? answers[q] === index
                        ? "correct"
                        : "missed"
                      : answers[q] === index
                        ? "wrong"
                        : "idle"
                    : answers[q] === index
                      ? "selected"
                      : "idle"
                }
                onSelect={() => onAnswer(q, index)}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export function ReadingRenderer({
  activity,
  draft,
  onDraft,
  locked,
  feedback,
}: RendererProps<"reading">) {
  const answers = draft.kind === "answers" ? draft.answers : [];
  return (
    <div className="space-y-7">
      <article className="border-border bg-card rounded-2xl border p-5 sm:p-6">
        {activity.passage.title && (
          <Fr as="h3" className="mb-2 text-xl font-semibold">
            {activity.passage.title}
          </Fr>
        )}
        <Fr as="div" className="text-[1.15rem] leading-relaxed whitespace-pre-line">
          {activity.passage.text}
        </Fr>
      </article>
      <Questions
        name={activity.id}
        questions={activity.questions}
        answers={answers}
        locked={locked}
        correctAnswers={feedback?.correctAnswers}
        onAnswer={(q, option) => {
          const next = [...answers];
          next[q] = option;
          onDraft({ kind: "answers", answers: next });
        }}
      />
    </div>
  );
}

export function ListeningRenderer({
  activity,
  draft,
  onDraft,
  locked,
  feedback,
}: RendererProps<"listening">) {
  const answers = draft.kind === "answers" ? draft.answers : [];
  const speakers = [...new Set(activity.lines.map((line) => line.speaker))];
  return (
    <div className="space-y-7">
      <div className="border-border bg-card flex flex-col items-center gap-3 rounded-2xl border p-6">
        <AudioButton
          size="lg"
          label="Ouvir o áudio"
          lines={activity.lines.map((line) => ({
            text: line.text,
            region: line.region,
            gender: line.gender,
            alternate: speakers.indexOf(line.speaker) % 2 === 1,
          }))}
        />
        <p className="text-muted-foreground text-sm">Você pode ouvir quantas vezes quiser.</p>
      </div>
      <Questions
        name={activity.id}
        questions={activity.questions}
        answers={answers}
        locked={locked}
        correctAnswers={feedback?.correctAnswers}
        onAnswer={(q, option) => {
          const next = [...answers];
          next[q] = option;
          onDraft({ kind: "answers", answers: next });
        }}
      />
      {locked && feedback && (
        <details className="border-border rounded-2xl border p-4" open>
          <summary className="cursor-pointer font-semibold">Transcrição</summary>
          <dl className="mt-3 space-y-2">
            {activity.lines.map((line, i) => (
              <div key={i} className="flex gap-3">
                <dt className="text-muted-foreground w-24 shrink-0 text-sm">{line.speaker}</dt>
                <dd>
                  <Fr className="text-[1.05rem]">{line.text}</Fr>
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </div>
  );
}

export function SelfAssessRenderer({
  activity,
  draft,
  onDraft,
  locked,
}: RendererProps<"self_assess">) {
  const rating = draft.kind === "self" ? draft.rating : null;
  const options = [
    { value: 0 as const, label: "Ainda não" },
    { value: 0.5 as const, label: "Com dificuldade" },
    { value: 1 as const, label: "Sim, com facilidade" },
  ];
  return (
    <div className="space-y-6">
      <blockquote className="border-primary border-l-[3px] pl-4">
        <p className="text-xl leading-snug font-semibold">{activity.statement.pt}</p>
        {activity.statement.fr && (
          <Fr as="p" className="text-muted-foreground mt-2 text-lg">
            {activity.statement.fr}
          </Fr>
        )}
      </blockquote>
      <div role="radiogroup" className="grid gap-2.5 sm:grid-cols-3">
        {options.map((option, index) => (
          <OptionRow
            key={option.value}
            type="radio"
            name={activity.id}
            index={index}
            label={option.label}
            lang="pt"
            disabled={locked}
            state={rating === option.value ? "selected" : "idle"}
            onSelect={() => onDraft({ kind: "self", rating: option.value })}
          />
        ))}
      </div>
    </div>
  );
}
