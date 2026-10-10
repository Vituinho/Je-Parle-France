import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { consumeQuota, QuotaError } from "./quota";

describe.skipIf(!hasTestDatabase)("provider quota reservations", () => {
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());
  it("limits concurrent requests without charging refusals", async () => {
    const user = await createTestUser();
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () =>
        consumeQuota(user.id, "speech", "2026-10-10", 10, 20_000, 60_000),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(
      await db.usageCounter.findUnique({
        where: { userId_key: { userId: user.id, key: "speech:2026-10-10" } },
      }),
    ).toMatchObject({ count: 3, units: 60_000 });
    await expect(consumeQuota(user.id, "speech", "2026-10-10", 3)).rejects.toBeInstanceOf(
      QuotaError,
    );
    await expect(consumeQuota(user.id, "speech", "2026-10-11", 3, 20_000, 60_000)).resolves.toBe(1);
    const other = await createTestUser();
    await expect(consumeQuota(other.id, "speech", "2026-10-10", 1, 20_000, 60_000)).resolves.toBe(
      1,
    );
  });
});
