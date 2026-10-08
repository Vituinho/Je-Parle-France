import { expect, test, type Page } from "@playwright/test";
import {
  answerCurrentStep,
  completeOnboarding,
  finishPlacement,
  runSession,
  signUp,
} from "./helpers";

async function masteryPercent(page: Page): Promise<number> {
  const text = await page.getByText(/^Domínio do (A0|A1|A2|B1|B2|C1):/).textContent();
  return Number(/(\d+)%/.exec(text ?? "")?.[1] ?? Number.NaN);
}

/**
 * The critical path of the product, end to end:
 * sign up → onboarding → placement → report → dashboard → daily session →
 * activities → review → updated progress.
 */
test("critical flow: from sign-up to reviewed, measurable progress", async ({ page }) => {
  test.setTimeout(420_000);
  await signUp(page);
  await completeOnboarding(page, { experience: "Estudei um pouco", start: "Diagnóstico rápido" });

  await page.getByRole("button", { name: "Começar o rápido" }).click();
  await finishPlacement(page);
  await expect(page.getByRole("heading", { name: "Seu diagnóstico" })).toBeVisible();
  const start = page.getByRole("button", { name: "Começar por aqui" });
  if (await start.isVisible()) await start.click();
  else await page.getByRole("link", { name: "Ir para a sessão de hoje" }).click();
  await expect(page).toHaveURL(/\/hoje$/);

  const before = await masteryPercent(page);
  await page.getByRole("link", { name: "Começar a sessão de hoje" }).click();
  await runSession(page);

  // Items missed in the session come back after their first learning step (1 minute).
  const reviewDone = page.getByRole("heading", { name: "Revisão concluída" });
  const nothingDue = page.getByRole("heading", { name: "Nada para revisar agora" });
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.goto("/revisar");
    await expect(page.locator("form[data-step]:visible").or(nothingDue)).toBeVisible();
    if (!(await nothingDue.isVisible())) break;
    await page.waitForTimeout(15_000);
  }
  await expect(nothingDue).toBeHidden();
  for (let i = 0; i < 60 && !(await reviewDone.isVisible()); i += 1) {
    await answerCurrentStep(page);
  }
  await expect(reviewDone).toBeVisible();

  await page.goto("/hoje");
  await expect(page.getByRole("heading", { name: "Sessão de hoje concluída" })).toBeVisible();
  expect(await masteryPercent(page)).toBeGreaterThan(before);
  await page.goto("/caderno");
  await expect(page.getByText(/\d+ palavras e expressões/)).toBeVisible();
});
