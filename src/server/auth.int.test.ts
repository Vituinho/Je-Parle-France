import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { hasTestDatabase, resetDatabase } from "@/test/db";
import { getAuth } from "./auth";

describe.skipIf(!hasTestDatabase)("sign-up authorization", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    vi.unstubAllEnvs();
    await db.$disconnect();
  });

  it("does not promote an unverified email, including forged role and verification fields", async () => {
    const email = "operator@example.test";
    vi.stubEnv("ADMIN_EMAILS", email);
    const response = await getAuth().handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({
          name: "Operator",
          email,
          password: "test-password-long-enough",
          role: "admin",
          emailVerified: true,
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(await db.user.findUniqueOrThrow({ where: { email } })).toMatchObject({
      role: "learner",
      emailVerified: false,
    });
  });
});
