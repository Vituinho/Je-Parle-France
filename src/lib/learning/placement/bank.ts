import type { PlacementItem } from "@/lib/content/schema";
import { levelMidpoint } from "../cefr";
import type { BankItem, Capability } from "./engine";
import { DEFAULT_DISCRIMINATION, type ItemParams } from "./model";

/** Measurement parameters derived from authored item metadata. */
export function itemParams(item: PlacementItem): ItemParams {
  const difficulty = levelMidpoint(item.level) + item.offset;
  const activity = item.activity;
  switch (activity.type) {
    case "self_assess":
      return { difficulty, discrimination: 0.9, guess: 0, weight: 0.5 };
    case "choice":
      return {
        difficulty,
        discrimination: DEFAULT_DISCRIMINATION,
        guess: 1 / activity.options.length,
        weight: 1,
      };
    case "reading":
    case "listening": {
      const guesses = activity.questions.map((question) => 1 / question.options.length);
      const guess = guesses.reduce((sum, g) => sum + g, 0) / guesses.length;
      return { difficulty, discrimination: DEFAULT_DISCRIMINATION, guess, weight: 1 };
    }
    case "minimal_pair":
      return { difficulty, discrimination: DEFAULT_DISCRIMINATION, guess: 0.5, weight: 1 };
    default:
      return { difficulty, discrimination: DEFAULT_DISCRIMINATION, guess: 0, weight: 1 };
  }
}

export function itemRequirements(item: PlacementItem): Capability[] {
  if (item.activity.type === "speak") return ["speech"];
  if (item.activity.type === "open_writing") return ["ai"];
  return [];
}

export function toBankItem(item: PlacementItem): BankItem {
  return {
    id: item.id,
    skill: item.skill,
    params: itemParams(item),
    calibration: item.calibration,
    selfAssessment: item.activity.type === "self_assess",
    requires: itemRequirements(item),
  };
}

export function buildBank(items: Iterable<PlacementItem>): Map<string, BankItem> {
  return new Map([...items].map((item) => [item.id, toBankItem(item)]));
}
