import { describe, expect, it } from "vitest";
import { applyReview, introduceTrace, type MemoryTraceState } from "../memory/memory";
import type { Dimension, Skill } from "../skills";
import {
  blockKinds,
  planSession,
  reviewCandidates,
  dailyNewConceptLimit,
  lessonWindow,
  type PlannerInput,
  type UpcomingLesson,
} from "./planner";

const NOW = new Date("2026-10-10T12:00:00Z");

it("consumes sufficient telemetry advice deterministically without changing the chosen plan budget or tasks", () => {
  const baseline = planSession(input({ dailyMinutes: 90 }));
  const advice = {
    kind: "split" as const,
    confidence: "medium" as const,
    message: "Divida em dois períodos.",
    sessions: 10,
    days: 8,
  };
  const params = input({ dailyMinutes: 90, telemetryAdvice: [advice] });
  const result = planSession(params);
  expect(result).toEqual(planSession(params));
  expect(result.studyAdvice).toEqual([advice]);
  expect(result.blocks).toEqual(baseline.blocks);
  expect(result.minutes).toBe(baseline.minutes);
  expect(planSession(input({ telemetryAdvice: [{ ...advice, sessions: 3 }] })).studyAdvice).toEqual(
    [],
  );
});

it("applies a beginner's newly taught words in multiple modes with a natural break and bounded repetition", () => {
  const plan = planSession(
    input({
      dailyMinutes: 90,
      traces: [],
      practice: [],
      capabilities: { conversation: false },
      upcoming: [
        {
          lessonId: "first",
          track: "core",
          minutes: 12,
          steps: 2,
          stepIndex: 0,
          newConcepts: 4,
          introducedByStep: [["lex:w1", "lex:w2", "lex:w3", "lex:w4"], []],
        },
      ],
      concept: () => ({
        kind: "lexical",
        level: "A0",
        dimensions: ["listening", "recall", "speaking"],
      }),
    }),
  );
  expect(new Set(plan.blocks.filter((b) => b.kind === "focus").map((b) => b.skill))).toEqual(
    new Set(["speaking", "listening", "writing"]),
  );
  expect(plan.segments).toHaveLength(2);
  expect(plan.segments![0]!.end).toBe(1);
  expect(plan.seconds).toBeLessThan(30 * 60); // Do not manufacture a full ninety minutes from four words.
  expect(plan.blocks.some((b) => b.kind === "review")).toBe(false);
});
const DAY = 86_400_000;

const intensivePractice = ["listening", "speaking", "writing", "pronunciation", "reading"].flatMap(
  (skill) =>
    Array.from({ length: 10 }, (_, n) => ({
      activityId: `${skill}-${n}`,
      skill: skill as import("./planner").FocusSkill,
      seconds: 150,
      concepts: ["lex:w50"],
      level: 1,
    })),
);

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

  it("changes focus when continuous listening evidence improves the latent estimate", () => {
    const measured = (listening: number): PlannerInput["skills"] =>
      Object.fromEntries(
        Object.entries(
          skills({
            listening,
            speaking: 2.5,
            reading: 3.5,
            vocabulary: 3.5,
            grammar: 3.5,
            writing: 3.5,
            pronunciation: 3.5,
          }),
        ).map(([skill, state]) => [skill, { ...state, confidence: "medium" }]),
      ) as PlannerInput["skills"];
    const base = input({ upcoming: [], skills: measured(1.8) });
    const first = planSession(base).blocks.find((b) => b.kind === "focus");
    const next = planSession({ ...base, skills: measured(3.6) }).blocks.find(
      (b) => b.kind === "focus",
    );
    expect(first).toMatchObject({
      skill: "listening",
      reason: expect.stringContaining("evidências recentes"),
    });
    expect(next).toMatchObject({ skill: "speaking" });
  });

  it("does not let an uncertain production starting point dominate a measured listening gap", () => {
    const estimates: PlannerInput["skills"] = skills({
      reading: 3.5,
      vocabulary: 3.5,
      grammar: 3.5,
      writing: 3.5,
      pronunciation: 3.5,
      listening: 1.2,
      speaking: 0,
    });
    for (const state of Object.values(estimates)) state.confidence = "medium";
    estimates.speaking.confidence = "low";
    const plan = planSession(input({ upcoming: [], skills: estimates }));
    expect(plan.blocks.find((b) => b.kind === "focus")).toMatchObject({ skill: "listening" });
    expect(plan.seconds).toBeLessThanOrEqual(15 * 60);
  });

  it("explains uncertain focus as confirmation while keeping variety and overdue reviews", () => {
    const estimates: PlannerInput["skills"] = skills({ listening: 0 });
    for (const state of Object.values(estimates)) state.confidence = "low";
    const plan = planSession(input({ skills: estimates, dailyMinutes: 30 }));
    expect(plan.blocks[0]?.kind).toBe("review");
    const focus = plan.blocks.find((b) => b.kind === "focus");
    expect(focus).toMatchObject({
      skill: "listening",
      reason: expect.stringContaining("confirmar"),
    });
    expect(plan.blocks.some((b) => b.kind === "lesson" && b.track === "canada")).toBe(true);
    const next = planSession(
      input({ skills: estimates, dailyMinutes: 15, recentBlocks: ["focus:listening"] }),
    );
    expect(next.blocks.find((b) => b.kind === "focus")).not.toMatchObject({ skill: "listening" });
  });
});

