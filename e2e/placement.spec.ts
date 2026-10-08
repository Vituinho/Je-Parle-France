import { expect, test } from "@playwright/test";
import { completeOnboarding, finishPlacement, signUp } from "./helpers";

test("a learner takes the quick placement and gets a per-skill report", async ({ page }) => {
  await signUp(page);
  await completeOnboarding(page, { experience: "Estudei um pouco", start: "Diagnóstico rápido" });
  await expect(page).toHaveURL(/\/diagnostico\?modo=quick$/);
  await page.getByRole("button", { name: "Começar o rápido" }).click();
  await finishPlacement(page);

  await expect(page).toHaveURL(/\/resultado$/);
  await expect(page.getByRole("heading", { name: "Seu diagnóstico" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Por habilidade" })).toBeVisible();
  await expect(page.getByText("não avaliada neste diagnóstico")).toBeVisible();
  await expect(page.getByText(/não uma certificação oficial/)).toBeVisible();
});
