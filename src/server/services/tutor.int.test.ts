import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { completeOnboarding } from "./onboarding";
import { dueReviewItems, prepareReviewItems } from "./review";
import {
  endConversation,
  getConversation,
  sendLearnerMessage,
  startConversation,
  TutorError,
} from "./tutor";

async function learner() {
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: ["move_quebec"],
    destination: "canada_quebec",
    priorExperience: "a_little",
    dailyMinutes: 30,
    targetLevel: "B1",
    start: "from_zero",
  });
  return user;
}

describe.skipIf(!hasTestDatabase)("tutor service (mock provider)", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());

  it("runs a scenario conversation, shows important corrections and turns them into review", async () => {
    const user = await learner();
    const conversation = await startConversation(user.id, {
      scenarioId: "scn-bank-canada",
      correctionMode: "important_only",
    });
    const opened = await getConversation(user.id, conversation.id);
    expect(opened.turns[0]?.content).toContain("Bienvenue");

    const turn = await sendLearnerMessage(
      user.id,
      conversation.id,
      "Bonjour. Je besoin d'ouvrir un compte.",
    );
    expect(turn.simulated).toBe(true);
    expect(turn.learner.corrections).toContainEqual(
      expect.objectContaining({ right: "j'ai besoin", severity: "important" }),
    );
    expect(turn.tutor.content.length).toBeGreaterThan(0);

    const report = await endConversation(user.id, conversation.id);
    expect(report.simulated).toBe(true);
    expect(report.learnerTurns).toBe(1);
    expect(report.corrections.some((c) => c.right === "j'ai besoin")).toBe(true);

    const items = await db.personalItem.findMany({ where: { userId: user.id } });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ french: "j'ai besoin", kind: "correction" });

    // The correction is due for review right away (failed review → learning step).
    const later = new Date(Date.now() + 15 * 60_000);
    const due = await dueReviewItems(user.id, 20, later);
    const personal = due.filter((item) => item.conceptId === `personal:${items[0]!.id}`);
    expect(personal.length).toBeGreaterThan(0);
    const prepared = await prepareReviewItems(user.id, personal, "2026-10-08");
    expect(prepared[0]?.activity.type).toMatch(/choice|error_correction/);

    // Ending twice returns the same report and does not duplicate items.
    await endConversation(user.id, conversation.id);
    expect(await db.personalItem.count({ where: { userId: user.id } })).toBe(1);
  });

  it("refuses empty or overly long messages and other learners' conversations", async () => {
    const user = await learner();
    const other = await learner();
    const conversation = await startConversation(user.id, {});
    await expect(sendLearnerMessage(user.id, conversation.id, "   ")).rejects.toBeInstanceOf(
      TutorError,
    );
    await expect(
      sendLearnerMessage(user.id, conversation.id, "a".repeat(600)),
    ).rejects.toBeInstanceOf(TutorError);
    await expect(getConversation(other.id, conversation.id)).rejects.toBeInstanceOf(TutorError);
  });

  it("keeps corrections out of sight in report-only mode but still records them", async () => {
    const user = await learner();
    const conversation = await startConversation(user.id, { correctionMode: "report_only" });
    const turn = await sendLearnerMessage(user.id, conversation.id, "Je suis 25 ans.");
    expect(turn.learner.corrections).toEqual([]);
    const stored = await db.conversationTurn.findFirstOrThrow({
      where: { conversationId: conversation.id, role: "learner" },
    });
    expect(JSON.stringify(stored.corrections)).toContain("j'ai 25 ans");
  });
});
