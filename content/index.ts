import type { CourseInput } from "@/lib/content/schema";
import { authentic } from "./authentic";
import { a0Concepts } from "./concepts/a0";
import { a1Concepts } from "./concepts/a1";
import { a12Concepts } from "./concepts/a1-2";
import { a2Concepts } from "./concepts/a2";
import { a22Concepts } from "./concepts/a2-2";
import { b1Concepts } from "./concepts/b1";
import { canadaConcepts } from "./concepts/canada";
import { franceConcepts } from "./concepts/france";
import { a0Modules } from "./curriculum/a0";
import { a1Modules } from "./curriculum/a1";
import { a2Modules } from "./curriculum/a2";
import { b1Modules } from "./curriculum/b1";
import { canadaModules } from "./curriculum/canada";
import { franceModules } from "./curriculum/france";
import { placementItems } from "./placement";
import { scenarios } from "./scenarios";

/**
 * Entry point for all course content. Each collection is assembled from the
 * files in this directory; see docs/CONTENT-GUIDELINES.md.
 */
export const course: CourseInput = {
  concepts: [
    ...a0Concepts,
    ...a1Concepts,
    ...a12Concepts,
    ...a2Concepts,
    ...a22Concepts,
    ...b1Concepts,
    ...canadaConcepts,
    ...franceConcepts,
  ],
  modules: [
    ...a0Modules,
    ...a1Modules,
    ...a2Modules,
    ...b1Modules,
    ...canadaModules,
    ...franceModules,
  ],
  placementItems,
  scenarios,
  authentic,
};
