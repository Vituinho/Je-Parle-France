import { expect, test } from "@playwright/test";
import { answerCurrentStep, completeOnboarding, signUp } from "./helpers";

test("a learner trains the /y/–/u/ contrast in the pronunciation lab", async ({ page }) => {
  test.setTimeout(240_000);
  await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });
  await page.goto("/pronuncia");
  await page.getByRole("link", { name: /tu ou tout/i }).click();
  await expect(page.getByRole("heading", { name: "Como fazer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pares mínimos" })).toBeVisible();
  await page.getByRole("button", { name: /Ouvido · 8 rodadas/ }).click();

  for (let i = 0; i < 30; i += 1) {
    if (await page.getByText(/Treino de percepção concluído/).isVisible()) break;
    await answerCurrentStep(page);
  }
  await expect(page.getByText(/Treino de percepção concluído/)).toBeVisible();

  await page.goto("/pronuncia");
  await expect(page.getByText(/Percepção: (aprendendo|familiar)/i).first()).toBeVisible();
});
