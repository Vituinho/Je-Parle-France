import { conceptDimensions } from "@/lib/content/repository";
import type { Concept } from "@/lib/content/schema";
import type { CefrLevel } from "./cefr";
import { MASTERY_VALUE, masteryOf, type MemoryTraceState } from "./memory/memory";
import { SKILLS, skillsForEvidence, type Skill } from "./skills";
import { addDays, weekStart } from "./time";

/**
 * Progress is measured from mastery, never from lessons completed: a level is
 * "38 %" when its concepts are, on average, 38 % of the way to mastered across
 * the dimensions they are tracked on.
 */
export interface LevelProgress {
  level: CefrLevel;
  percent: number;
  bySkill: Record<Skill, number | null>;
}

function traceIndex(traces: readonly MemoryTraceState[]) {
  return new Map(traces.map((trace) => [`${trace.conceptId}#${trace.dimension}`, trace]));
}

export function levelProgress(
  level: CefrLevel,
  concepts: readonly Concept[],
  traces: readonly MemoryTraceState[],
  now: Date,
): LevelProgress {
  const byKey = traceIndex(traces);
  const sums = Object.fromEntries(SKILLS.map((skill) => [skill, { total: 0, count: 0 }])) as Record<
    Skill,
    { total: number; count: number }
  >;
  let total = 0;
  let count = 0;
  for (const concept of concepts.filter((c) => c.level === level)) {
    for (const dimension of conceptDimensions(concept)) {
      const value = MASTERY_VALUE[masteryOf(byKey.get(`${concept.id}#${dimension}`), now)];
      total += value;
      count += 1;
      for (const skill of skillsForEvidence(concept.kind, dimension)) {
        sums[skill].total += value;
        sums[skill].count += 1;
      }
    }
  }
  const bySkill = Object.fromEntries(
    SKILLS.map((skill) => [
      skill,
      sums[skill].count === 0 ? null : Math.round((sums[skill].total / sums[skill].count) * 100),
    ]),
  ) as Record<Skill, number | null>;
  return { level, percent: count === 0 ? 0 : Math.round((total / count) * 100), bySkill };
}

export interface VocabularyCounts {
  /** Words/expressions understood reliably (recognition or listening at least familiar). */
  learned: number;
  /** Of those, the ones that are strong or mastered in every practised dimension. */
  strong: number;
  /** Lexical items seen at least once. */
  seen: number;
}

export function vocabularyCounts(
  concepts: readonly Concept[],
  traces: readonly MemoryTraceState[],
  now: Date,
): VocabularyCounts {
  const byConcept = new Map<string, MemoryTraceState[]>();
  for (const trace of traces) {
    const list = byConcept.get(trace.conceptId) ?? [];
    list.push(trace);
    byConcept.set(trace.conceptId, list);
  }
  let learned = 0;
  let strong = 0;
  let seen = 0;
  for (const concept of concepts) {
    if (concept.kind !== "lexical") continue;
    const own = byConcept.get(concept.id) ?? [];
    if (own.length === 0) continue;
    seen += 1;
    const states = own
      .filter((trace) => trace.reps > 0)
      .map((trace) => ({ trace, state: masteryOf(trace, now) }));
    const receptive = states.filter(
      ({ trace }) => trace.dimension === "recognition" || trace.dimension === "listening",
    );
    if (receptive.some(({ state }) => MASTERY_VALUE[state] >= MASTERY_VALUE.familiar)) learned += 1;
    if (
      states.length > 0 &&
      states.every(({ state }) => MASTERY_VALUE[state] >= MASTERY_VALUE.strong)
    ) {
      strong += 1;
    }
  }
  return { learned, strong, seen };
}

// ─── Healthy habits ────────────────────────────────────────────────────────

/** Days with at least this much study count as active (a habit, not a click). */
export const ACTIVE_DAY_SECONDS = 120;

export function isActiveDay(day: { studySeconds: number; sessionCompleted: boolean }): boolean {
  return day.studySeconds >= ACTIVE_DAY_SECONDS || day.sessionCompleted;
}

export interface HabitSummary {
  /** Mon…Sun of the current week: did the learner study that day? */
  week: { date: string; active: boolean; today: boolean }[];
  activeThisWeek: number;
  weeklyGoal: number;
  weeklyGoalMet: boolean;
  /** Consecutive weeks (ending with the last completed week) that met the goal. */
  weeksInARow: number;
  /** Consecutive study days, where one missed day per calendar week is a rest day. */
  streakDays: number;
  restDayUsedThisWeek: boolean;
}

/**
 * A streak that does not punish rest: one missed day per calendar week keeps
 * the streak alive. Today does not break the streak until it is over.
 */
export function habitSummary(params: {
  activeDates: readonly string[];
  today: string;
  weeklyGoal: number;
}): HabitSummary {
  const active = new Set(params.activeDates);
  const monday = weekStart(params.today);
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return { date, active: active.has(date), today: date === params.today };
  });
  const activeThisWeek = week.filter((day) => day.active).length;

  let weeksInARow = 0;
  for (let w = 1; w < 520; w += 1) {
    const start = addDays(monday, -7 * w);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i)).filter((date) =>
      active.has(date),
    ).length;
    if (days >= params.weeklyGoal) weeksInARow += 1;
    else break;
  }
  if (activeThisWeek >= params.weeklyGoal) weeksInARow += 1;

  let streakDays = 0;
  const restUsed = new Set<string>();
  let cursor = active.has(params.today) ? params.today : addDays(params.today, -1);
  for (let guard = 0; guard < 3650; guard += 1) {
    if (active.has(cursor)) {
      streakDays += 1;
    } else {
      const weekKey = weekStart(cursor);
      if (restUsed.has(weekKey) || streakDays === 0) break;
      restUsed.add(weekKey);
    }
    cursor = addDays(cursor, -1);
  }

  return {
    week,
    activeThisWeek,
    weeklyGoal: params.weeklyGoal,
    weeklyGoalMet: activeThisWeek >= params.weeklyGoal,
    weeksInARow,
    streakDays,
    restDayUsedThisWeek: restUsed.has(monday),
  };
}
