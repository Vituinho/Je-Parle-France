import { expect, test } from "@playwright/test";
import { completeOnboarding, signUp } from "./helpers";

test("a learner talks to the tutor, gets a correction and a report", async ({ page }) => {
  await signUp(page);
  await completeOnboarding(page, { experience: "Estudei um pouco", start: "Começar do zero" });
  await page.goto("/tutor");
  await expect(page.getByRole("heading", { name: "Conversar com o tutor" })).toBeVisible();
  await page.getByText("Abrir uma conta no banco", { exact: true }).click();
  await page.getByText("Só o importante", { exact: true }).click();
  await page.getByRole("button", { name: "Começar conversa" }).click();

  await expect(page).toHaveURL(/\/conversa\/[a-z0-9]+$/);
  await expect(page.getByText(/Bienvenue/)).toBeVisible();

  // Without a speech provider the mic is not offered (no invented transcripts),
  // but replies can still be read aloud automatically; the choice persists.
  await expect(page.getByRole("button", { name: "Responder falando" })).toHaveCount(0);
  // Clicking the label text: in dev, the Next.js indicator covers the corner on phones.
  const autoplayLabel = page.getByText("Ouvir as respostas automaticamente");
  await autoplayLabel.click();
  await expect(page.getByLabel("Ouvir as respostas automaticamente")).toBeChecked();
  await page.reload();
  await expect(page.getByLabel("Ouvir as respostas automaticamente")).toBeChecked();
  await autoplayLabel.click();
  await expect(page.getByLabel("Ouvir as respostas automaticamente")).not.toBeChecked();
  await page.getByLabel("Sua mensagem em francês").fill("Bonjour. Je besoin d'ouvrir un compte.");
  await page.keyboard.press("Enter");

  const corrections = page.getByRole("list", { name: "Correções" });
  await expect(corrections).toContainText("j'ai besoin");
  await expect(corrections).toContainText("avoir besoin de");

  await page.getByRole("button", { name: "Encerrar" }).click();
  await expect(page.getByRole("heading", { name: "Relatório da conversa" })).toBeVisible();
  await expect(page.getByText("Essas correções entraram na sua revisão.")).toBeVisible();
});
