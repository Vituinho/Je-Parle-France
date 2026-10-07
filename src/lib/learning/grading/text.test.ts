import { describe, expect, it } from "vitest";
import { compareText, diffTokens, levenshtein, normalize, tokenize, wordRecall } from "./text";

describe("normalize", () => {
  it("unifies apostrophes, case, typographic spaces and final punctuation", () => {
    expect(normalize("J’ai besoin d’aide.")).toBe("j'ai besoin d'aide");
    expect(normalize("Ça va ?")).toBe(normalize("ça va?"));
    expect(normalize("  Bonjour   !  ")).toBe("bonjour");
    expect(normalize("« Salut »")).toBe("salut");
    expect(normalize("Le cœur")).toBe("le coeur");
    expect(normalize("j' ai")).toBe("j'ai");
  });

  it("keeps elided words as separate tokens", () => {
    expect(tokenize("Je m'appelle Ana.")).toEqual(["je", "m'", "appelle", "ana"]);
    expect(tokenize("Qu'est-ce que c'est ?")).toEqual(["qu'", "est-ce", "que", "c'", "est"]);
  });
});

describe("compareText", () => {
  it("accepts exact answers regardless of formatting", () => {
    expect(compareText("je m’appelle Victor", ["Je m'appelle Victor."]).verdict).toBe("exact");
  });

  it("flags missing accents as almost right", () => {
    const result = compareText("deja", ["déjà"]);
    expect(result.verdict).toBe("accent");
    expect(result.score).toBeGreaterThan(0.5);
    expect(compareText("ca va", ["ça va"]).verdict).toBe("accent");
  });

  it("flags missing apostrophes and hyphens as punctuation slips", () => {
    expect(compareText("cest bon", ["c'est bon"]).verdict).toBe("punctuation");
    expect(compareText("est ce que tu viens", ["est-ce que tu viens"]).verdict).toBe("punctuation");
  });

  it("tolerates one slip inside a long word, but not near its ending", () => {
    expect(compareText("appartment", ["appartement"]).verdict).toBe("typo");
    expect(compareText("je voudrias un café", ["je voudrais un café"]).verdict).toBe("wrong");
  });

  it("never treats grammatical endings as typos", () => {
    expect(compareText("il es", ["il est"]).verdict).toBe("wrong");
    expect(compareText("une petit maison", ["une petite maison"]).verdict).toBe("wrong");
    expect(compareText("ils parle", ["ils parlent"]).verdict).toBe("wrong");
  });

  it("rejects missing elision", () => {
    expect(compareText("je ai besoin", ["j'ai besoin"]).verdict).toBe("wrong");
  });

  it("chooses the closest accepted answer", () => {
    const result = compareText("je suis brésilienne", [
      "Je suis brésilien.",
      "Je suis brésilienne.",
    ]);
    expect(result.verdict).toBe("exact");
    expect(result.matched).toBe("Je suis brésilienne.");
  });
});

describe("diffTokens", () => {
  it("annotates the learner's answer for red-pen feedback", () => {
    const diff = diffTokens(
      tokenize("Je besoin d'ouvrir un compte"),
      tokenize("J'ai besoin d'ouvrir un compte"),
    );
    expect(diff.map((t) => t.status)).toEqual(["wrong", "missing", "ok", "ok", "ok", "ok", "ok"]);
    expect(diff[0]).toMatchObject({ text: "je", expected: "j'" });
  });

  it("keeps the words that were right", () => {
    const diff = diffTokens(tokenize("je suis 20 ans"), tokenize("j'ai 20 ans"));
    expect(diff.filter((t) => t.status === "ok").map((t) => t.text)).toEqual(["20", "ans"]);
    expect(diff.some((t) => t.status !== "ok")).toBe(true);
  });
});

describe("helpers", () => {
  it("computes edit distance", () => {
    expect(levenshtein("chat", "chats")).toBe(1);
    expect(levenshtein("", "abc")).toBe(3);
  });

  it("measures how many expected words were produced", () => {
    expect(wordRecall("je voudrais un cafe", "Je voudrais un café, s'il vous plaît.")).toBeCloseTo(
      4 / 8,
    );
  });
});
