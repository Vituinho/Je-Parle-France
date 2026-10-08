import type { CourseInput } from "@/lib/content/schema";
import { a0Concepts } from "./concepts/a0";
import { canadaConcepts } from "./concepts/canada";
import { franceConcepts } from "./concepts/france";
import { a0Modules } from "./curriculum/a0";
import { canadaModules } from "./curriculum/canada";
import { franceModules } from "./curriculum/france";
import { placementItems } from "./placement";
import { scenarios } from "./scenarios";

/**
 * Entry point for all course content. Each collection is assembled from the
 * files in this directory; see docs/CONTENT-GUIDELINES.md.
 */
export const course: CourseInput = {
  concepts: [...a0Concepts, ...canadaConcepts, ...franceConcepts],
  modules: [...a0Modules, ...canadaModules, ...franceModules],
  placementItems,
  scenarios,
  authentic: [],
};
