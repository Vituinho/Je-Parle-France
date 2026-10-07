import { expect, test } from "@playwright/test";
import { answerCurrentStep, completeOnboarding, signUp } from "./helpers";

test("a learner runs today's session from the dashboard to completion", async ({ page }) => {
  test.setTimeout(240_000);
  await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });
  await page.getByRole("link", { name: "Começar a sessão de hoje" }).click();
  await expect(page.getByRole("heading", { name: /Sua sessão de hoje/ })).toBeVisible();

  const stepForm = page.locator("form[data-step]:visible");
  const startButton = page
    .getByRole("button", { name: /^(Começar|Continuar)$/ })
    .filter({ visible: true });
  const done = page.getByRole("heading", { name: "Sessão concluída" });
  for (let guard = 0; guard < 200; guard += 1) {
    await expect(stepForm.or(startButton).or(done).first()).toBeVisible({ timeout: 20_000 });
    if (await done.isVisible()) break;
    if ((await stepForm.count()) > 0) await answerCurrentStep(page);
    else await startButton.first().click();
  }
  await expect(done).toBeVisible();

  await page.goto("/hoje");
  await expect(page.getByRole("heading", { name: "Sessão de hoje concluída" })).toBeVisible();
  await expect(page.getByText(/1 de 5/)).toBeVisible();
});
