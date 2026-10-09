import { expect, test, type Page } from "@playwright/test";
import { completeOnboarding, signUp } from "./helpers";

const step = (page: Page) => page.locator("form[data-step]:visible");

async function continueFrom(page: Page) {
  const current = await step(page).getAttribute("data-step");
  await step(page).getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator(`form[data-step="${current}"]:visible`)).toHaveCount(0);
}

async function choose(page: Page, option: string) {
  await step(page).locator("label", { hasText: option }).first().click();
  await step(page).getByRole("button", { name: "Verificar" }).click();
  await expect(step(page)).toHaveAttribute("data-checked", "true");
}

/**
 * A wrong and a right answer are graded as such, the lesson position and the
 * learner's words survive signing out and back in.
 */
test("answers are graded honestly and progress survives logout and login", async ({ page }) => {
  const learner = await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });

  await page.goto("/licao/a0-u1-l1");
  await continueFrom(page); // teaching card
  await expect(step(page)).toHaveAttribute("data-step", /^a0-u1-l1-a1-/);

  // "Bonjour !" does not mean "Tchau!": marked wrong.
  await choose(page, "Tchau!");
  const feedback = step(page).getByRole("status");
  await expect(feedback).toContainText(/Ainda não\.|Pas tout à fait\./);
  await expect(feedback).toContainText("Resposta certa:");
  await expect(feedback).toContainText("Bom dia / Olá!");
  // The right option is announced, not only coloured.
  await expect(
    step(page).getByRole("radio", { name: /Bom dia \/ Olá! \(resposta certa\)/ }),
  ).toBeAttached();
  await expect(
    step(page).getByRole("radio", { name: /Tchau! \(sua resposta, errada\)/ }),
  ).toBeAttached();
  await continueFrom(page);

  await continueFrom(page); // teaching card
  await choose(page, "Bonjour !");
  await expect(step(page).getByRole("status")).toContainText(/Isso!|C'est ça !/);
  await continueFrom(page);
  const resumeAt = await step(page).getAttribute("data-step");
  expect(resumeAt).toMatch(/^a0-u1-l1-a3-/);

  // Leave the lesson and sign out.
  await page.getByRole("link", { name: "Sair da lição (o progresso fica salvo)" }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  await page.getByRole("button", { name: "Abrir menu da conta" }).filter({ visible: true }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/hoje");
  await expect(page).toHaveURL(/\/entrar/);

  // Backslashes normalize into a protocol-relative URL in browser URL parsers.
  // Never send the learner or their session to an external post-login target.
  let attemptedExternalRedirect = false;
  await page.route(/^https?:\/\/attacker\.example\.test\//, async (route) => {
    attemptedExternalRedirect = true;
    await route.abort();
  });
  await page.goto("/entrar?next=" + encodeURIComponent("/\\attacker.example.test"));

  // Sign back in: the lesson resumes where it was left, and the words are in the notebook.
  await page.getByLabel("E-mail").fill(learner.email);
  await page.getByLabel("Senha").fill(learner.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  expect(attemptedExternalRedirect).toBe(false);

  await page.goto("/licao/a0-u1-l1");
  await expect(step(page)).toHaveAttribute("data-step", /^a0-u1-l1-a3-/);

  await page.goto("/caderno");
  await expect(page.getByRole("main").getByText("bonjour", { exact: true }).first()).toBeVisible();
});
