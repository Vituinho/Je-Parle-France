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
 * checks it. Used to walk through lessons and sessions end to end.
 */
export async function answerCurrentStep(page: Page) {
  const step = page.locator("form[data-step]");
  await expect(step).toBeVisible();
  const stepId = await step.getAttribute("data-step");
  const continueButton = page.getByRole("button", { name: "Continuar", exact: true });
  const next = async () => {
    await continueButton.click();
    // Wait until the next step (or the end screen) replaced this one.
    await expect(page.locator(`form[data-step="${stepId}"][data-checked]`))
      .toHaveCount(0, { timeout: 20_000 })
      .catch(() => undefined);
  };
  if ((await step.getAttribute("data-checked")) === "true" || (await continueButton.isVisible())) {
    await next();
    return;
  }
  const pairs = page.locator("button[aria-pressed]");
  const pairCount = await pairs.count();
  if (pairCount > 0) {
    for (let i = 0; i < pairCount; i += 1) {
      await pairs.nth(i).click();
      await page.locator("ul").nth(1).locator("button").nth(i).click();
    }
  }
  const bank = page.getByLabel("Palavras disponíveis").locator("button:enabled");
  while ((await bank.count()) > 0) await bank.first().click();
  const radios = page.locator("label:has(input[type=radio]:enabled)");
  if ((await radios.count()) > 0) {
    const groups = await page.locator("fieldset, [role=radiogroup]").count();
    // Answer every question group: pick the first option of each radio name.
    const names = await radios.evaluateAll((labels) => [
      ...new Set(labels.map((label) => label.querySelector("input")?.getAttribute("name") ?? "")),
    ]);
    for (const name of names) {
      await page.locator(`label:has(input[type=radio][name="${name}"])`).first().click();
    }
    void groups;
  }
  const checkboxes = page.locator("label:has(input[type=checkbox]:enabled)");
  if ((await checkboxes.count()) > 0) await checkboxes.first().click();
  const fields = page.locator("input[lang=fr]:enabled, textarea[lang=fr]:enabled");
  for (let i = 0; i < (await fields.count()); i += 1) {
    if (!(await fields.nth(i).inputValue())) await fields.nth(i).fill("bonjour");
  }
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(step).toHaveAttribute("data-checked", "true", { timeout: 20_000 });
  await next();
}
