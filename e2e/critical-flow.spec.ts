import { expect, test, type Page } from "@playwright/test";
import pg from "pg";
import {
  answerCurrentStep,
  completeOnboarding,
  finishPlacement,
  runSession,
  signUp,
} from "./helpers";

/** Read-only verification of the fake learner created by this scenario. */
async function skillSnapshot(email: string) {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL ?? "postgresql://jpf@localhost:54329/jpf_dev",
  });
  await client.connect();
  try {
    const { rows: estimates } = await client.query(
      `SELECT skill, theta, "displayBand", source, method, "evidenceCount"
       FROM skill_estimates WHERE "userId" = (SELECT id FROM users WHERE email = $1) ORDER BY skill`,
      [email],
    );
    const { rows: counts } = await client.query(
      `SELECT source, count(*)::int AS count FROM skill_evidence
       WHERE "userId" = (SELECT id FROM users WHERE email = $1) GROUP BY source ORDER BY source`,
      [email],
    );
    return { estimates, counts };
  } finally {
    await client.end();
  }
}

async function masteryPercent(page: Page): Promise<number> {
  const text = await page.getByText(/^Domínio do (A0|A1|A2|B1|B2|C1):/).textContent();
  return Number(/(\d+)%/.exec(text ?? "")?.[1] ?? Number.NaN);
}

/**
 * The critical path of the product, end to end:
 * sign up → onboarding → placement → report → dashboard → daily session →
 * activities → review → updated progress.
 */
test("critical flow: from sign-up to reviewed, measurable progress", async ({ page }) => {
  test.setTimeout(420_000);
  const learner = await signUp(page);
  await completeOnboarding(page, { experience: "Estudei um pouco", start: "Diagnóstico rápido" });

  await page.getByRole("button", { name: "Começar o rápido" }).click();
  await finishPlacement(page);
  await expect(page.getByRole("heading", { name: "Seu diagnóstico" })).toBeVisible();
  const start = page.getByRole("button", { name: "Começar por aqui" });
  if (await start.isVisible()) await start.click();
  else await page.getByRole("link", { name: "Ir para a sessão de hoje" }).click();
  await expect(page).toHaveURL(/\/hoje$/);

  const estimatesSection = page.locator('section[aria-labelledby="skill-estimates"]:visible');
  await expect(estimatesSection.locator("li[data-skill]")).toHaveCount(7);
  const initial = await skillSnapshot(learner.email);
  expect(initial.estimates).toHaveLength(7);
  expect(initial.estimates.every((e) => e.source === "placement")).toBe(true);
  expect(initial.counts.find((c) => c.source === "placement")?.count).toBeGreaterThan(0);

  const before = await masteryPercent(page);
  await page.getByRole("link", { name: "Começar a sessão de hoje" }).click();
  await runSession(page);

  // Items missed in the session come back after their first learning step (1 minute).
  const reviewDone = page.getByRole("heading", { name: "Revisão concluída" });
  const nothingDue = page.getByRole("heading", { name: "Nada para revisar agora" });
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.goto("/revisar");
    await expect(page.locator("form[data-step]:visible").or(nothingDue)).toBeVisible();
    if (!(await nothingDue.isVisible())) break;
    await page.waitForTimeout(15_000);
  }
  await expect(nothingDue).toBeHidden();
  for (let i = 0; i < 60 && !(await reviewDone.isVisible()); i += 1) {
    await answerCurrentStep(page);
  }
  await expect(reviewDone).toBeVisible();

  await page.goto("/hoje");
  await expect(page.getByRole("heading", { name: "Sessão de hoje concluída" })).toBeVisible();
  expect(await masteryPercent(page)).toBeGreaterThan(before);
  const evolved = await skillSnapshot(learner.email);
  expect(evolved.counts.find((c) => c.source === "lesson")?.count).toBeGreaterThan(0);
  expect(evolved.counts.find((c) => c.source === "review")?.count).toBeGreaterThan(0);
  expect(evolved.estimates.some((e) => e.source === "practice")).toBe(true);
  // One session cannot promote a CEFR band; it can move the latent estimate.
  expect(evolved.estimates.map((e) => [e.skill, e.displayBand])).toEqual(
    initial.estimates.map((e) => [e.skill, e.displayBand]),
  );
  expect(evolved.estimates.some((e, i) => e.theta !== initial.estimates[i].theta)).toBe(true);
  // Compare semantic paragraphs, avoiding layout-dependent innerText line breaks.
  const dashboardEstimates = await estimatesSection.locator("p").allTextContents();
  await page.goto("/progresso");
  await expect(
    page.locator('section[aria-labelledby="skill-estimates"]:visible').locator("p"),
  ).toHaveText(dashboardEstimates);

  // Estimates, their explanations and the completed daily plan survive an auth session change.
  await page.getByRole("button", { name: "Abrir menu da conta" }).filter({ visible: true }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/hoje");
  await expect(page).toHaveURL(/\/entrar/);
  await page.getByLabel("E-mail").fill(learner.email);
  await page.getByLabel("Senha").fill(learner.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  await expect(estimatesSection.locator("p")).toHaveText(dashboardEstimates);
  await expect(page.getByRole("heading", { name: "Sessão de hoje concluída" })).toBeVisible();
  expect(await skillSnapshot(learner.email)).toEqual(evolved);
  await page.goto("/caderno");
  await expect(page.getByText(/\d+ palavras e expressões/)).toBeVisible();
});
