import { expect, test } from "@playwright/test";
import { completeOnboarding, signUp } from "./helpers";

test("a learner gets authentic French at their level, linked to the official source", async ({
  page,
}) => {
  await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });

  const suggestion = page.getByRole("region", { name: "Para ouvir ou ler hoje" });
  await expect(suggestion).toBeVisible();
  const link = suggestion.getByRole("link", { name: /Abrir em/ });
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");

  await page.goto("/conteudo");
  await expect(page.getByRole("heading", { name: "Francês de verdade" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /No seu nível/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Para daqui a pouco" })).toBeVisible();
  await expect(page.getByText(/nada é copiado nem hospedado aqui/)).toBeVisible();
});
