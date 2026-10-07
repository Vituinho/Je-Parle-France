import type { CourseInput } from "@/lib/content/schema";
import { placementItems } from "./placement";

/**
 * Entry point for all course content. Each collection is assembled from the
 * files in this directory; see docs/CONTENT-GUIDELINES.md.
 */
export const course: CourseInput = {
  concepts: [],
  modules: [],
  placementItems,
  scenarios: [],
  authentic: [],
};