describe("intensive study safeguards", () => {
  it.each([5, 15, 30, 45, 60, 90, 120, 180, 240])(
    "keeps %i-minute plans bounded and deterministic",
    (minutes) => {
      const state = input({
        dailyMinutes: minutes,
        studyPace: "accelerated",
        practice: intensivePractice,
      });
      const plan = planSession(state);
      expect(plan).toEqual(planSession(state));
      expect(plan.seconds).toBeLessThanOrEqual(minutes * 60);
      if (minutes === 5) expect(plan.blocks.length).toBeLessThanOrEqual(3);
    },
  );
  it("uses several skills, with production and listening, even without providers", () => {
    const plan = planSession(
      input({ dailyMinutes: 90, studyPace: "accelerated", practice: intensivePractice }),
    );
    const skills = new Set(plan.blocks.flatMap((b) => (b.kind === "focus" ? [b.skill] : [])));
    expect(skills.has("speaking")).toBe(true);
    expect(skills.has("writing")).toBe(true);
    expect(skills.has("listening")).toBe(true);
    expect(skills.size).toBeGreaterThanOrEqual(4);
    expect(plan.blocks.some((b) => b.kind === "conversation")).toBe(false);
    expect(plan.segments!.length).toBeGreaterThan(1);
    const ids = plan.blocks.flatMap((b) => (b.kind === "focus" ? (b.activityIds ?? []) : []));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("splits long plans into bounded resumable groups", () => {
    const plan = planSession(
      input({ dailyMinutes: 120, studyPace: "immersion", practice: intensivePractice }),
    );
    expect(plan.segments!.length).toBeGreaterThanOrEqual(3);
    expect(plan.segments!.every((s) => s.seconds <= 35 * 60)).toBe(true);
    expect(
      plan.segments!.flatMap((s) => Array.from({ length: s.end - s.start }, (_, n) => s.start + n)),
    ).toEqual(plan.blocks.map((_, n) => n));
  });
  it("protects memory with a daily, nonlinear new-material cap and a retention reduction", () => {
    const sixty = input({ dailyMinutes: 60, studyPace: "accelerated" });
    const longer = input({ dailyMinutes: 120, studyPace: "immersion" });
    expect(dailyNewConceptLimit(longer)).toBeLessThan(2 * dailyNewConceptLimit(sixty));
    const struggled = input({
      ...longer,
      traces: Array.from({ length: 10 }, (_, n) => practised("lex:w" + n, "recall", 1, false)),
    });
    expect(dailyNewConceptLimit(struggled)).toBeLessThan(dailyNewConceptLimit(longer));
    const exhausted = planSession(
      input({ dailyMinutes: 120, newConceptsToday: 30, practice: intensivePractice }),
    );
    expect(exhausted.blocks.some((b) => b.kind === "lesson")).toBe(false);
    expect(exhausted.blocks.some((b) => b.kind === "focus")).toBe(true);
  });
  it("stops a micro-lesson before the first teaching card exceeding its cap", () => {
    const state = input({
      dailyMinutes: 120,
      newConceptsToday: 15,
      upcoming: [
        {
          lessonId: "micro",
          track: "core",
          minutes: 6,
          steps: 6,
          stepIndex: 0,
          newConcepts: 5,
          introducedByStep: [[], ["lex:new1"], [], ["lex:new2", "lex:new3"], [], []],
        },
      ],
    });
    const plan = planSession(state);
    expect(plan.newConceptIds).toEqual(["lex:new1"]);
    expect(plan.blocks.find((b) => b.kind === "lesson")).toMatchObject({ maxSteps: 3 });
  });
  it("never turns future FSRS cards into due reviews or duplicates due items", () => {
    const state = input({ dailyMinutes: 120, practice: intensivePractice });
    const plan = planSession(state);
    const reviewed = plan.blocks.flatMap((b) => (b.kind === "review" ? b.items : []));
    expect(
      reviewed.every((item) =>
        state.traces.some(
          (t) =>
            t.conceptId === item.conceptId &&
            t.dimension === item.dimension &&
            t.reps > 0 &&
            t.due <= NOW,
        ),
      ),
    ).toBe(true);
    expect(new Set(reviewed.map((i) => i.conceptId + "#" + i.dimension)).size).toBe(
      reviewed.length,
    );
    expect(plan.blocks[0]?.kind).toBe("review");
  });
  it("favours measured listening weakness over strong reading without monopolizing time", () => {
    const state = input({
      dailyMinutes: 90,
      practice: intensivePractice,
      skills: skills({ reading: 3.5, listening: 0.5, speaking: 1, writing: 3 }),
    });
    const plan = planSession(state);
    const extra = plan.blocks.filter((b) => b.kind === "focus" && b.activityIds?.length);
    expect(extra[0]).toMatchObject({ skill: "listening" });
    const seconds = (skill: string) =>
      extra.reduce((sum, b) => sum + (b.kind === "focus" && b.skill === skill ? b.seconds : 0), 0);
    expect(seconds("listening")).toBeGreaterThan(seconds("reading"));
    expect(seconds("speaking")).toBeGreaterThan(0);
    expect(seconds("listening")).toBeLessThan(plan.seconds * 0.5);
  });
  it("does not bypass prerequisites or assign tasks above a weak skill's ability", () => {
    const plan = planSession(
      input({
        dailyMinutes: 90,
        practice: [
          ...intensivePractice,
          {
            activityId: "too-hard",
            skill: "listening",
            seconds: 120,
            concepts: ["lex:w50"],
            level: 4,
          },
        ],
        upcoming: [
          {
            lessonId: "locked",
            track: "core",
            minutes: 6,
            steps: 6,
            stepIndex: 0,
            newConcepts: 1,
            prerequisites: ["lex:not-met"],
          },
        ],
      }),
    );
    expect(plan.blocks.some((b) => b.kind === "lesson")).toBe(false);
    expect(plan.blocks.some((b) => b.kind === "focus" && b.activityIds?.includes("too-hard"))).toBe(
      false,
    );
  });
});

it("uses authored transformations rather than repeating activities from the planned lesson", () => {
  const plan = planSession(
    input({
      dailyMinutes: 90,
      practice: intensivePractice,
      upcoming: [
        {
          lessonId: "new",
          track: "core",
          minutes: 5,
          steps: 3,
          stepIndex: 0,
          newConcepts: 0,
          activityIdsByStep: ["listening-0", "speaking-0", "writing-0"],
        },
      ],
    }),
  );
  const extraIds = plan.blocks.flatMap((b) => (b.kind === "focus" ? (b.activityIds ?? []) : []));
  expect(extraIds).not.toContain("listening-0");
  expect(extraIds).not.toContain("speaking-0");
  expect(extraIds).not.toContain("writing-0");
});

it("rotates equally suitable practice across days and preserves the frozen micro-lesson end", () => {
  const state = input({ dailyMinutes: 90, practice: intensivePractice });
  const ids = (date: string) =>
    planSession({ ...state, date }).blocks.flatMap((b) =>
      b.kind === "focus" ? (b.activityIds ?? []) : [],
    );
  expect(ids("2026-10-10")).not.toEqual(ids("2026-10-11"));
  const micro = {
    kind: "lesson" as const,
    lessonId: "micro",
    track: "core" as const,
    startStep: 2,
    maxSteps: 3,
    seconds: 180,
    reason: "resume",
  };
  expect(lessonWindow(micro, 4, 10)).toEqual({ startAt: 4, maxSteps: 1, alreadyDone: false });
  expect(lessonWindow(micro, 8, 10)).toEqual({ startAt: 5, maxSteps: 0, alreadyDone: true });
});
