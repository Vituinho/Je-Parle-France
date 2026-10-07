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

describe("curriculum pedagogy", () => {
  const PRODUCTION = new Set([
    "type",
    "fill",
    "order",
    "dictation",
    "speak",
    "error_correction",
    "open_writing",
  ]);

  it("teaches every concept before practising it", () => {
    const introduced = new Set<string>();
    for (const ref of index!.paths.core) {
      for (const step of ref.lesson.steps) {
        if (step.type === "teach") {
          step.introduces.forEach((id) => introduced.add(id));
          continue;
        }
        for (const target of step.targets) {
          expect(
            introduced.has(target.concept),
            `${step.id} practises ${target.concept} before teaching it`,
          ).toBe(true);
        }
      }
    }
  });

  it("gives every lesson a teaching card and active production", () => {
    for (const ref of index!.lessons.values()) {
      const steps = ref.lesson.steps;
      expect(steps.length, ref.lesson.id).toBeGreaterThanOrEqual(5);
      expect(steps.length, ref.lesson.id).toBeLessThanOrEqual(14);
      expect(
        steps.some((s) => s.type === "teach"),
        `${ref.lesson.id} teaches`,
      ).toBe(true);
      expect(
        steps.some((s) => PRODUCTION.has(s.type)),
        `${ref.lesson.id} has production`,
      ).toBe(true);
    }
  });

  it("never repeats an option inside a lesson question", () => {
    for (const { activity } of index!.activities.values()) {
      if (activity.type === "choice" || activity.type === "multi_select") {
        expect(new Set(activity.options).size, activity.id).toBe(activity.options.length);
      }
      if (activity.type === "match") {
        expect(new Set(activity.pairs.map((p) => p.left)).size, activity.id).toBe(
          activity.pairs.length,
        );
        expect(new Set(activity.pairs.map((p) => p.right)).size, activity.id).toBe(
          activity.pairs.length,
        );
      }
    }
  });
});
