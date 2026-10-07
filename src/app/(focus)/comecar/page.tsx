import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getProfile, requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Seu plano" };

async function Onboarding() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (profile?.onboardedAt) redirect("/hoje");
  const firstName = user.name.split(" ")[0] ?? user.name;
  return <OnboardingWizard firstName={firstName} />;
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <Onboarding />
    </Suspense>
  );
}
