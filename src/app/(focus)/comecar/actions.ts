"use server";

import { redirect } from "next/navigation";
import { onboardingSchema } from "@/lib/learning/onboarding";
import { completeOnboarding } from "@/server/services/onboarding";
import { requireUser } from "@/server/session";

export async function submitOnboarding(raw: unknown): Promise<{ error: string }> {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise as respostas e tente de novo." };
  }
  const { next } = await completeOnboarding(user.id, parsed.data);
  redirect(next);
}
