import { describe, it, expect } from "vitest";
import { pilotObservations } from "./report";
describe("two-week pilot observations", () => {
  it("counts mastery beyond the current week and keeps perception/private content separate", () => {
    const events = [
      {
        type: "active_time",
        createdAt: new Date("2026-10-01T12:00Z"),
        payload: {
          streamId: "9b407237-2e9e-442a-9530-748e9f48eacd",
          sequence: 1,
          activeMs: 10000,
          activityId: "task-1",
        },
      },
      {
        type: "activity_completed",
        createdAt: new Date("2026-10-01T12:00Z"),
        payload: {
          attemptId: "attempt-1",
          masteryChanges: [
            { conceptId: "lex:test", dimension: "recall", before: "learning", after: "strong" },
          ],
        },
      },
      { type: "legacy", createdAt: new Date("2026-10-02T12:00Z"), payload: { text: "PRIVATE" } },
    ];
    const result = pilotObservations({
      timezone: "America/Sao_Paulo",
      events,
      feedback: [
        { context: "session", difficulty: "hard", createdAt: new Date("2026-10-08T12:00Z") },
      ],
    });
    expect(result).toMatchObject({ activeDays: 1, activeSeconds: 10, strengthened: 1 });
    expect(result.difficulty.find((d) => d.difficulty === "hard")?.samples).toBe(1);
    expect(result.timeline[0]?.type).toBe("pilot_feedback");
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
  });
});
