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
  await page.waitForURL((url) => !url.pathname.startsWith("/comecar"), { timeout: 30_000 });
}

/**
 * Answers whatever activity is on screen (not necessarily correctly), then
 * checks it. All locators are scoped to the active step: with Cache Components
 * Next.js keeps previously visited routes mounted but hidden.
 */
export async function answerCurrentStep(page: Page) {
  const step = page.locator("form[data-step]:visible");
  await expect(step).toHaveCount(1);
  const stepId = await step.getAttribute("data-step");
  const continueButton = step.getByRole("button", { name: "Continuar", exact: true });
  const next = async () => {
    await continueButton.click();
    await expect(page.locator(`form[data-step="${stepId}"]:visible`))
      .toHaveCount(0, { timeout: 20_000 })
      .catch(() => undefined);
  };
  if ((await step.getAttribute("data-checked")) === "true" || (await continueButton.isVisible())) {
    await next();
    return;
  }
  const pairs = step.locator("button[aria-pressed]");
  const pairCount = await pairs.count();
  for (let i = 0; i < pairCount; i += 1) {
    await pairs.nth(i).click();
    await step.locator("ul").nth(1).locator("button").nth(i).click();
  }
  const bank = step.getByLabel("Palavras disponíveis").locator("button:enabled");
  while ((await bank.count()) > 0) await bank.first().click();
  const names = await step
    .locator("label:has(input[type=radio]:enabled)")
    .evaluateAll((labels) => [
      ...new Set(labels.map((label) => label.querySelector("input")?.getAttribute("name") ?? "")),
    ]);
  for (const name of names) {
    await step.locator(`label:has(input[type=radio][name="${name}"])`).first().click();
  }
  const checkboxes = step.locator("label:has(input[type=checkbox]:enabled)");
  if ((await checkboxes.count()) > 0) await checkboxes.first().click();
  const fields = step.locator("input[lang=fr]:enabled, textarea[lang=fr]:enabled");
  for (let i = 0; i < (await fields.count()); i += 1) {
    if (!(await fields.nth(i).inputValue())) await fields.nth(i).fill("bonjour");
  }
  await step.getByRole("button", { name: "Verificar" }).click();
  await expect(step).toHaveAttribute("data-checked", "true", { timeout: 20_000 });
  await next();
}
