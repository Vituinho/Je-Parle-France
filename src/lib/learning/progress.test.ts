import { describe, expect, it } from "vitest";
import { fixtureCourse } from "@/test/content-fixture";
import { conceptSchema } from "@/lib/content/schema";
import { applyReview, type MemoryTraceState } from "./memory/memory";
import { habitSummary, levelProgress, vocabularyCounts } from "./progress";

const NOW = new Date("2026-10-10T12:00:00Z");
const concepts = fixtureCourse().concepts.map((c) => conceptSchema.parse(c));

function matured(conceptId: string, dimension: MemoryTraceState["dimension"]) {
  let trace: MemoryTraceState | null = null;
  let at = new Date(NOW.getTime() - 200 * 86_400_000);
  while (at.getTime() < NOW.getTime()) {
    trace = applyReview({
      trace,
      conceptId,
      dimension,
      outcome: { score: 1, correct: true, verdict: "correct" },
      now: at,
      source: "lesson",
    }).trace;
    at = trace.due;
  }
  return trace as MemoryTraceState;
}

describe("level progress", () => {
  it("is zero with no knowledge and grows with mastery, per skill", () => {
    expect(levelProgress("A0", concepts, [], NOW).percent).toBe(0);
    const traces = [matured("lex:bonjour", "recognition"), matured("lex:merci", "recognition")];
    const progress = levelProgress("A0", concepts, traces, NOW);
    expect(progress.percent).toBeGreaterThan(0);
    expect(progress.bySkill.reading).toBeGreaterThan(progress.bySkill.speaking ?? 0);
    expect(progress.bySkill.pronunciation).toBeNull(); // no pronunciation concepts in the fixture
  });
});

describe("vocabulary counts", () => {
  it("counts a word as learned only once it is reliably recognised", () => {
    const fresh = applyReview({
      trace: null,
      conceptId: "lex:hier",
      dimension: "recognition",
      outcome: { score: 1, correct: true, verdict: "correct" },
      now: NOW,
      source: "lesson",
    }).trace;
    const counts = vocabularyCounts(concepts, [fresh, matured("lex:bonjour", "recognition")], NOW);
    expect(counts).toMatchObject({ seen: 2, learned: 1 });
  });
});

describe("healthy habits", () => {
  it("tracks the weekly goal Monday to Sunday", () => {
    const summary = habitSummary({
      activeDates: ["2026-10-05", "2026-10-06", "2026-10-08"],
      today: "2026-10-08",
      weeklyGoal: 3,
    });
    expect(summary.week.map((d) => d.active)).toEqual([
      true,
      true,
      false,
      true,
      false,
      false,
      false,
    ]);
    expect(summary.weeklyGoalMet).toBe(true);
  });

  it("forgives one rest day per week without breaking the streak", () => {
    const summary = habitSummary({
      activeDates: ["2026-10-04", "2026-10-05", "2026-10-07", "2026-10-08"],
      today: "2026-10-08",
      weeklyGoal: 5,
    });
    expect(summary.streakDays).toBe(4);
    expect(summary.restDayUsedThisWeek).toBe(true);
  });

  it("does not break the streak just because today has not started", () => {
    const summary = habitSummary({
      activeDates: ["2026-10-06", "2026-10-07"],
      today: "2026-10-08",
      weeklyGoal: 5,
    });
    expect(summary.streakDays).toBe(2);
  });

  it("ends the streak after a second missed day in the same week", () => {
    const summary = habitSummary({
      activeDates: ["2026-10-05", "2026-10-08"],
      today: "2026-10-08",
      weeklyGoal: 5,
    });
    expect(summary.streakDays).toBe(1);
  });

  it("counts consecutive weeks that met the goal", () => {
    const dates = [
      "2026-09-21",
      "2026-09-22",
      "2026-09-28",
      "2026-09-29",
      "2026-10-05",
      "2026-10-06",
    ];
    expect(
      habitSummary({ activeDates: dates, today: "2026-10-07", weeklyGoal: 2 }).weeksInARow,
    ).toBe(3);
  });
});
