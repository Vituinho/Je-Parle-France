import { expect, type Page } from "@playwright/test";

/** Unique, obviously fake learner for each run (local development database only). */
export function newLearner() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return { name: "Ana Teste", email: `e2e-${id}@example.test`, password: `e2e-password-${id}` };
}

export async function signUp(page: Page, learner = newLearner()) {
  await page.goto("/cadastro");
  await page.getByLabel("Como quer ser chamado?").fill(learner.name);
  await page.getByLabel("E-mail").fill(learner.email);
  await page.getByLabel("Senha").fill(learner.password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/comecar$/);
  return learner;
}

export type OnboardingChoice = "Diagnóstico rápido" | "Diagnóstico completo" | "Começar do zero";

export async function completeOnboarding(
  page: Page,
  options: { experience: string; start: OnboardingChoice },
) {
  await page.getByText("Morar no Québec").click();
  await page.getByText("Trabalhar em francês").click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByText("Canadá / Québec").click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByText(options.experience, { exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByText("30 minutos").click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByText("B2", { exact: true }).click();
  await expect(page.getByText(/costuma levar/)).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByText(options.start, { exact: true }).click();
  await page.getByRole("button", { name: "Montar meu plano" }).click();
}
