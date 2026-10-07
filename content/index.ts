import type { CourseInput } from "@/lib/content/schema";
import { a0Concepts } from "./concepts/a0";
import { a0Modules } from "./curriculum/a0";
import { placementItems } from "./placement";
import { scenarios } from "./scenarios";

/**
 * Entry point for all course content. Each collection is assembled from the
 * files in this directory; see docs/CONTENT-GUIDELINES.md.
 */
export const course: CourseInput = {
  concepts: [...a0Concepts],
  modules: [...a0Modules],
  placementItems,
  scenarios,
  authentic: [],
};
