import { test, expect } from "@playwright/test";
import pg from "pg";
import { signUp, completeOnboarding } from "./helpers";
import { getContent } from "../src/lib/content";
import { buildReviewActivity } from "../src/lib/learning/review/generate";
import { oracleResponse } from "../src/test/oracle";
test("a frozen review recovers from stale entries and another tab completing its final valid item", async ({
  page,
  context,
}) => {
  test.setTimeout(150000);
  const learner = await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });
  await expect(page.getByRole("link", { name: "Começar a sessão de hoje" })).toBeVisible();
  const connectionString = process.env.DATABASE_URL ?? "postgresql://jpf@localhost:54329/jpf_dev";
  const target = new URL(connectionString);
  if (
    !["localhost", "127.0.0.1"].includes(target.hostname) ||
    target.pathname !== "/jpf_dev" ||
    !learner.email.endsWith("@example.test")
  )
    throw new Error("Stale review fixtures require local disposable accounts");
  const client = new pg.Client({ connectionString });
  await client.connect();
  let userId: string, sessionId: string;
  const date = new Date().toISOString().slice(0, 10);
  const items = [
    { conceptId: "lex:merci", dimension: "recognition" },
    { conceptId: "personal:deleted-fixture", dimension: "recall" },
    { conceptId: "lex:bonjour", dimension: "recognition" },
    { conceptId: "lex:bonjour", dimension: "recognition" },
  ];
  try {
    const row = (
      await client.query<{ id: string }>("SELECT id FROM users WHERE email=$1", [learner.email])
    ).rows[0]!;
    userId = row.id;
    sessionId = (
      await client.query<{ id: string }>(
        `SELECT id FROM daily_sessions WHERE "userId"=$1 ORDER BY "createdAt" DESC LIMIT 1`,
        [userId],
      )
    ).rows[0]!.id;
    const plan = {
      version: 1,
      date,
      minutes: 5,
      seconds: 60,
      blocks: [
        { kind: "review", seconds: 48, items, reason: "fixture" },
        { kind: "review", seconds: 12, items: [items[0]], reason: "stale final block" },
      ],
    };
    await client.query(
      `UPDATE daily_sessions SET plan=$2::jsonb,cursor=0,status='planned',"plannedMinutes"=5 WHERE id=$1`,
      [sessionId, JSON.stringify(plan)],
    );
    for (const conceptId of ["lex:bonjour", "lex:merci"]) {
      const past = new Date(Date.now() - 3 * 86400000).toISOString();
      const due = new Date(
        Date.now() + (conceptId === "lex:merci" ? 86400000 : -86400000),
      ).toISOString();
      await client.query(
        `INSERT INTO memory_traces ("userId","conceptId",dimension,due,stability,difficulty,"elapsedDays","scheduledDays","learningSteps",reps,lapses,state,source,"introducedAt","updatedAt","lastReview",attempts,successes) VALUES ($1,$2,'recognition',$3::timestamp,3,5,3,3,0,1,0,2,'lesson',$4::timestamp,$4::timestamp,$4::timestamp,1,1)`,
        [userId, conceptId, due, past],
      );
    }
  } finally {
    await client.end();
  }
  const url = `/sessao?id=${sessionId!}`;
  await page.goto(url);
  await page.reload();
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  const step = page.locator("form[data-step]:visible");
  await expect(step).toHaveCount(1);
  await expect(step).toHaveAttribute("data-step", /lex:bonjour/);
  const tab = await context.newPage();
  await tab.goto(url);
  await tab.getByRole("button", { name: "Começar", exact: true }).click();
  const activity = buildReviewActivity({
    index: getContent(),
    conceptId: "lex:bonjour",
    dimension: "recognition",
    seed: `rv:${userId!}:${date}`,
  })!;
  const answer = oracleResponse(activity, `u:${userId!}`, true);
  if (answer.kind !== "choice") throw new Error("Fixture choice expected");
  const tabStep = tab.locator("form[data-step]:visible");
  await tabStep.locator("label:has(input[type=radio])").nth(answer.choice).click();
  await tabStep.getByRole("button", { name: "Verificar" }).click();
  await expect(tabStep).toHaveAttribute("data-checked", "true");
  // The original tab keeps its old snapshot; the server must skip instead of schedule twice.
  await step.locator("label:has(input[type=radio])").nth(answer.choice).click();
  await step.getByRole("button", { name: "Verificar" }).click();
  await expect(page.getByRole("heading", { name: "Sessão concluída" })).toBeVisible();
  await expect(page.getByText(/já foi reagendado/)).toHaveCount(0);
  await tab.reload();
  await expect(tab.getByRole("heading", { name: "Sessão concluída" })).toBeVisible();
  const exported = await (await page.request.get("/api/conta/dados")).json();
  expect(
    exported.reviewLogs.filter((r: { conceptId: string }) => r.conceptId === "lex:bonjour"),
  ).toHaveLength(1);
  expect(exported.activityAttempts).toHaveLength(1);
  const saved = exported.dailySessions.find((s: { id: string }) => s.id === sessionId!);
  expect(saved.cursor).toBe(2);
  expect(saved.status).toBe("completed");
  expect(saved.plan.blocks[0].items).toEqual(items);
  expect(
    exported.dailyActivity.reduce((n: number, d: { reviewsDone: number }) => n + d.reviewsDone, 0),
  ).toBe(1);
  await page.goBack();
  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Sessão concluída" })).toBeVisible();
  await tab.close();
  await page.goto("/hoje");
  await page.getByRole("button", { name: "Abrir menu da conta" }).filter({ visible: true }).click();
  const [signedOut] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/sign-out") && response.request().method() === "POST",
    ),
    page.getByRole("menuitem", { name: "Sair" }).click(),
  ]);
  expect(signedOut.ok()).toBe(true);
  await expect(page).toHaveURL(/\/$/);
  await page.goto(url);
  await expect(page).toHaveURL(/\/entrar/);
  await page.getByLabel("E-mail").fill(learner.email);
  await page.getByLabel("Senha").fill(learner.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sessão concluída" })).toBeVisible();
});
