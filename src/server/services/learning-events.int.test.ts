import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { recordLearningEvent } from "./learning-events";

describe.skipIf(!hasTestDatabase)("learning event persistence", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());
  it("deduplicates metadata and cascades account deletion while preserving legacy null keys", async () => {
    const user = await createTestUser();
    const input = { type: "block_started", payload: { blockIndex: 0 } };
    await db.$transaction(async (tx) => {
      await recordLearningEvent(tx, user.id, input, { dedupeKey: "block-1" });
      await recordLearningEvent(tx, user.id, input, { dedupeKey: "block-1" });
      await tx.studyEvent.create({ data: { userId: user.id, type: "legacy" } });
      await tx.studyEvent.create({ data: { userId: user.id, type: "legacy" } });
    });
    expect(await db.studyEvent.count()).toBe(3);
    await expect(
      db.$transaction((tx) =>
        recordLearningEvent(tx, user.id, {
          type: "block_started",
          payload: { blockIndex: 0, apiKey: "secret" },
        }),
      ),
    ).rejects.toThrow();
    await db.user.delete({ where: { id: user.id } });
    expect(await db.studyEvent.count()).toBe(0);
  });
});
