import { expect, test } from "@playwright/test";
import { completeOnboarding, runSession, signUp } from "./helpers";

test("a learner runs today's session from the dashboard to completion", async ({ page }) => {
  test.setTimeout(240_000);
  await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });
  await page.getByRole("link", { name: "Começar a sessão de hoje" }).click();
  await expect(page.getByRole("heading", { name: /Sua sessão de hoje/ })).toBeVisible();
  await runSession(page);

  await page.goto("/hoje");
  await expect(page.getByRole("heading", { name: "Sessão de hoje concluída" })).toBeVisible();
  await expect(page.getByText(/1 de 5/)).toBeVisible();
});
