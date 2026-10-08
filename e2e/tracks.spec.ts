import { expect, test } from "@playwright/test";
import { answerCurrentStep, completeOnboarding, signUp } from "./helpers";

test("a Québec-bound learner opens the Canada track from the course map", async ({ page }) => {
  test.setTimeout(180_000);
  await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });

  await page.goto("/curso");
  await expect(page.getByRole("heading", { name: "O curso" })).toBeVisible();
  const canadaTab = page.getByRole("tab", { name: /Vivre au Canada/ });
  await expect(canadaTab).toContainText("seu destino");
  await canadaTab.click();
  await page.getByRole("link", { name: /Bonjour-Hi!/ }).click();
  await expect(page).toHaveURL(/\/licao\/ca-u1-l1$/);

  for (let i = 0; i < 40; i += 1) {
    if (await page.getByRole("heading", { name: "Lição concluída" }).isVisible()) break;
    await answerCurrentStep(page);
  }
  await expect(page.getByRole("heading", { name: "Lição concluída" })).toBeVisible();

  await page.goto("/curso");
  await page.getByRole("tab", { name: /Vivre au Canada/ }).click();
  await expect(page.getByRole("tabpanel").getByText(/1 de \d+ lições concluídas/)).toBeVisible();

  await page.goto("/caderno");
  await expect(page.getByRole("main").getByText("c'est correct", { exact: true })).toBeVisible();
});
