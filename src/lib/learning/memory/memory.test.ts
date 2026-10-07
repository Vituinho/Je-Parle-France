import { Rating } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import {
  applyReview,
  conceptMastery,
  introduceTrace,
  isDue,
  masteryOf,
  ratingFor,
  retrievability,
  type MemoryTraceState,
  type Outcome,
} from "./memory";

const DAY = 24 * 60 * 60 * 1000;
const start = new Date("2026-10-01T12:00:00Z");
const at = (days: number) => new Date(start.getTime() + days * DAY);

const good: Outcome = { score: 1, correct: true, verdict: "correct" };
const almost: Outcome = { score: 0.8, correct: true, verdict: "almost" };
const wrong: Outcome = { score: 0, correct: false, verdict: "wrong" };

function review(trace: MemoryTraceState | null, outcome: Outcome, now: Date) {
  return applyReview({
    trace,
    conceptId: "lex:avoir-besoin-de",
    dimension: "speaking",
    outcome,
    now,
    source: "lesson",
  }).trace;
}

/** Reviews exactly when due, `times` times, always with the same outcome. */
function reviewOnSchedule(outcome: Outcome, times: number) {
  let trace = review(null, outcome, start);
  for (let i = 1; i < times; i += 1) trace = review(trace, outcome, trace.due);
  return trace;
}

describe("ratingFor", () => {
  it("maps outcomes to conservative FSRS ratings", () => {
    expect(ratingFor(good)).toBe(Rating.Good);
    expect(ratingFor(almost)).toBe(Rating.Hard);
    expect(ratingFor({ ...good, hinted: true })).toBe(Rating.Hard);
    expect(ratingFor(wrong)).toBe(Rating.Again);
    expect(ratingFor({ score: 0.5, correct: true, verdict: "recorded", selfRated: true })).toBe(
      Rating.Hard,
    );
  });
});

describe("memory traces", () => {
  it("starts as introduced and becomes learning after the first practice", () => {
    const introduced = introduceTrace("lex:bonjour", "recognition", start);
    expect(masteryOf(introduced, start)).toBe("introduced");
    expect(masteryOf(null, start)).toBe("unseen");
    const practised = review(introduced, good, start);
    expect(masteryOf(practised, start)).toBe("learning");
    expect(practised.attempts).toBe(1);
  });

  it("grows intervals with successful reviews and reaches mastery over months", () => {
    const after3 = reviewOnSchedule(good, 3);
    const after8 = reviewOnSchedule(good, 8);
    expect(after8.scheduledDays).toBeGreaterThan(after3.scheduledDays);
    expect(["strong", "mastered"]).toContain(masteryOf(after8, after8.lastReview as Date));
    expect(masteryOf(reviewOnSchedule(good, 12), at(0))).not.toBe("learning");
  });

  it("schedules failed items again soon", () => {
    const strong = reviewOnSchedule(good, 5);
    const lapsed = review(strong, wrong, strong.due);
    expect(lapsed.lapses).toBe(strong.lapses + 1);
    expect(lapsed.due.getTime() - (lapsed.lastReview as Date).getTime()).toBeLessThan(DAY);
    expect(masteryOf(lapsed, lapsed.lastReview as Date)).toBe("learning");
  });

  it("marks well-learned items as decaying when long overdue", () => {
    const trace = reviewOnSchedule(good, 5);
    const muchLater = new Date(trace.due.getTime() + trace.scheduledDays * 6 * DAY);
    expect(retrievability(trace, muchLater)).toBeLessThan(0.8);
    expect(masteryOf(trace, muchLater)).toBe("decaying");
    expect(isDue(trace, muchLater)).toBe(true);
  });

  it("does not move the schedule on weak evidence, but counts it", () => {
    const first = review(null, good, start);
    const weak = applyReview({
      trace: first,
      conceptId: first.conceptId,
      dimension: first.dimension,
      outcome: wrong,
      weight: 0.3,
      now: at(1),
      source: "lesson",
    });
    expect(weak.log).toBeNull();
    expect(weak.trace.due).toEqual(first.due);
    expect(weak.trace.attempts).toBe(2);
  });
});

describe("concept mastery", () => {
  it("separates recognising a phrase from producing it", () => {
    const recognition = { ...reviewOnSchedule(good, 6), dimension: "recognition" as const };
    const now = recognition.lastReview as Date;
    const mastery = conceptMastery([recognition], ["recognition", "speaking"], now);
    expect(mastery.byDimension.recognition).not.toBe("unseen");
    expect(mastery.byDimension.speaking).toBe("unseen");
    expect(mastery.missing).toEqual(["speaking"]);
  });

  it("is as strong as the weakest practised dimension", () => {
    const recognition = { ...reviewOnSchedule(good, 6), dimension: "recognition" as const };
    const speaking = { ...review(null, wrong, start), dimension: "speaking" as const };
    const mastery = conceptMastery(
      [recognition, speaking],
      ["recognition", "speaking"],
      speaking.lastReview as Date,
    );
    expect(mastery.overall).toBe("learning");
  });
});
