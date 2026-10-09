import { describe, expect, it } from "vitest";
import { SKILLS, type Skill } from "./skills";
import { deadlinePace, weeklyWorkload, type PaceSkill } from "./study-workload";

describe("flexible weekly workload", () => {
  it("totals split/uneven days and ignores dates outside the local week or in the future", () => {
    const days = [
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ].map((localDate, n) => ({ localDate, studySeconds: [60, 120, 90, 0, 120, 90, 60][n]! * 60 }));
    expect(weeklyWorkload(days, "2026-10-11", 90, 5)).toEqual({
      completedMinutes: 540,
      targetMinutes: 450,
      met: true,
    });
    expect(
      weeklyWorkload(
        [...days, { localDate: "2026-10-04", studySeconds: 99_999 }],
        "2026-10-09",
        90,
        5,
      ).completedMinutes,
    ).toBe(390);
  });
});

describe("conservative workload/deadline comparison", () => {
  const skills = Object.fromEntries(
    SKILLS.map((skill) => [
      skill,
      {
        theta: 1.5,
        confidence: "medium",
        assessed: true,
        method: "objective",
        evidenceCount: 25,
        evidenceDays: 8,
      },
    ]),
  ) as Record<Skill, PaceSkill>;
  const input = {
    skills,
    dailyMinutes: 90,
    weeklyGoalDays: 5,
    targetLevel: "B2",
    targetMonth: "2027-10",
    date: "2026-10-09",
  };
  it("refuses to infer velocity from time or self-ratings", () => {
    expect(
      deadlinePace({
        ...input,
        dailyMinutes: 240,
        skills: { ...skills, speaking: { ...skills.speaking, method: "self_assessment" } },
      }).state,
    ).toBe("insufficient");
    expect(
      deadlinePace({
        ...input,
        skills: { ...skills, listening: { ...skills.listening, evidenceDays: 1 } },
      }).state,
    ).toBe("insufficient");
  });
  it("responds to time, target and date while never emitting a guaranteed ETA", () => {
    expect(deadlinePace({ ...input, dailyMinutes: 5 }).state).toBe("review");
    expect(deadlinePace({ ...input, dailyMinutes: 240 }).state).toBe("compatible");
    expect(deadlinePace({ ...input, targetMonth: "2026-09" }).state).toBe("past");
    expect(deadlinePace({ ...input, targetMonth: null }).state).toBe("no_deadline");
    expect(deadlinePace({ ...input, dailyMinutes: 240 }).message).toContain("não uma previsão");
  });
});
