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

  await page.goto("/hoje");
  await expect(page.getByRole("heading", { name: "Nova conquista" })).toBeVisible();
  await expect(page.getByText("Premier pas")).toBeVisible();

  await page.goto("/progresso");
  await expect(page.getByRole("heading", { name: "Seu progresso" })).toBeVisible();
  await expect(page.getByText(/Premier pas\s*\(conquistada\)/)).toBeVisible();
  await expect(
    page.getByRole("table", { name: /Itens do curso por nível de domínio/ }),
  ).toBeAttached();
});
