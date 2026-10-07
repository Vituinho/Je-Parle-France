import { describe, expect, it } from "vitest";
import { applyReview, introduceTrace, type MemoryTraceState } from "../memory/memory";
import type { Dimension, Skill } from "../skills";
import {
  blockKinds,
  planSession,
  reviewCandidates,
  type PlannerInput,
  type UpcomingLesson,
} from "./planner";

const NOW = new Date("2026-10-10T12:00:00Z");
const DAY = 86_400_000;

function practised(
  conceptId: string,
  dimension: Dimension,
  daysAgo: number,
  correct = true,
  source: MemoryTraceState["source"] = "lesson",
) {
  return applyReview({
    trace: null,
    conceptId,
    dimension,
    outcome: correct
      ? { score: 1, correct: true, verdict: "correct" }
      : { score: 0, correct: false, verdict: "wrong" },
    now: new Date(NOW.getTime() - daysAgo * DAY),
    source,
  }).trace;
}

/** A well-learned trace that is not due yet. */
function matured(conceptId: string, dimension: Dimension) {
  let trace: MemoryTraceState | null = null;
  let at = new Date(NOW.getTime() - 120 * DAY);
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

const concepts: Record<string, { kind: "lexical" | "grammar" | "pronunciation"; level: "A0" }> = {};
for (let i = 0; i < 60; i += 1) concepts[`lex:w${i}`] = { kind: "lexical", level: "A0" };
concepts["gram:g1"] = { kind: "grammar", level: "A0" };
concepts["pron:y-vs-u"] = { kind: "pronunciation", level: "A0" };

const skills = (overrides: Partial<Record<Skill, number>> = {}) =>
  Object.fromEntries(
    (
      [
        "reading",
        "listening",
        "speaking",
        "writing",
        "vocabulary",
        "grammar",
        "pronunciation",
      ] as Skill[]
    ).map((skill) => [skill, { theta: overrides[skill] ?? 1 }]),
  ) as Record<Skill, { theta: number }>;

const upcoming: UpcomingLesson[] = [
  { lessonId: "a0-u2-l1", track: "core", minutes: 7, steps: 10, stepIndex: 0, newConcepts: 1 },
  { lessonId: "a0-u2-l2", track: "core", minutes: 6, steps: 7, stepIndex: 0, newConcepts: 1 },
  { lessonId: "a0-u3-l1", track: "core", minutes: 6, steps: 8, stepIndex: 0, newConcepts: 1 },
  { lessonId: "ca-u1-l1", track: "canada", minutes: 7, steps: 9, stepIndex: 0, newConcepts: 5 },
];

function input(overrides: Partial<PlannerInput> = {}): PlannerInput {
  const traces = [
    // a handful of due items (practised 4 days ago → short intervals have elapsed)
    ...Array.from({ length: 6 }, (_, i) => practised(`lex:w${i}`, "recognition", 4)),
    practised("lex:w10", "speaking", 3),
    practised("pron:y-vs-u", "listening", 2),
    practised("lex:w20", "listening", 1),
    practised("lex:w21", "recall", 1),
    // well-learned items that feed skill blocks
    ...["lex:w50", "lex:w51", "lex:w52", "lex:w53"].flatMap((id) => [
      matured(id, "listening"),
      matured(id, "speaking"),
      matured(id, "recall"),
    ]),
    matured("pron:y-vs-u", "pronunciation"),
  ];
  return {
    now: NOW,
    date: "2026-10-10",
    dailyMinutes: 15,
    traces,
    concept: (id) => concepts[id],
    upcoming,
    skills: skills(),
    relocation: true,
    recentBlocks: [],
    capabilities: { conversation: false },
    ...overrides,
  };
}

describe("daily session planner", () => {
  it("is deterministic", () => {
    expect(planSession(input())).toEqual(planSession(input()));
  });

  it("starts with review when items are due", () => {
    const plan = planSession(input());
    expect(plan.blocks[0]?.kind).toBe("review");
  });

  it("composes genuinely different sessions for 5, 15, 30 and 60 minutes", () => {
    const shapes = [5, 15, 30, 60].map((minutes) => {
      const plan = planSession(
        input({ dailyMinutes: minutes, capabilities: { conversation: true }, scenarioId: "scn-x" }),
      );
      return { minutes, plan, kinds: blockKinds(plan) };
    });
    const [five, fifteen, thirty, sixty] = shapes as [
      (typeof shapes)[0],
      (typeof shapes)[0],
      (typeof shapes)[0],
      (typeof shapes)[0],
    ];

    // 5 min: a micro-lesson, not a whole one
    const fiveLesson = five.plan.blocks.find((b) => b.kind === "lesson");
    expect(
      fiveLesson && fiveLesson.kind === "lesson" ? fiveLesson.maxSteps : undefined,
    ).toBeDefined();
    // 15 min: one full lesson
    expect(
      fifteen.plan.blocks.filter((b) => b.kind === "lesson" && b.maxSteps === undefined).length,
    ).toBe(1);
    // 30+: more than one lesson, and a destination-track lesson for someone relocating
    expect(thirty.plan.blocks.filter((b) => b.kind === "lesson").length).toBeGreaterThanOrEqual(2);
    expect(sixty.plan.blocks.some((b) => b.kind === "lesson" && b.track === "canada")).toBe(true);
    // conversation only in longer sessions
    expect(fifteen.kinds).not.toContain("conversation");
    expect(sixty.kinds).toContain("conversation");
    // each plan stays within its time (whole lessons may overshoot slightly)
    for (const { minutes, plan } of shapes)
      expect(plan.seconds).toBeLessThanOrEqual(minutes * 60 * 1.2);
    // and longer sessions are richer
    expect(new Set(sixty.kinds).size).toBeGreaterThan(new Set(five.kinds).size);
  });

  it("puts review first and halves new material under a backlog", () => {
    const backlog = Array.from({ length: 50 }, (_, i) => practised(`lex:w${i}`, "recall", 6));
    const plan = planSession(input({ traces: backlog, dailyMinutes: 15 }));
    const review = plan.blocks.find((b) => b.kind === "review");
    expect(review?.seconds ?? 0).toBeGreaterThanOrEqual(15 * 60 * 0.5);
    expect(review?.reason).toContain("revisão vem antes");
  });

  it("goes straight to new material for a brand-new learner", () => {
    const plan = planSession(input({ traces: [] }));
    expect(plan.blocks[0]?.kind).toBe("lesson");
    expect(plan.blocks.some((b) => b.kind === "review")).toBe(false);
  });

  it("prioritises placement gaps and lapsed items", () => {
    const gap = practised("lex:w40", "recognition", 0.05, false, "placement_gap");
    const ordinary = practised("lex:w41", "recognition", 4);
    const ranked = reviewCandidates({
      traces: [ordinary, gap],
      now: NOW,
      concept: (id) => concepts[id],
    });
    expect(ranked[0]?.conceptId).toBe("lex:w40");
  });

  it("schedules production for concepts the learner only recognises", () => {
    const known = practised("lex:w30", "recognition", 0);
    const unpractisedSpeaking = introduceTrace("lex:w30", "speaking", NOW);
    const ranked = reviewCandidates({
      traces: [known, unpractisedSpeaking],
      now: NOW,
      concept: (id) => concepts[id],
    });
    expect(ranked.some((c) => c.conceptId === "lex:w30" && c.dimension === "speaking")).toBe(true);
  });

  it("rotates skill blocks instead of repeating yesterday's", () => {
    const base = planSession(input({ dailyMinutes: 15 }));
    const firstFocus = base.blocks.find((b) => b.kind === "focus");
    expect(firstFocus).toBeDefined();
    if (firstFocus?.kind !== "focus") return;
    const next = planSession(
      input({ dailyMinutes: 15, recentBlocks: [`focus:${firstFocus.skill}`] }),
    );
    const nextFocus = next.blocks.find((b) => b.kind === "focus");
    expect(nextFocus && nextFocus.kind === "focus" ? nextFocus.skill : null).not.toBe(
      firstFocus.skill,
    );
  });

  it("targets the weakest skill", () => {
    const plan = planSession(
      input({ dailyMinutes: 15, skills: skills({ listening: 0.1 }), relocation: false }),
    );
    const focus = plan.blocks.find((b) => b.kind === "focus");
    expect(focus && focus.kind === "focus" ? focus.skill : null).toBe("listening");
  });

  it("never includes the same item twice", () => {
    const plan = planSession(input({ dailyMinutes: 60 }));
    const keys = plan.blocks.flatMap((b) =>
      "items" in b ? b.items.map((i) => `${i.conceptId}#${i.dimension}`) : [],
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});
