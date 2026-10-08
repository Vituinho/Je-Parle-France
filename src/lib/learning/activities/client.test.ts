import { describe, expect, it } from "vitest";
import {
  activitySchema,
  type ActivityInput,
  type ActivityOf,
  type ActivityType,
} from "@/lib/content/schema";
import { gradeActivity } from "../grading/grade";
import { toAuthoredResponse, toClientActivity } from "./client";

function make<T extends ActivityType>(type: T, input: ActivityInput): ActivityOf<T> {
  const activity = activitySchema.parse(input);
  if (activity.type !== type) throw new Error("fixture type mismatch");
  return activity as ActivityOf<T>;
}

const choice = make("choice", {
  id: "c1",
  type: "choice",
  prompt: { fr: "Merci !" },
  options: ["Obrigado", "Por favor", "Desculpe", "Tchau"],
  optionsLang: "pt",
  answer: 0,
  optionFeedback: [null, { pt: "não" }, null, null],
});

describe("client activities", () => {
  it("removes answer keys and shuffles deterministically", () => {
    const a = toClientActivity(choice, "seed-1");
    const b = toClientActivity(choice, "seed-1");
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).not.toContain("answer");
    expect(JSON.stringify(a)).not.toContain("optionFeedback");
    if (a.type !== "choice") throw new Error("unexpected type");
    expect([...a.options].sort()).toEqual([...choice.options].sort());
  });

  it("varies the order across seeds", () => {
    const orders = new Set(
      Array.from({ length: 12 }, (_, i) => {
        const client = toClientActivity(choice, `seed-${i}`);
        return client.type === "choice" ? client.options.join("|") : "";
      }),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it("keeps the played word out of a placement minimal-pair payload", () => {
    const activity = make("minimal_pair", {
      id: "p1",
      type: "minimal_pair",
      pair: [
        { word: "tu", ipa: "/ty/" },
        { word: "tout", ipa: "/tu/" },
      ],
      answer: 0,
    });
    const client = toClientActivity(activity, "s", {
      minimalPairAudioUrl: "/api/placement/audio?attemptId=a&itemId=p1",
    });
    expect(client).not.toHaveProperty("playText");
    expect(client).not.toHaveProperty("answer");
    expect(client).toHaveProperty("audioUrl", "/api/placement/audio?attemptId=a&itemId=p1");
    // The learning exercise still supports browser synthesis outside placement.
    expect(toClientActivity(activity, "s")).toHaveProperty("playText", "tu");
  });

  it("maps a displayed choice back to the authored index for grading", () => {
    const client = toClientActivity(choice, "s");
    if (client.type !== "choice") throw new Error("unexpected type");
    const displayedCorrect = client.options.indexOf("Obrigado");
    const authored = toAuthoredResponse(choice, { kind: "choice", choice: displayedCorrect }, "s");
    expect(gradeActivity(choice, authored).correct).toBe(true);
  });

  it("maps comprehension answers per question", () => {
    const reading = make("reading", {
      id: "r1",
      type: "reading",
      passage: { text: "Je m'appelle Lucas." },
      questions: [
        { prompt: { pt: "Nome?" }, options: ["Lucas", "Luc", "Louis"], answer: 0 },
        { prompt: { pt: "Língua?" }, options: ["francês", "inglês"], optionsLang: "pt", answer: 0 },
      ],
    });
    const client = toClientActivity(reading, "s2");
    if (client.type !== "reading") throw new Error("unexpected type");
    const answers = [
      client.questions[0]!.options.indexOf("Lucas"),
      client.questions[1]!.options.indexOf("francês"),
    ];
    const graded = gradeActivity(
      reading,
      toAuthoredResponse(reading, { kind: "answers", answers }, "s2"),
    );
    expect(graded.score).toBe(1);
  });

  it("maps matching pairs from both shuffled columns", () => {
    const match = make("match", {
      id: "m1",
      type: "match",
      pairs: [
        { left: "bonjour", right: "bom dia" },
        { left: "merci", right: "obrigado" },
        { left: "salut", right: "oi" },
      ],
    });
    const client = toClientActivity(match, "s3");
    if (client.type !== "match") throw new Error("unexpected type");
    const pairs = match.pairs.map(
      (pair) =>
        [client.left.indexOf(pair.left), client.right.indexOf(pair.right)] as [number, number],
    );
    const graded = gradeActivity(match, toAuthoredResponse(match, { kind: "pairs", pairs }, "s3"));
    expect(graded.score).toBe(1);
  });

  it("splits fill-in sentences around the blanks", () => {
    const fill = make("fill", {
      id: "f1",
      type: "fill",
      sentence: "Je ___ brésilien.",
      blanks: [{ accept: ["suis"] }],
    });
    const client = toClientActivity(fill, "s");
    expect(client).toMatchObject({ type: "fill", parts: ["Je ", " brésilien."] });
    expect(JSON.stringify(client)).not.toContain("suis");
  });
});
