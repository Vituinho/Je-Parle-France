import { expect, test } from "@playwright/test";
import { answerCurrentStep, completeOnboarding, signUp } from "./helpers";

test("a beginner completes the first lesson and sees what progressed", async ({ page }) => {
  await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });
  await page.goto("/licao/a0-u1-l1");
  await expect(page.getByRole("heading", { name: "Bonjour!" })).toBeVisible();

  for (let i = 0; i < 40; i += 1) {
    if (await page.getByRole("heading", { name: "Lição concluída" }).isVisible()) break;
    await answerCurrentStep(page);
  }
  await expect(page.getByRole("heading", { name: "Lição concluída" })).toBeVisible();
  await expect(page.getByText("Acertos na primeira tentativa")).toBeVisible();
  await expect(page.getByRole("link", { name: /Próxima lição/ })).toBeVisible();
});
