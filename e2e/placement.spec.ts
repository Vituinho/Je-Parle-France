import { expect, test, type Page } from "@playwright/test";
import { completeOnboarding, signUp } from "./helpers";

/** Answers placement items until the report shows: picks an option or says "não sei". */
async function finishPlacement(page: Page) {
  for (let i = 0; i < 40; i += 1) {
    await page.waitForURL(/\/diagnostico\/[a-z0-9]+(\/resultado)?$/);
    if (page.url().endsWith("/resultado")) return;
    await expect(page.getByText(/^Etapa \d+ de \d+/)).toBeVisible();
    const dontKnow = page.getByRole("button", { name: "Não sei" });
    if (await dontKnow.isVisible()) {
      const firstOption = page.locator("label:has(input[type=radio])").first();
      if (i % 2 === 0 && (await firstOption.isVisible())) {
        await firstOption.click();
        await page.getByRole("button", { name: "Responder" }).click();
      } else {
        await dontKnow.click();
      }
    } else {
      await page.getByText("Com dificuldade").click();
      await page.getByRole("button", { name: "Responder" }).click();
    }
    await expect(page.getByRole("button", { name: "Enviando…" })).toHaveCount(0, {
      timeout: 20_000,
    });
  }
  throw new Error("placement did not finish within 40 items");
}

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
