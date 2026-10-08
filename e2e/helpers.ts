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
  const submit = async () => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/auth/sign-up/email") &&
          response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Criar conta" }).click(),
    ]);
    return response;
  };
  let response = await submit();
  if (response.status() === 429) {
    // Production auth limits stay enabled. Honour the server's requested wait
    // rather than treating a deliberate throttle as a broken sign-up flow.
    const seconds = Number(
      response.headers()["x-retry-after"] ?? response.headers()["retry-after"] ?? 60,
    );
    await page.waitForTimeout(
      (Number.isFinite(seconds) ? Math.max(1, Math.min(60, seconds)) : 60) * 1000,
    );
    response = await submit();
  }
  expect(response.ok(), `Sign-up returned HTTP ${response.status()}`).toBe(true);
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

/** Answers placement items until the report shows: picks an option or says "não sei". */
export async function finishPlacement(page: Page) {
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

/** Runs the session page until the "Sessão concluída" screen. */
export async function runSession(page: Page) {
  const stepForm = page.locator("form[data-step]:visible");
  const startButton = page
    .getByRole("button", { name: /^(Começar|Continuar)$/ })
    .filter({ visible: true });
  const done = page.getByRole("heading", { name: "Sessão concluída" });
  for (let guard = 0; guard < 200; guard += 1) {
    await expect(stepForm.or(startButton).or(done).first()).toBeVisible({ timeout: 20_000 });
    if (await done.isVisible()) return;
    if ((await stepForm.count()) > 0) await answerCurrentStep(page);
    else await startButton.first().click();
  }
  throw new Error("session did not finish within 200 steps");
}
