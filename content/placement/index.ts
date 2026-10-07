import type { PlacementItemInput } from "@/lib/content/schema";
import { grammarItems } from "./grammar";
import { listeningItems } from "./listening";
import { pronunciationItems, selfAssessmentItems, speakingItems, writingItems } from "./production";
import { readingItems } from "./reading";
import { vocabularyItems } from "./vocabulary";

/**
 * Placement item bank. Correct options are authored first; the player shuffles
 * options per learner. Difficulty = level midpoint + offset (see docs/PLACEMENT.md).
 */
export const placementItems: PlacementItemInput[] = [
  ...vocabularyItems,
  ...grammarItems,
  ...readingItems,
  ...listeningItems,
  ...writingItems,
  ...pronunciationItems,
  ...speakingItems,
  ...selfAssessmentItems,
];
