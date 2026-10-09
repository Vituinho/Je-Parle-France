import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { hasTestDatabase, resetDatabase } from "@/test/db";
import { createAuth, getAuth } from "./auth";
import { serverEnv } from "@/lib/env";

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

  it("uses secure host cookies and preserves a HTTPS session through logout/login", async () => {
    const origin = "https://staging.example.test";
    const auth = createAuth({ ...serverEnv(), NODE_ENV: "production", BETTER_AUTH_URL: origin });
    const email = "https-session@example.test";
    const post = (path: string, body: object, cookie = "") =>
      auth.handler(
        new Request(`${origin}/api/auth/${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: origin, Cookie: cookie },
          body: JSON.stringify(body),
        }),
      );
    const signup = await post("sign-up/email", {
      name: "HTTPS Learner",
      email,
      password: "test-password-long-enough",
    });
    expect(signup.status).toBe(200);
    const setCookie = signup.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/__Secure-better-auth.session_token=/);
    expect(setCookie).toMatch(/; Secure/i);
    expect(setCookie).toMatch(/; HttpOnly/i);
    expect(setCookie).toMatch(/; SameSite=Lax/i);
    expect(setCookie).not.toMatch(/; Domain=/i);
    const cookie = setCookie.split(";")[0] ?? "";
    const session = () =>
      auth.handler(new Request(`${origin}/api/auth/get-session`, { headers: { Cookie: cookie } }));
    expect(await (await session()).json()).toMatchObject({ user: { email } });
    expect((await post("sign-out", {}, cookie)).status).toBe(200);
    expect(await (await session()).json()).toBeNull();
    const signin = await post("sign-in/email", { email, password: "test-password-long-enough" });
    expect(signin.status).toBe(200);
    const freshCookie = (signin.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
    expect(
      await (
        await auth.handler(
          new Request(`${origin}/api/auth/get-session`, { headers: { Cookie: freshCookie } }),
        )
      ).json(),
    ).toMatchObject({ user: { email } });
    expect(await db.user.count({ where: { email } })).toBe(1);
  });

  it("rejects foreign origins and callbacks before creating accounts", async () => {
    const origin = "https://staging.example.test";
    const auth = createAuth({ ...serverEnv(), NODE_ENV: "production", BETTER_AUTH_URL: origin });
    for (const [requestOrigin, callbackURL] of [
      ["https://attacker.example.test", undefined],
      [origin, "https://attacker.example.test/steal"],
    ]) {
      const response = await auth.handler(
        new Request(`${origin}/api/auth/sign-up/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: requestOrigin! },
          body: JSON.stringify({
            name: "Bad origin",
            email: "csrf@example.test",
            password: "test-password-long-enough",
            callbackURL,
          }),
        }),
      );
      expect(response.status).toBe(403);
    }
    expect(await db.user.count({ where: { email: "csrf@example.test" } })).toBe(0);
  });
});
