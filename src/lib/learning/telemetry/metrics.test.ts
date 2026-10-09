import { describe, expect, it } from "vitest";
import {
  learningMetrics,
  possibleFatigue,
  retention,
  type TelemetryInput,
  type TelemetryAttempt,
} from "./metrics";
import { evidenceSchema } from "../skill-estimation/estimate";

const now = new Date("2026-10-09T12:00:00Z");
const input = (): TelemetryInput => ({
  now,
  timezone: "America/Sao_Paulo",
  dailyMinutes: 90,
  weeklyGoalDays: 5,
  sessions: [],
  attempts: [],
  reviews: [],
  evidence: [],
  events: [],
  days: [],
});
function attempts(sessionId = "s", fatigue = true): TelemetryAttempt[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: `${sessionId}-${i}`,
    activityId: `task-${i}`,
    sessionId,
    type: "dictation",
    level: "A2",
    score: fatigue && i >= 8 ? 0.5 : 1,
    hinted: false,
    selfRated: false,
    durationMs: i >= 8 ? 4000 : 2000,
    createdAt: new Date(now.getTime() + i * 1000),
  }));
}
function sample(n: number, shortPlan = false): TelemetryInput {
  const sessions = Array.from({ length: n }, (_, i) => ({
    id: `s${i}`,
    localDate: `2026-09-${String(i + 1).padStart(2, "0")}`,
    plannedMinutes: 120,
    activeSeconds: 3600,
    cursor: 1,
    status: "in_progress",
    plan: {
      version: 1 as const,
      date: "2026-09-01",
      minutes: 120,
      pace: "immersion" as const,
      seconds: shortPlan ? 1200 : 7200,
      blocks: [
        { kind: "review" as const, seconds: 3600, items: [], reason: "due" },
        { kind: "review" as const, seconds: 3600, items: [], reason: "due" },
        { kind: "review" as const, seconds: 1, items: [], reason: "due" },
      ],
    },
  }));
  return { ...input(), sessions, attempts: sessions.flatMap((s) => attempts(s.id)) };
}
describe("educational diagnostics", () => {
  it("compares durations within one learner only after each group has ten sessions on eight days", () => {
    const data = sample(20);
    data.sessions = data.sessions.map((s, i) => ({
      ...s,
      plannedMinutes: i < 10 ? 60 : 120,
      cursor: i < 10 ? 3 : 1,
    }));
    expect(
      learningMetrics(data).recommendation.find((r) => r.kind === "duration_comparison")?.message,
    ).toContain("60 min");
    expect(
      learningMetrics({ ...data, sessions: data.sessions.slice(0, 19) }).recommendation.some(
        (r) => r.kind === "duration_comparison",
      ),
    ).toBe(false);
  });
  it("separates chosen goal, available plan and observed work; does not punish an underfilled beginner plan", () => {
    const m = learningMetrics(sample(10, true));
    expect(m.sessions[0]).toMatchObject({
      goalMinutes: 120,
      plannedSeconds: 1200,
      activeSeconds: 3600,
      completed: 1,
      blocks: 3,
    });
    expect(m.recommendation).toEqual([]);
    expect(m.pace.find((p) => p.pace === "immersion")).toMatchObject({
      sessions: 10,
      days: 10,
      comparable: true,
    });
  });
  it("requires ten sessions/eight days and repeated matched decline before recommending split periods", () => {
    expect(learningMetrics(sample(3)).recommendation).toEqual([]);
    const enough = sample(10);
    expect(learningMetrics(enough).recommendation[0]).toMatchObject({
      kind: "split",
      confidence: "medium",
      sessions: 10,
      days: 10,
    });
    expect(learningMetrics({ ...enough, truncated: true }).recommendation).toEqual([]);
    expect(
      learningMetrics({
        ...enough,
        sessions: enough.sessions.map((s) => ({ ...s, localDate: "2026-09-01" })),
      }).recommendation,
    ).toEqual([]);
  });
  it("matches difficulty/type and excludes hints, self-ratings and retries from fatigue", () => {
    expect(possibleFatigue(attempts())).toBe(true);
    expect(possibleFatigue(attempts().map((a, i) => ({ ...a, level: i < 8 ? "A1" : "B1" })))).toBe(
      false,
    );
    expect(possibleFatigue(attempts().map((a) => ({ ...a, hinted: true })))).toBe(false);
    expect(
      learningMetrics({
        ...sample(10),
        attempts: Array.from({ length: 12 }, () => attempts("s0")[0]!),
      }).sessions[0]?.possibleFatigue,
    ).toBe(false);
  });
  it("distinguishes immediate and delayed recall, deduplicates repeats and withholds tiny percentages", () => {
    const review = {
      conceptId: "lex:bonjour",
      dimension: "recall",
      elapsedDays: 4,
      score: 1,
      hinted: false,
      selfRated: false,
      reviewedAt: now,
    };
    const tiny = retention(
      [
        review,
        review,
        { ...review, conceptId: "lex:other", score: null },
        { ...review, conceptId: "lex:hint", hinted: true },
        { ...review, conceptId: "lex:now", elapsedDays: 0 },
      ],
      "UTC",
    );
    expect(tiny.delayed).toMatchObject({ samples: 1, successes: 1, percent: null });
    expect(tiny.immediate.samples).toBe(1);
    const rows = Array.from({ length: 12 }, (_, i) => ({
      ...review,
      conceptId: `lex:${i % 6}`,
      score: i < 9 ? 1 : 0,
      reviewedAt: new Date(now.getTime() - (i % 3) * 86400000),
    }));
    expect(retention(rows, "UTC").delayed).toMatchObject({ samples: 6, percent: null });
    expect(
      retention(
        rows.map((r, i) => ({ ...r, conceptId: `lex:${i}` })),
        "UTC",
      ).delayed.percent,
    ).toBe(75);
  });
  it("aggregates useful skill evidence independently from minutes and simulated/self-reported results", () => {
    const e = evidenceSchema.parse({
      key: "a",
      taskId: "a",
      skill: "listening",
      difficulty: 2,
      score: 1,
      confidence: 0.8,
      quality: 0.8,
      guess: 0,
      occurredAt: now,
      concepts: [],
      source: "lesson",
      assessment: "deterministic",
      substantial: true,
    });
    const m = learningMetrics({
      ...input(),
      evidence: [
        e,
        { ...e, key: "b", assessment: "simulated" },
        { ...e, key: "c", skill: "speaking", assessment: "ai" },
      ],
      days: [
        { localDate: "2026-10-09", activeSeconds: 120 },
        { localDate: "2026-10-01", activeSeconds: 999 },
      ],
    });
    expect(m.skills.find((s) => s.skill === "listening")).toMatchObject({
      samples: 1,
      tasks: 1,
      weekSamples: 1,
    });
    expect(m.skills.find((s) => s.skill === "speaking")?.samples).toBe(0);
    expect(m.weekly).toMatchObject({
      from: "2026-10-05",
      activeSeconds: 120,
      referenceMinutes: 450,
    });
  });
  it("counts metadata-only starts/completions and unique concepts strengthened without causal claims", () => {
    const events = [
      {
        type: "activity_started",
        payload: { activityId: "task-0", streamId: crypto.randomUUID() },
        createdAt: now,
        sessionId: "s",
      },
      {
        type: "activity_completed",
        payload: {
          attemptId: "s-0",
          masteryChanges: [
            { conceptId: "lex:one", dimension: "recall", before: "learning", after: "familiar" },
          ],
        },
        createdAt: now,
        sessionId: "s",
      },
    ];
    const m = learningMetrics({ ...input(), attempts: attempts(), events: [...events, ...events] });
    expect(m.weekly.strengthened).toBe(1);
    expect(m.activityFlow).toEqual({ started: 1, completedAfterStart: 1 });
    expect(m.activity[0]?.completed).toBe(12);
  });
});
