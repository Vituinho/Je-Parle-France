import { expect, test } from "@playwright/test";
import { answerCurrentStep, completeOnboarding, signUp } from "./helpers";

test("words from a lesson land in the notebook and grammar can be studied and drilled", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });

  await page.goto("/caderno");
  await expect(page.getByRole("heading", { name: "Meu caderno" })).toBeVisible();
  await expect(page.getByText(/Seu caderno ainda está vazio/)).toBeVisible();

  await page.goto("/licao/a0-u1-l1");
  for (let i = 0; i < 40; i += 1) {
    if (await page.getByRole("heading", { name: "Lição concluída" }).isVisible()) break;
    await answerCurrentStep(page);
  }
  await expect(page.getByRole("heading", { name: "Lição concluída" })).toBeVisible();

  await page.goto("/caderno");
  const notebook = page.getByRole("main");
  await expect(notebook.getByText("bonjour", { exact: true })).toBeVisible();
  await page.getByPlaceholder(/Buscar em francês ou português/).fill("zzz");
  await expect(page.getByText("Nada encontrado com esse filtro.")).toBeVisible();
  await page.getByPlaceholder(/Buscar em francês ou português/).fill("bom dia");
  await expect(notebook.getByText("bonjour", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Ver a gramática" }).click();
  await expect(page.getByRole("heading", { name: "Gramática", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: /Tu ou vous/i }).click();
  await expect(page.getByRole("heading", { name: "Como funciona" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Erros comuns" })).toBeVisible();
  await page.getByRole("button", { name: "Começar o treino" }).click();
  for (let i = 0; i < 20; i += 1) {
    if (await page.getByText(/Treino concluído/).isVisible()) break;
    await answerCurrentStep(page);
  }
  await expect(page.getByText(/Treino concluído/)).toBeVisible();
});
