import { course } from "@content/index";
import { buildContentIndex, type ContentIndex } from "./repository";

export * from "./repository";

let cached: ContentIndex | undefined;

/**
 * The validated course content. Invalid content fails fast: it is caught by
 * `npm run content:check` and the unit tests long before it reaches runtime.
 */
export function getContent(): ContentIndex {
  if (cached) return cached;
  const { index, issues } = buildContentIndex(course);
  if (!index) {
    const errors = issues.filter((issue) => issue.severity === "error");
    throw new Error(
      `Invalid course content (${errors.length} errors):\n` +
        errors.map((issue) => `  - ${issue.path}: ${issue.message}`).join("\n"),
    );
  }
  cached = index;
  return cached;
}
