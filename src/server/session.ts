import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { LearnerProfile } from "@/generated/prisma/client";
import { getAuth } from "./auth";
import { db } from "./db";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "learner" | "admin";
}

/**
 * The signed-in user for this request, or null. Deduplicated per request.
 * This is the Data Access Layer entry point: every page, Server Action and
 * Route Handler authorises through these helpers — the proxy only redirects.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email } = session.user;
  const role = (session.user as { role?: unknown }).role === "admin" ? "admin" : "learner";
  return { id, name, email, role };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") notFound();
  return user;
}

export const getProfile = cache(async (userId: string) =>
  db.learnerProfile.findUnique({ where: { userId } }),
);

/** A signed-in learner who finished onboarding; otherwise redirects to the right step. */
export async function requireLearner(): Promise<{ user: CurrentUser; profile: LearnerProfile }> {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile?.onboardedAt) redirect("/comecar");
  return { user, profile };
}
