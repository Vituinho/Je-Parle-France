import { describe, expect, it } from "vitest";
import { getContent } from "@/lib/content";
import { activityEvidence } from "./activity-evidence";
const content = getContent();
const NOW = new Date("2026-10-09T12:00:00Z");
const grade = { score: 1, correct: true, verdict: "correct" as const };
const base = {
  grade,
  response: { kind: "answers" as const, answers: [0] },
  now: NOW,
  level: "B1" as const,
  context: "lesson" as const,
  concepts: content.concepts,
};
describe("scope of activity skill evidence", () => {
  it("reading and listening affect only their own comprehension skill", () => {
    for (const type of ["reading", "listening"] as const) {
      const activity = [...content.activities.values()].find(
        (r) => r.activity.type === type,
      )!.activity;
      expect(activityEvidence({ ...base, activity }).map((e) => e.skill)).toEqual([type]);
    }
  });
  it("minimal-pair perception does not raise production pronunciation", () => {
    const activity = [...content.activities.values()].find(
      (r) => r.activity.type === "minimal_pair",
    )!.activity;
    expect(activityEvidence({ ...base, activity })).toMatchObject([
      { skill: "listening", substantial: false },
    ]);
  });
  it("a hint reduces confidence and a self-rating contributes no objective evidence", () => {
    const activity = [...content.activities.values()].find(
      (r) => r.activity.type === "listening",
    )!.activity;
    expect(activityEvidence({ ...base, activity, hinted: true })[0]?.confidence).toBe(0.25);
    expect(activityEvidence({ ...base, activity, grade: { ...grade, selfRated: true } })).toEqual(
      [],
    );
  });
  it("requires verified provider speech and deduplicates the same assessment proof across activities", () => {
    const activity = [...content.activities.values()].find(
      (r) => r.activity.type === "speak",
    )!.activity;
    expect(
      activityEvidence({
        ...base,
        activity,
        response: { kind: "speech", transcript: "forged", pronunciation: 100 },
      }),
    ).toEqual([]);
    const evidence = activityEvidence({
      ...base,
      activity,
      response: { kind: "speech", transcript: "Bonjour", pronunciation: 80 },
      speechProof: "owned-attempt",
    });
    expect(evidence.map((e) => e.key)).toEqual(["speech:owned-attempt", "speech:owned-attempt"]);
    expect(evidence.find((e) => e.skill === "pronunciation")?.score).toBe(0.8);
    expect(evidence.find((e) => e.skill === "speaking")?.substantial).toBe(false);
  });
  it("lexical flashcards do not imply reading or speaking proficiency", () => {
    const activity = content.activities.get("a0-u1-l1-a1")!.activity;
    expect(activityEvidence({ ...base, activity }).map((e) => e.skill)).toEqual(["vocabulary"]);
  });
});
