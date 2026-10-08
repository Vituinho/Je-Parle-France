import { expect, test } from "@playwright/test";
import { completeOnboarding, signUp } from "./helpers";

test("a learner shadows dialogue lines in the pronunciation lab", async ({ page }) => {
  await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });
  await page.goto("/pronuncia");
  await page.getByRole("link", { name: /Shadowing: frases dos seus diálogos/ }).click();
  await expect(page.getByRole("heading", { name: "Shadowing", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Frase atual" })).toBeVisible();

  await page.getByRole("button", { name: "Esconder o texto" }).click();
  await expect(page.getByText("Texto escondido — só ouvido.")).toBeVisible();

  for (let i = 0; i < 12; i += 1) {
    const finish = page.getByRole("button", { name: "Terminar" });
    if (await finish.isVisible()) {
      await finish.click();
      break;
    }
    await page.getByRole("button", { name: "Próxima frase" }).click();
  }
  await expect(page.getByRole("heading", { name: "Treino de shadowing concluído" })).toBeVisible();
});
