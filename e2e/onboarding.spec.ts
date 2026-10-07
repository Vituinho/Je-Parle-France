import { expect, test } from "@playwright/test";
import { completeOnboarding, signUp } from "./helpers";

test("a beginner signs up, answers onboarding and lands on today's page", async ({ page }) => {
  const learner = await signUp(page);
  await expect(page.getByText("Pourquoi le français ?")).toBeVisible();
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });
  await expect(page).toHaveURL(/\/hoje$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(learner.name);
});

test("unauthenticated visitors are sent to sign in", async ({ page }) => {
  await page.goto("/hoje");
  await expect(page).toHaveURL(/\/entrar\?next=%2Fhoje/);
});
