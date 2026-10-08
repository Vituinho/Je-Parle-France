import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { resolveSpeechResponse, SpeechEvidenceError } from "./speech-evidence";

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
    const forged = await resolveSpeechResponse(user.id, {
      kind: "speech",
      transcript: "Bonjour, je m'appelle Ana.",
      pronunciation: 100,
    });
    expect(forged).toEqual({ kind: "speech", selfRating: undefined });
  });

  it("reads transcript and score from the learner's own recent assessment", async () => {
    const user = await createTestUser();
    const attempt = await storedAttempt(user.id);
    const resolved = await resolveSpeechResponse(user.id, {
      kind: "speech",
      speechAttemptId: attempt.id,
      transcript: "forged",
      pronunciation: 100,
    });
    expect(resolved).toEqual({ kind: "speech", transcript: "Bonjour.", pronunciation: 72 });
  });

  it("refuses someone else's or an old assessment", async () => {
    const user = await createTestUser();
    const other = await createTestUser();
    const theirs = await storedAttempt(other.id);
    const old = await storedAttempt(user.id, new Date(Date.now() - 60 * 60_000));
    for (const id of [theirs.id, old.id]) {
      await expect(
        resolveSpeechResponse(user.id, { kind: "speech", speechAttemptId: id }),
      ).rejects.toBeInstanceOf(SpeechEvidenceError);
    }
  });
});
