/**
 * Validates course content: schemas, cross-references, prerequisite graph and
 * placement bank coverage. Exits non-zero on errors; prints warnings.
 */
import { course } from "../content/index";
import { buildContentIndex, placementCoverage } from "../src/lib/content/repository";

const { index, issues } = buildContentIndex(course);
const errors = issues.filter((issue) => issue.severity === "error");
const warnings = issues.filter((issue) => issue.severity === "warning");

for (const issue of warnings) console.warn(`warning  ${issue.path}: ${issue.message}`);
for (const issue of errors) console.error(`error    ${issue.path}: ${issue.message}`);

if (index) {
  const activityCount = index.activities.size;
  console.log(
    `\n${index.concepts.size} concepts · ${index.modules.size} modules · ${index.units.size} units · ` +
      `${index.lessons.size} lessons · ${activityCount} activities · ` +
      `${index.placementItems.size} placement items · ${index.scenarios.size} scenarios`,
  );
  console.table(placementCoverage(index));
}

console.log(`\n${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length > 0 ? 1 : 0);
