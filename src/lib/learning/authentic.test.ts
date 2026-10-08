import { describe, expect, it } from "vitest";
import type { AuthenticContent } from "@/lib/content/schema";
import { dailyAuthentic, rankAuthentic, regionsFor } from "./authentic";

const item = (id: string, level: AuthenticContent["level"], region: AuthenticContent["region"]) =>
  ({
    id,
    title: id,
    source: "test",
    url: "https://example.org",
    kind: "podcast",
    region,
    level,
    transcript: "available",
    topics: ["x"],
    rights: "link",
  }) as AuthenticContent;

const items = [
  item("radio-qc", "B2", "fr-CA"),
  item("kids-fr", "B1", "fr-FR"),
  item("tv-intl", "A1", "intl"),
  item("gov-qc", "A2", "fr-CA"),
];

describe("authentic content", () => {
  it("puts what fits the level and the destination first", () => {
    const ranked = rankAuthentic(items, { level: "A1", regions: ["fr-CA"] });
    expect(ranked.map((entry) => entry.item.id)).toEqual([
      "tv-intl",
      "gov-qc",
      "radio-qc",
      "kids-fr",
    ]);
    expect(ranked.find((entry) => entry.item.id === "kids-fr")).toMatchObject({
      fits: false,
      preferred: false,
    });
  });

  it("suggests the same item all day, only among what fits", () => {
    const learner = { level: "A1" as const, regions: ["fr-FR"], date: "2026-10-08" };
    const pick = dailyAuthentic(items, learner);
    expect(pick?.id).toBe("tv-intl");
    expect(dailyAuthentic(items, learner)?.id).toBe(pick?.id);
    expect(dailyAuthentic(items, { ...learner, level: "A0" })?.id).toBe("tv-intl");
    expect(dailyAuthentic([item("radio-qc", "B2", "fr-CA")], learner)).toBeNull();
  });

  it("maps destinations to regions", () => {
    expect(regionsFor("canada_quebec")).toEqual(["fr-CA"]);
    expect(regionsFor("france")).toEqual(["fr-FR"]);
    expect(regionsFor("both")).toEqual([]);
  });
});
