import type { SessionPlan } from "../planner/planner";
import { evidenceWeight, type SkillEvidence } from "../skill-estimation/estimate";
import { SKILLS } from "../skills";
import { studyPace } from "../study-pace";
import { addDays, localDate, weekStart } from "../time";
import { learningEventSchema } from "./events";

export interface TelemetrySession {
  id: string;
  localDate: string;
  plannedMinutes: number;
  activeSeconds: number;
  cursor: number;
  status: string;
  plan: SessionPlan;
}
export interface TelemetryAttempt {
  id: string;
  activityId: string;
  sessionId: string | null;
  type: string;
  level: string | null;
  score: number;
  hinted: boolean | null;
  selfRated: boolean | null;
  durationMs: number | null;
  createdAt: Date;
}
export interface TelemetryReview {
  conceptId: string;
  dimension: string;
  elapsedDays: number;
  score: number | null;
  hinted: boolean | null;
  selfRated: boolean | null;
  reviewedAt: Date;
}
export interface TelemetryInput {
  now: Date;
  timezone: string;
  dailyMinutes: number;
  weeklyGoalDays: number;
  sessions: readonly TelemetrySession[];
  attempts: readonly TelemetryAttempt[];
  reviews: readonly TelemetryReview[];
  evidence: readonly SkillEvidence[];
  events: readonly { type: string; payload: unknown; createdAt: Date; sessionId: string | null }[];
  days: readonly { localDate: string; activeSeconds: number }[];
  truncated?: boolean;
}
export interface StudyAdvice {
  kind: "split" | "duration_comparison";
  confidence: "medium" | "high";
  message: string;
  sessions: number;
  days: number;
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** First unassisted observation per item/dimension/local day; legacy unknowns are not failures. */
export function retention(reviews: readonly TelemetryReview[], timezone: string) {
  const seen = new Set<string>();
  const bins = ["immediate", "1–2 days", "3–6 days", "7+ days"] as const;
  const eligible = [...reviews]
    .sort((a, b) => a.reviewedAt.getTime() - b.reviewedAt.getTime())
    .filter((r) => {
      if (r.score === null || r.hinted !== false || r.selfRated !== false) return false;
      const key = `${r.conceptId}:${r.dimension}:${localDate(r.reviewedAt, timezone)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  function summarize(rows: TelemetryReview[]) {
    const days = new Set(rows.map((r) => localDate(r.reviewedAt, timezone))).size;
    const concepts = new Set(rows.map((r) => r.conceptId)).size;
    const successes = rows.filter((r) => r.score! >= 0.9).length;
    return {
      samples: rows.length,
      successes,
      days,
      concepts,
      percent:
        rows.length >= 10 && days >= 3 && concepts >= 5
          ? Math.round((100 * successes) / rows.length)
          : null,
    };
  }
  return {
    immediate: summarize(eligible.filter((r) => r.elapsedDays === 0)),
    delayed: summarize(eligible.filter((r) => r.elapsedDays >= 1)),
    intervals: bins.map((interval, i) => ({
      interval,
      ...summarize(
        eligible.filter((r) =>
          i === 0
            ? r.elapsedDays === 0
            : i === 1
              ? r.elapsedDays >= 1 && r.elapsedDays <= 2
              : i === 2
                ? r.elapsedDays >= 3 && r.elapsedDays <= 6
                : r.elapsedDays >= 7,
        ),
      ),
    })),
  };
}

export function firstAttempts(attempts: readonly TelemetryAttempt[], timezone: string) {
  const seen = new Set<string>();
  return [...attempts]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id))
    .filter((a) => {
      const key = `${a.sessionId ?? localDate(a.createdAt, timezone)}:${a.activityId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
/** Matched task type and CEFR only. A decline plus slower responses is a diagnostic, not a diagnosis. */
export function possibleFatigue(attempts: readonly TelemetryAttempt[]) {
  const eligible = attempts.filter(
    (a) =>
      a.hinted === false &&
      a.selfRated === false &&
      a.level !== null &&
      (a.durationMs ?? 0) >= 1000,
  );
  if (eligible.length < 12) return false;
  const groups = new Map<string, TelemetryAttempt[]>();
  for (const a of eligible) {
    const key = `${a.type}:${a.level}`;
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  return [...groups.values()].some((rows) => {
    if (rows.length < 8) return false;
    rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const early = rows.slice(0, 4),
      late = rows.slice(-4);
    return (
      mean(early.map((a) => a.score)) - mean(late.map((a) => a.score)) >= 0.25 &&
      mean(late.map((a) => a.durationMs!)) >= 1.5 * mean(early.map((a) => a.durationMs!))
    );
  });
}

export function learningMetrics(input: TelemetryInput) {
  const { now, timezone } = input;
  const date = localDate(now, timezone),
    from = weekStart(date),
    through = addDays(from, 6);
  const inWeek = (at: Date) => {
    const d = localDate(at, timezone);
    return d >= from && d <= through;
  };
  const attempts = firstAttempts(input.attempts, timezone);
  const sessions = input.sessions.map((s) => {
    const blocks = s.plan.blocks.length;
    const completed = Math.min(blocks, Math.max(0, s.cursor));
    return {
      id: s.id,
      date: s.localDate,
      pace: studyPace(s.plan.pace, s.plannedMinutes),
      goalMinutes: s.plannedMinutes,
      plannedSeconds: s.plan.seconds,
      activeSeconds: s.activeSeconds,
      blocks,
      completed,
      completion: blocks ? completed / blocks : 0,
      status: s.status,
      possibleFatigue: possibleFatigue(attempts.filter((a) => a.sessionId === s.id)),
      // A zero counter cannot distinguish unobserved legacy activity from inactivity.
      observed: s.activeSeconds > 0,
    };
  });
  const observed = sessions.filter((s) => s.observed);
  const dayCount = new Set(observed.map((s) => s.date)).size;
  const pace = ["light", "balanced", "accelerated", "immersion"].map((p) => {
    const rows = observed.filter((s) => s.pace === p);
    const days = new Set(rows.map((s) => s.date)).size;
    return {
      pace: p,
      sessions: rows.length,
      days,
      activeSeconds: rows.reduce((sum, s) => sum + s.activeSeconds, 0),
      completion: mean(rows.map((s) => s.completion)),
      fatigueSessions: rows.filter((s) => s.possibleFatigue).length,
      comparable: rows.length >= 10 && days >= 8,
    };
  });
  const recommendation: StudyAdvice[] = [];
  if (!input.truncated && observed.length >= 10 && dayCount >= 8) {
    const confidence = observed.length >= 20 && dayCount >= 14 ? "high" : "medium";
    const long = observed.filter((s) => s.plannedSeconds >= 3600);
    if (
      long.length >= 8 &&
      new Set(long.map((s) => s.date)).size >= 8 &&
      long.filter((s) => s.possibleFatigue && s.completion < 1).length >= 4 &&
      mean(long.map((s) => s.completion)) < 0.75
    )
      recommendation.push({
        kind: "split",
        confidence,
        message:
          "Em várias sessões longas, as respostas ficaram mais lentas e menos precisas no fim. Experimente dividir a meta em dois períodos, com uma pausa entre eles.",
        sessions: observed.length,
        days: dayCount,
      });
    const groups = [...new Set(observed.map((s) => s.goalMinutes))]
      .map((minutes) => {
        const rows = observed.filter((s) => s.goalMinutes === minutes);
        return {
          minutes,
          rows,
          days: new Set(rows.map((s) => s.date)).size,
          completion: mean(rows.map((s) => s.completion)),
        };
      })
      .filter((g) => g.rows.length >= 10 && g.days >= 8)
      .sort((a, b) => a.minutes - b.minutes);
    const pair = groups
      .flatMap((short, i) => groups.slice(i + 1).map((longer) => ({ short, longer })))
      .find(({ short, longer }) => short.completion - longer.completion >= 0.2);
    if (pair)
      recommendation.push({
        kind: "duration_comparison",
        confidence,
        message: `Você concluiu mais etapas nas sessões com meta de ${pair.short.minutes} min do que nas de ${pair.longer.minutes} min. Compare essas rotinas; isso ainda não demonstra maior aprendizagem.`,
        sessions: pair.short.rows.length + pair.longer.rows.length,
        days: dayCount,
      });
  }
  const useful = input.evidence.filter(
    (e) => e.substantial && e.confidence >= 0.5 && e.quality >= 0.5 && evidenceWeight(e, now) > 0,
  );
  const skills = SKILLS.map((skill) => {
    const rows = useful.filter((e) => e.skill === skill);
    return {
      skill,
      samples: rows.length,
      tasks: new Set(rows.map((e) => e.taskId)).size,
      days: new Set(rows.map((e) => localDate(e.occurredAt, timezone))).size,
      weekSamples: rows.filter((e) => inWeek(e.occurredAt)).length,
      weight: rows.reduce((sum, e) => sum + evidenceWeight(e, now), 0),
    };
  });
  const strengthened = new Set<string>();
  const masteryRank = [
    "unseen",
    "introduced",
    "learning",
    "decaying",
    "familiar",
    "strong",
    "mastered",
  ];
  const introduced = new Set<string>();
  const starts = new Set<string>();
  const provider = new Map<
    string,
    {
      provider: string;
      operation: string;
      simulated: boolean;
      requests: number;
      failures: number;
      inputTokens: number;
      outputTokens: number;
      audioMs: number;
      unknownUnits: number;
    }
  >();
  const changes: { skill: string; before: number; after: number; at: Date }[] = [];
  for (const row of input.events) {
    const parsed = learningEventSchema.safeParse({ type: row.type, payload: row.payload });
    if (!parsed.success) continue;
    const e = parsed.data;
    if (e.type === "activity_started")
      starts.add(`${row.sessionId ?? localDate(row.createdAt, timezone)}:${e.payload.activityId}`);
    if (e.type === "activity_completed" && inWeek(row.createdAt))
      for (const m of e.payload.masteryChanges) {
        if (m.before === "unseen" && m.after !== "unseen") introduced.add(m.conceptId);
        if (
          masteryRank.indexOf(m.after) > masteryRank.indexOf(m.before) &&
          ["familiar", "strong", "mastered"].includes(m.after)
        )
          strengthened.add(m.conceptId);
      }
    if (e.type === "skill_estimate_changed")
      changes.push({
        skill: e.payload.skill,
        before: e.payload.thetaBefore,
        after: e.payload.thetaAfter,
        at: row.createdAt,
      });
    if (e.type === "provider_usage") {
      const p = e.payload,
        key = `${p.provider}:${p.operation}:${p.simulated}`;
      const v = provider.get(key) ?? {
        provider: p.provider,
        operation: p.operation,
        simulated: p.simulated,
        requests: 0,
        failures: 0,
        inputTokens: 0,
        outputTokens: 0,
        audioMs: 0,
        unknownUnits: 0,
      };
      v.requests++;
      v.failures += Number(p.status === "failed");
      v.inputTokens += p.inputTokens ?? 0;
      v.outputTokens += p.outputTokens ?? 0;
      v.audioMs += p.audioMs ?? 0;
      v.unknownUnits += Number(p.inputTokens === null && p.audioMs === null);
      provider.set(key, v);
    }
  }
  const activity = [...new Set(attempts.map((a) => `${a.type}:${a.level ?? "unknown"}`))].map(
    (key) => {
      const rows = attempts.filter((a) => `${a.type}:${a.level ?? "unknown"}` === key);
      const eligible = rows.filter((a) => a.hinted === false && a.selfRated === false);
      const evidence = useful.filter((e) => rows.some((a) => a.activityId === e.taskId));
      return {
        type: rows[0]!.type,
        level: rows[0]!.level,
        completed: rows.length,
        unassisted: eligible.length,
        correct: eligible.filter((a) => a.score >= 0.9).length,
        usefulEvidence: evidence.length,
      };
    },
  );
  return {
    sessions,
    pace,
    skills,
    activity,
    provider: [...provider.values()],
    skillChanges: changes,
    recommendation,
    retention: retention(input.reviews, timezone),
    truncated: !!input.truncated,
    activityFlow: {
      started: starts.size,
      completedAfterStart: [...starts].filter((key) =>
        attempts.some(
          (a) => `${a.sessionId ?? localDate(a.createdAt, timezone)}:${a.activityId}` === key,
        ),
      ).length,
    },
    weekly: {
      from,
      through,
      activeSeconds: input.days
        .filter((d) => d.localDate >= from && d.localDate <= through)
        .reduce((sum, d) => sum + d.activeSeconds, 0),
      referenceMinutes: input.dailyMinutes * input.weeklyGoalDays,
      strengthened: strengthened.size,
      introduced: introduced.size,
      retention: retention(
        input.reviews.filter((r) => inWeek(r.reviewedAt)),
        timezone,
      ),
    },
  };
}
