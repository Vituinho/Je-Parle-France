import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/server/db";
import { serverEnv } from "@/lib/env";

/**
 * Better Auth configuration (ADR-005). Email + password for now; e-mail
 * verification and password reset need an e-mail provider and are planned.
 */
function createAuth() {
  const env = serverEnv();
  return betterAuth({
    appName: "Je Parle Français",
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: prismaAdapter(db, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    user: {
      additionalFields: {
        role: { type: "string", required: false, defaultValue: "learner", input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const isAdmin = env.ADMIN_EMAILS.includes(user.email.toLowerCase());
            return { data: { ...user, role: isAdmin ? "admin" : "learner" } };
          },
        },
      },
    },
    rateLimit: { enabled: env.NODE_ENV === "production", window: 60, max: 30 },
    telemetry: { enabled: false },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
const globalForAuth = globalThis as unknown as { __jpfAuth?: Auth };

/** Lazily created so builds never need auth secrets at import time. */
export function getAuth(): Auth {
  globalForAuth.__jpfAuth ??= createAuth();
  return globalForAuth.__jpfAuth;
}
