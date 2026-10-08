import { describe, expect, it } from "vitest";
import { getContent } from "@/lib/content";
import { buildBank, toBankItem } from "./bank";
import { createPlan, nextStep } from "./engine";

describe("reviewed writing placement activation", () => {
  it("enables only authored rubrics matching the item's expected level", () => {
    const items = [...getContent().placementItems.values()].filter(
      (i) => i.activity.type === "open_writing",
    );
    expect(items.map((i) => i.id)).toEqual(["pw-a2-ow", "pw-b1-ow"]);
    for (const item of items) {
      if (item.activity.type !== "open_writing") throw new Error("writing expected");
      expect(toBankItem(item).params.weight).toBe(0.5);
      expect(buildBank([{ ...item, activity: { ...item.activity, rubric: undefined } }]).size).toBe(
        0,
      );
      expect(
        buildBank([
          {
            ...item,
            activity: {
              ...item.activity,
              rubric: { ...item.activity.rubric!, expectedLevel: "C1" },
            },
          },
        ]).size,
      ).toBe(0);
    }
  });
  it("selects at most one near-level writing task after deterministic calibration, only with real AI capability", () => {
    const bank = buildBank(getContent().placementItems.values());
    const responses = ["pw-a2-01", "pw-a2-02"].map((itemId) => ({
      itemId,
      score: 1,
      scored: true,
    }));
    const plan = createPlan({
      mode: "skill",
      onlySkills: ["writing"],
      prior: { mean: 2.5, sd: 0.5 },
      capabilities: { ai: true, speech: false },
    });
    expect(nextStep({ plan, responses, seed: "writing" }, bank)?.item.aiAssessed).toBe(true);
    expect(
      nextStep(
        {
          plan: { ...plan, capabilities: { ai: false, speech: false } },
          responses,
          seed: "writing",
        },
        bank,
      )?.item.aiAssessed,
    ).toBe(false);
  });
});
