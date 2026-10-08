import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { activitySchema } from "@/lib/content/schema";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { resolveSpeechResponse, SpeechEvidenceError } from "./speech-evidence";

const activity = activitySchema.parse({
  id: "test-speech",
  type: "speak",
  mode: "repeat",
  text: "Bonjour",
});

describe.skipIf(!hasTestDatabase)("speech evidence", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());

  async function storedAttempt(userId: string, createdAt = new Date()) {
    return db.speechAttempt.create({
      data: {
        userId,
        targetText: "Bonjour",
        provider: "azure",
        transcript: "Bonjour.",
        scores: { status: "ok", scores: { overall: 72 }, words: [] },
        createdAt,
      },
    });
  }

  it("drops a transcript and score sent by the client", async () => {
    const user = await createTestUser();
    const forged = await resolveSpeechResponse(
      user.id,
      {
        kind: "speech",
        transcript: "Bonjour, je m'appelle Ana.",
        pronunciation: 100,
      },
      activity,
    );
    expect(forged).toEqual({ kind: "speech", selfRating: undefined });
  });

  it("reads transcript and score from the learner's own recent assessment", async () => {
    const user = await createTestUser();
    const attempt = await storedAttempt(user.id);
    const resolved = await resolveSpeechResponse(
      user.id,
      {
        kind: "speech",
        speechAttemptId: attempt.id,
        transcript: "forged",
        pronunciation: 100,
      },
      activity,
    );
    expect(resolved).toEqual({ kind: "speech", transcript: "Bonjour.", pronunciation: 72 });
  });

  it("refuses someone else's or an old assessment", async () => {
    const user = await createTestUser();
    const other = await createTestUser();
    const theirs = await storedAttempt(other.id);
    const old = await storedAttempt(user.id, new Date(Date.now() - 60 * 60_000));
    for (const id of [theirs.id, old.id]) {
      await expect(
        resolveSpeechResponse(user.id, { kind: "speech", speechAttemptId: id }, activity),
      ).rejects.toBeInstanceOf(SpeechEvidenceError);
    }
  });

  it("rejects an assessment against a different, client-chosen reference", async () => {
    const user = await createTestUser();
    const attempt = await storedAttempt(user.id);
    await db.speechAttempt.update({ where: { id: attempt.id }, data: { targetText: "Salut" } });
    await expect(
      resolveSpeechResponse(user.id, { kind: "speech", speechAttemptId: attempt.id }, activity),
    ).rejects.toThrow("outro texto");
  });

  it.each([
    { provider: "mock", scores: { status: "ok", scores: { overall: 100 } } },
    { provider: "azure", scores: { status: "error", scores: { overall: 100 } } },
    { provider: "azure", scores: { status: "ok", scores: null } },
    { provider: "azure", scores: { status: "ok", scores: { overall: 101 } } },
  ])("rejects unsupported or invalid provider evidence: %j", async (data) => {
    const user = await createTestUser();
    const attempt = await storedAttempt(user.id);
    await db.speechAttempt.update({ where: { id: attempt.id }, data });
    await expect(
      resolveSpeechResponse(user.id, { kind: "speech", speechAttemptId: attempt.id }, activity),
    ).rejects.toThrow("avaliação válida");
  });
});
