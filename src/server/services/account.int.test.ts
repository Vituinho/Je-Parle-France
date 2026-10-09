import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { deletePrivateData, exportUserData, getAccount, updatePreferences } from "./account";
import { completeOnboarding } from "./onboarding";
import { endConversation, sendLearnerMessage, startConversation } from "./tutor";
import { studyPace } from "@/lib/learning/study-pace";
import { getTodaySession, sessionPlan } from "./session";

async function learner() {
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: ["move_france"],
    destination: "france",
    priorExperience: "a_little",
    dailyMinutes: 15,
    targetLevel: "B1",
    start: "from_zero",
  });
  return user;
}

async function conversationWithCorrection(userId: string) {
  const conversation = await startConversation(userId, {
    scenarioId: "scn-bank-canada",
    correctionMode: "important_only",
  });
  await sendLearnerMessage(userId, conversation.id, "Bonjour. Je besoin d'ouvrir un compte.");
  await endConversation(userId, conversation.id);
  await db.speechAttempt.create({
    data: { userId, targetText: "bonjour", provider: "azure", transcript: "bonjour", scores: {} },
  });
}

describe.skipIf(!hasTestDatabase)("account service", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());

  it("keeps legacy time and frozen sessions, and changes only future planning", async () => {
    const user = await learner();
    const legacy = await db.learnerProfile.update({
      where: { userId: user.id },
      data: { studyPace: null },
    });
    const now = new Date("2026-10-09T12:00:00Z");
    const frozen = await getTodaySession(user.id, legacy, now);
    expect(studyPace(legacy.studyPace, legacy.dailyMinutes)).toBe("light");
    await updatePreferences(user.id, {
      name: user.name,
      dailyMinutes: 90,
      studyPace: "accelerated",
      weeklyGoalDays: 5,
      destination: legacy.destination,
      targetLevel: null,
      correctionMode: legacy.correctionMode,
      supportPreference: legacy.supportPreference,
      timezone: legacy.timezone,
    });
    const changed = await db.learnerProfile.findUniqueOrThrow({ where: { userId: user.id } });
    expect((await getTodaySession(user.id, changed, now)).plan).toEqual(frozen.plan);
    const tomorrow = await getTodaySession(user.id, changed, new Date("2026-10-10T12:00:00Z"));
    expect(sessionPlan(tomorrow).minutes).toBe(90);
    expect(changed.onboardedAt).toEqual(legacy.onboardedAt);
    expect(changed.startLessonId).toBe(legacy.startLessonId);
  });

  it("updates preferences without touching progress", async () => {
    const user = await learner();
    await updatePreferences(user.id, {
      name: "Ana Paula",
      dailyMinutes: 30,
      studyPace: "accelerated",
      weeklyGoalDays: 4,
      destination: "canada_quebec",
      targetLevel: null,
      targetMonth: "2027-09",
      correctionMode: "report_only",
      supportPreference: "more_french",
      timezone: "America/Toronto",
    });
    const { user: account, profile } = await getAccount(user.id);
    expect(account.name).toBe("Ana Paula");
    expect(profile).toMatchObject({
      dailyMinutes: 30,
      studyPace: "accelerated",
      weeklyGoalDays: 4,
      destination: "canada_quebec",
      targetLevel: null,
      correctionMode: "report_only",
      supportPreference: "more_french",
      timezone: "America/Toronto",
      placementStatus: "skipped",
    });
    expect(profile?.targetDate?.toISOString().slice(0, 7)).toBe("2027-09");
  });

  it("exports the learner's data without authentication secrets", async () => {
    const user = await learner();
    await conversationWithCorrection(user.id);
    const data = await exportUserData(user.id);
    expect(data.user.email).toBe(user.email);
    expect(data.profile?.destination).toBe("france");
    expect(data.conversations[0]?.turns.length).toBeGreaterThan(1);
    expect(data.personalItems).toHaveLength(1);
    expect(data.skillEstimates.length).toBeGreaterThan(0);
    const json = JSON.stringify(data);
    expect(json).not.toContain("password");
    expect(json).not.toMatch(/"token"|accessToken|refreshToken/);
  });

  it("deletes only the selected private data", async () => {
    const user = await learner();
    await conversationWithCorrection(user.id);

    const first = await deletePrivateData(user.id, {
      conversations: true,
      corrections: false,
      speech: false,
    });
    expect(first).toEqual({ conversations: 1, corrections: 0, speechAttempts: 0 });
    const kept = await db.personalItem.findMany({ where: { userId: user.id } });
    expect(kept).toHaveLength(1);
    expect(kept[0]?.conversationId).toBeNull();

    const second = await deletePrivateData(user.id, {
      conversations: false,
      corrections: true,
      speech: true,
    });
    expect(second).toEqual({ conversations: 0, corrections: 1, speechAttempts: 1 });
    expect(
      await db.memoryTrace.count({
        where: { userId: user.id, conceptId: { startsWith: "personal:" } },
      }),
    ).toBe(0);
    // Course progress is untouched.
    expect(await db.learnerProfile.count({ where: { userId: user.id } })).toBe(1);
  });

  it("removes every row when the user is deleted", async () => {
    const user = await learner();
    await conversationWithCorrection(user.id);
    await db.user.delete({ where: { id: user.id } });
    const data = await Promise.all([
      db.learnerProfile.count({ where: { userId: user.id } }),
      db.conversation.count({ where: { userId: user.id } }),
      db.personalItem.count({ where: { userId: user.id } }),
      db.memoryTrace.count({ where: { userId: user.id } }),
      db.speechAttempt.count({ where: { userId: user.id } }),
      db.studyEvent.count({ where: { userId: user.id } }),
      db.skillEstimate.count({ where: { userId: user.id } }),
    ]);
    expect(data.every((count) => count === 0)).toBe(true);
  });
});
