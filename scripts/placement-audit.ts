/**
 * Prints the placement bank's distribution (level × skill, activity types,
 * regions, feedback coverage) so sparse cells are visible. Read-only.
 *
 *   npx tsx scripts/placement-audit.ts
 */
import { getContent } from "../src/lib/content";

const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1"] as const;
const items = [...getContent().placementItems.values()];
const skills = [...new Set(items.map((item) => item.skill))].sort();

const pad = (value: string | number, width = 8) => String(value).padStart(width);
console.log(`Placement bank: ${items.length} items\n`);
console.log(pad("skill", 14) + LEVELS.map((level) => pad(level, 6)).join("") + pad("total"));
for (const skill of skills) {
  const row = LEVELS.map(
    (level) => items.filter((item) => item.skill === skill && item.level === level).length,
  );
  console.log(
    pad(skill, 14) +
      row.map((count) => pad(count === 0 ? "·" : count, 6)).join("") +
      pad(row.reduce((a, b) => a + b, 0)),
  );
}

const count = (key: (item: (typeof items)[number]) => string) =>
  Object.entries(
    items.reduce<Record<string, number>>((acc, item) => {
      acc[key(item)] = (acc[key(item)] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => `${name} ${n}`)
    .join(" · ");

console.log(`\nActivity types: ${count((item) => item.activity.type)}`);
console.log(`Regions: ${count((item) => item.region)}`);
console.log(`Calibration items: ${items.filter((item) => item.calibration).length}`);

const choice = items.filter((item) => item.activity.type === "choice");
const withFeedback = choice.filter(
  (item) =>
    item.activity.type === "choice" &&
    (item.activity.optionFeedback?.some((feedback) => feedback !== null) ?? false),
);
console.log(
  `Choice items with authored per-option feedback: ${withFeedback.length}/${choice.length}`,
);
console.log(
  `Items probing at least one concept: ${items.filter((item) => item.concepts.length > 0).length}/${items.length}`,
);
