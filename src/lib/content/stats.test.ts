import { describe, expect, it } from "vitest";
import { course } from "@content/index";
import { buildContentIndex } from "./repository";
import { contentStats } from "./stats";

describe("contentStats", () => {
  it("adds up to the content index", () => {
    const { index } = buildContentIndex(course);
    const stats = contentStats(index!);
    const byKind = Object.values(stats.conceptsByKind).flatMap((levels) => Object.values(levels));
    expect(byKind.reduce((sum, n) => sum + n, 0)).toBe(stats.concepts);
    expect(stats.paths.reduce((sum, path) => sum + path.lessons, 0)).toBe(index!.lessons.size);
    expect(stats.activityTypes.reduce((sum, [, n]) => sum + n, 0)).toBe(index!.activities.size);
    expect(stats.paths.map((path) => path.track)).toEqual(["core", "canada", "france"]);
    expect(stats.untaught).toEqual([]);
  });
});
