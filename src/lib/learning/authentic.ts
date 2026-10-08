import type { AuthenticContent } from "@/lib/content/schema";
import { levelIndex, type CefrLevel } from "./cefr";
import { hashString } from "./random";

/**
 * Orders authentic material for a learner: what fits their level (up to one
 * level above, so it stays a stretch rather than a wall) and their
 * destination first. Pure and deterministic.
 */
export interface AuthenticFit {
  item: AuthenticContent;
  /** Within reach: at most one level above the learner. */
  fits: boolean;
  /** Matches the learner's destination (international material always does). */
  preferred: boolean;
}

export function rankAuthentic(
  items: readonly AuthenticContent[],
  learner: { level: CefrLevel; regions: readonly string[] },
): AuthenticFit[] {
  return items
    .map((item) => ({
      item,
      fits: levelIndex(item.level) <= levelIndex(learner.level) + 1,
      preferred:
        item.region === "intl" ||
        learner.regions.length === 0 ||
        learner.regions.includes(item.region),
    }))
    .sort(
      (a, b) =>
        Number(b.fits) - Number(a.fits) ||
        Number(b.preferred) - Number(a.preferred) ||
        levelIndex(a.item.level) - levelIndex(b.item.level) ||
        a.item.id.localeCompare(b.item.id),
    );
}

/** One suggestion for the day, stable for the whole day, from what fits. */
export function dailyAuthentic(
  items: readonly AuthenticContent[],
  learner: { level: CefrLevel; regions: readonly string[]; date: string },
): AuthenticContent | null {
  const ranked = rankAuthentic(items, learner).filter((entry) => entry.fits && entry.preferred);
  if (ranked.length === 0) return null;
  return ranked[hashString(learner.date) % ranked.length]?.item ?? null;
}

/** Regions matching a destination chosen at onboarding. */
export function regionsFor(destination: string): string[] {
  switch (destination) {
    case "canada_quebec":
      return ["fr-CA"];
    case "france":
      return ["fr-FR"];
    default:
      return [];
  }
}
