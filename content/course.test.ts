import { describe, expect, it } from "vitest";
import { buildContentIndex, placementCoverage } from "@/lib/content/repository";
import { CEFR_LEVELS } from "@/lib/learning/cefr";
import { course } from "./index";

const { index, issues } = buildContentIndex(course);

describe("course content", () => {
  it("has no validation errors", () => {
    expect(issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(index).toBeDefined();
  });

  it("covers every level for every objectively measured placement skill", () => {
    const coverage = placementCoverage(index!);
    for (const skill of ["vocabulary", "grammar", "reading", "listening", "writing"]) {
      for (const level of CEFR_LEVELS) {
        expect(coverage[skill]?.[level], `${skill} ${level}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("has calibration items spread across levels", () => {
    const levels = new Set(
      [...index!.placementItems.values()]
        .filter((item) => item.calibration)
        .map((item) => item.level),
    );
    expect(levels.size).toBeGreaterThanOrEqual(5);
  });

  it("never repeats an option inside a question", () => {
    for (const item of index!.placementItems.values()) {
      const activity = item.activity;
      const optionSets =
        activity.type === "choice"
          ? [activity.options]
          : activity.type === "reading" || activity.type === "listening"
            ? activity.questions.map((question) => question.options)
            : [];
      for (const options of optionSets) {
        expect(new Set(options).size, item.id).toBe(options.length);
      }
    }
  });
});
