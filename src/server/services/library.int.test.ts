import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { oracleResponse } from "@/test/oracle";
import { getGrammarLibrary, getGrammarTopic, getNotebook } from "./library";
import { completeOnboarding } from "./onboarding";
import { activitySeed, lessonActivity, markTeachSeen, submitActivity } from "./practice";

async function learner() {
  const user = await createTestUser();
  await completeOnboarding(user.id, {
    goals: ["move_quebec"],
    destination: "canada_quebec",
    priorExperience: "never",
    dailyMinutes: 15,
    targetLevel: "A2",
    start: "from_zero",
  });
  return user;
}

describe.skipIf(!hasTestDatabase)("library service", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());

  it("fills the notebook only with words the learner has met, with mastery per dimension", async () => {
    const user = await learner();
    expect((await getNotebook(user.id)).words).toEqual([]);

    await markTeachSeen({ userId: user.id, activity: lessonActivity("a0-u1-l1", "a0-u1-l1-t1") });
    const introduced = await getNotebook(user.id);
    const bonjour = introduced.words.find((word) => word.conceptId === "lex:bonjour");
    expect(bonjour).toMatchObject({ french: "bonjour", overall: "introduced", nextReview: null });
    expect(bonjour?.lesson?.id).toBe("a0-u1-l1");
    // Culture concepts taught on the same card are not vocabulary.
    expect(introduced.words.every((word) => word.conceptId.startsWith("lex:"))).toBe(true);

    const activity = lessonActivity("a0-u1-l1", "a0-u1-l1-a1");
    const result = await submitActivity({
      userId: user.id,
      activity,
      response: oracleResponse(activity, activitySeed(user.id), true),
      context: "lesson",
      lessonId: "a0-u1-l1",
    });
    const practised = result.changes.map((change) => change.dimension);
    const after = (await getNotebook(user.id)).words.find((w) => w.conceptId === "lex:bonjour");
    expect(after?.nextReview).not.toBeNull();
    for (const dimension of after?.dimensions ?? []) {
      expect(dimension.state === "introduced").toBe(!practised.includes(dimension.dimension));
    }
  });

  it("lists grammar topics with the learner's state and opens a topic with its lessons", async () => {
    const user = await learner();
    const library = await getGrammarLibrary(user.id);
    expect(library.map((topic) => topic.slug)).toContain("tu-vous");
    expect(library.every((topic) => topic.state === "unseen")).toBe(true);

    const topic = await getGrammarTopic(user.id, "tu-vous");
    expect(topic?.concept.id).toBe("gram:tu-vous");
    expect(topic?.lessons.length).toBeGreaterThan(0);
    expect(topic?.dimensions.every((d) => d.state === "unseen")).toBe(true);
    expect(await getGrammarTopic(user.id, "does-not-exist")).toBeNull();
    // Slugs never resolve to other concept kinds.
    expect(await getGrammarTopic(user.id, "../lex:bonjour")).toBeNull();
  });
});
