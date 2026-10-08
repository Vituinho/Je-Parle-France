import { describe, expect, it } from "vitest";
import { distinctFrench, foldText } from "./localized";

describe("distinctFrench", () => {
  it("drops a French title that only differs by spacing, punctuation or accents", () => {
    expect(distinctFrench({ pt: "Tu ou vous?", fr: "Tu ou vous ?" })).toBeUndefined();
    expect(distinctFrench({ pt: "Un, une, des", fr: "Un, une, des" })).toBeUndefined();
  });

  it("keeps a French title that adds information", () => {
    expect(distinctFrench({ pt: "Un, une, des", fr: "Les articles indéfinis" })).toBe(
      "Les articles indéfinis",
    );
    expect(distinctFrench({ pt: "Gramática" })).toBeUndefined();
  });
});

describe("foldText", () => {
  it("ignores case and accents so learners can search without typing them", () => {
    expect(foldText("À bientôt, Élève")).toBe("a bientot, eleve");
    expect(foldText("ça")).toBe("ca");
  });
});
