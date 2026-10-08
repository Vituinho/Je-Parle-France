import { describe, expect, it } from "vitest";
import { correctText, detectErrors } from "./patterns";

describe("Brazilian learner error detectors", () => {
  it("catches the classic 'je besoin' and suggests avoir besoin de", () => {
    const [error] = detectErrors("Je besoin d'ouvrir un compte.");
    expect(error).toMatchObject({
      id: "besoin-without-avoir",
      right: "j'ai besoin",
      severity: "important",
    });
    expect(correctText("Je besoin d'ouvrir un compte.")).toBe("J'ai besoin d'ouvrir un compte.");
  });

  it("conjugates avoir for other persons", () => {
    expect(correctText("Nous besoin d'un appartement.")).toBe(
      "Nous avons besoin d'un appartement.",
    );
  });

  it("catches age and physical states with être", () => {
    expect(correctText("Je suis 25 ans.")).toBe("J'ai 25 ans.");
    expect(correctText("je suis faim")).toBe("j'ai faim");
    expect(detectErrors("Tu es quel âge ?")[0]?.right).toBe("tu as quel âge");
  });

  it("catches missing elision but not h aspiré words", () => {
    expect(correctText("Je ai un chat.")).toBe("J'ai un chat.");
    expect(correctText("C'est le ami de Paul.")).toBe("C'est l'ami de Paul.");
    expect(detectErrors("le héros arrive")).toEqual([]);
    expect(detectErrors("je mange")).toEqual([]);
  });

  it("contracts à le / de le", () => {
    expect(correctText("Je vais à le cinéma.")).toBe("Je vais au cinéma.");
    expect(correctText("Le prix de le billet.")).toBe("Le prix du billet.");
  });

  it("names the course concepts each error is evidence against", () => {
    expect(detectErrors("je suis 25 ans")[0]?.concepts).toEqual(["gram:age-avoir"]);
    expect(detectErrors("je suis faim")[0]?.concepts).toEqual(["lex:avoir-faim"]);
    expect(detectErrors("je suis peur")[0]?.concepts).toEqual([]);
    expect(detectErrors("je vais à le cinéma")[0]?.concepts).toEqual(["gram:contractions-a-de"]);
    expect(detectErrors("je ai un chat")[0]?.concepts).toEqual([]);
  });

  it("maps only to concepts that exist in the course", async () => {
    const { getContent } = await import("@/lib/content");
    const samples = [
      "je suis 25 ans",
      "je besoin d'aide",
      "je suis faim",
      "je suis soif",
      "je suis froid",
      "je vais à le parc",
      "le prix de le billet",
      "tu es quel âge",
    ];
    const ids = samples.flatMap((text) => detectErrors(text).flatMap((error) => error.concepts));
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(getContent().concepts.has(id), id).toBe(true);
  });

  it("leaves correct French alone", () => {
    expect(detectErrors("J'ai besoin d'aide, j'ai 30 ans et je vais au marché.")).toEqual([]);
  });
});
