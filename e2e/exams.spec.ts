import { expect, test } from "@playwright/test";
import { completeOnboarding, finishPlacement, signUp } from "./helpers";

test("without a diagnosis, exam readiness is not guessed", async ({ page }) => {
  await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });
  await page.goto("/provas");
  await expect(page.getByRole("heading", { name: "Provas oficiais" })).toBeVisible();
  await expect(page.getByText("Estimativa interna, não resultado oficial.")).toBeVisible();
  await expect(page.getByText("Ainda não medido")).toHaveCount(4);
  await expect(page.getByRole("link", { name: /diagnóstico completo/ })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Nível-alvo" })
    .getByRole("link", { name: "C1" })
    .click();
  await expect(page.getByRole("heading", { name: "Sua prontidão para o C1" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Site oficial/ }).first()).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
});

test("after the quick diagnosis, reading and listening readiness are estimated", async ({
  page,
}) => {
  await signUp(page);
  await completeOnboarding(page, { experience: "Estudei um pouco", start: "Diagnóstico rápido" });
  await page.getByRole("button", { name: "Começar o rápido" }).click();
  await finishPlacement(page);
  await page.goto("/provas?nivel=A1");
  // Comprehension is measured; speaking and writing were only self-assessed.
  await expect(page.getByText(/estimativa atual: (A0|A1|A2|B1|B2|C1)/)).toHaveCount(2);
  await expect(page.getByText("Só autoavaliação")).toHaveCount(2);
  await expect(page.getByText("Ainda não medido")).toHaveCount(0);
});
