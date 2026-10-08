// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { activitySchema } from "@/lib/content/schema";
import { toClientActivity, toClientFeedback } from "@/lib/learning/activities/client";
import { gradeActivity } from "@/lib/learning/grading/grade";
import { FeedbackPanel } from "./feedback-panel";

afterEach(cleanup);

describe("live correctness feedback", () => {
  it("announces the correct Portuguese option in the live region after a wrong answer", () => {
    const activity = activitySchema.parse({
      id: "bonjour",
      type: "choice",
      prompt: { fr: "Bonjour !" },
      options: ["Bom dia / Olá!", "Tchau!"],
      optionsLang: "pt",
      answer: 0,
    });
    const feedback = toClientFeedback(
      activity,
      gradeActivity(activity, { kind: "choice", choice: 1 }),
      "seed",
    );
    render(<FeedbackPanel feedback={feedback} support="pt-fr" showExpected={false} />);
    const live = screen.getByRole("status");
    expect(live).toHaveTextContent("Ainda não.");
    expect(live).toHaveTextContent("Resposta certa:");
    expect(within(live).getByRole("listitem")).toHaveTextContent("Bom dia / Olá!");
    expect(within(live).getByRole("listitem")).toHaveAttribute("lang", "pt-BR");
    expect(toClientActivity(activity, "seed")).not.toHaveProperty("modelAnswers");
  });

  it("announces model answers to comprehension questions even without a single expected string", () => {
    const activity = activitySchema.parse({
      id: "reading",
      type: "reading",
      passage: { text: "Je m'appelle Lucas." },
      questions: [{ prompt: { pt: "Nome?" }, options: ["Lucas", "Louis"], answer: 0 }],
    });
    const feedback = toClientFeedback(
      activity,
      gradeActivity(activity, { kind: "answers", answers: [1] }),
      "seed",
    );
    render(<FeedbackPanel feedback={feedback} support="pt-fr" showExpected={false} />);
    expect(screen.getByRole("status")).toHaveTextContent("Resposta certa:");
    expect(within(screen.getByRole("status")).getByRole("listitem")).toHaveTextContent("Lucas");
    expect(screen.getByRole("listitem")).toHaveAttribute("lang", "fr");
  });
});
