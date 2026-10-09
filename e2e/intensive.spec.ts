import { expect, test } from "@playwright/test";
import pg from "pg";
import { answerCurrentStep, completeOnboarding, signUp } from "./helpers";

test("accelerated 90-minute plan completes a block, pauses, and resumes after login", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const learner = await signUp(page);
  await completeOnboarding(page, {
    experience: "Nunca estudei francês",
    start: "Começar do zero",
    dailyMinutes: 90,
    pace: "Acelerado",
  });
  await expect(page.getByText(/Ritmo: Acelerado · Meta diária: 90 minutos/)).toBeVisible();
  const before = await (await page.request.get("/api/conta/dados")).json();
  const session = before.dailySessions[0];
  expect(session.plan.segments.length).toBeGreaterThan(1);
  expect(before.profile.studyPace).toBe("accelerated");
  await page.getByRole("link", { name: "Começar a sessão de hoje" }).click();
  await expect(page.getByText(/Bloco 1 de/)).toBeVisible();
  const firstEnd = session.plan.segments[0].end;
  const overview = page.locator("[data-session-cursor]:visible");
  const step = page.locator("form[data-step]:visible");
  const start = page
    .getByRole("button", { name: /^(Começar|Continuar)$/ })
    .filter({ visible: true });
  let sampled = false;
  for (let guard = 0; guard < 100; guard += 1) {
    await expect(step.or(start).first()).toBeVisible();
    if (await step.count()) {
      if (!sampled) {
        await page.waitForTimeout(2100);
        sampled = true;
      }
      await answerCurrentStep(page);
    } else if (Number(await overview.getAttribute("data-session-cursor")) >= firstEnd) break;
    else await start.click();
  }
  await expect(page.getByRole("heading", { name: "Bloco 1 concluído" })).toBeVisible();
  const saved = await (await page.request.get("/api/conta/dados")).json();
  const savedSession = saved.dailySessions.find((s: { id: string }) => s.id === session.id);
  expect(savedSession.cursor).toBe(firstEnd);
  expect(savedSession.status).toBe("in_progress");
  await page.getByRole("link", { name: "Pausar e continuar mais tarde" }).click();
  await expect(page.getByRole("heading", { name: "Aprendizagem na semana" })).toBeVisible();
  await expect
    .poll(async () => {
      const exported = await (await page.request.get("/api/conta/dados")).json();
      return exported.studyEvents.filter((e: { type: string }) => e.type === "session_paused")
        .length;
    })
    .toBeGreaterThan(0);
  const paused = await (await page.request.get("/api/conta/dados")).json();
  const pausedSeconds = paused.dailySessions.find(
    (s: { id: string }) => s.id === session.id,
  ).activeSeconds;
  expect(pausedSeconds).toBeGreaterThan(0);
  await expect(page.locator("[data-weekly-active-seconds]:visible")).toHaveAttribute(
    "data-weekly-active-seconds",
    String(
      paused.dailyActivity.reduce(
        (sum: number, d: { activeSeconds: number }) => sum + d.activeSeconds,
        0,
      ),
    ),
  );
  await page.getByRole("button", { name: "Abrir menu da conta" }).filter({ visible: true }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/sessao");
  await expect(page).toHaveURL(/\/entrar/);
  await page.getByLabel("E-mail").fill(learner.email);
  await page.getByLabel("Senha").fill(learner.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(/\/sessao/);
  await expect(page.locator(`[data-session-id="${session.id}"]:visible`)).toHaveAttribute(
    "data-session-cursor",
    String(firstEnd),
  );
  await expect(page.getByText(/Bloco 2 de/)).toBeVisible();
  // More measured work after resuming; one additional authored/generated task is enough.
  await start.click();
  await expect(step).toBeVisible();
  await page.waitForTimeout(2100);
  await answerCurrentStep(page);
  await page.goto("/hoje");
  await expect
    .poll(async () => {
      const exported = await (await page.request.get("/api/conta/dados")).json();
      return exported.dailySessions.find((s: { id: string }) => s.id === session.id).activeSeconds;
    })
    .toBeGreaterThan(pausedSeconds);
  const restored = await (await page.request.get("/api/conta/dados")).json();
  expect(restored.studyEvents.some((e: { type: string }) => e.type === "session_resumed")).toBe(
    true,
  );
  expect(restored.studyEvents.some((e: { type: string }) => e.type === "block_completed")).toBe(
    true,
  );
  expect(restored.dailySessions.find((s: { id: string }) => s.id === session.id).plan).toEqual(
    session.plan,
  );

  // Preferences affect future sessions, preserving this day's progress and frozen plan.
  await page.goto("/conta");
  await page.getByText("Imersão", { exact: true }).click();
  await page.getByText("120 minutos", { exact: true }).click();
  await page.getByRole("button", { name: "Salvar preferências" }).click();
  await expect(page.getByText("Preferências salvas")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("group", { name: "Ritmo de estudo" }).getByRole("radio", { name: /Imersão/ }),
  ).toBeChecked();
  const after = await (await page.request.get("/api/conta/dados")).json();
  expect(after.profile.dailyMinutes).toBe(120);
  expect(after.profile.studyPace).toBe("immersion");
  expect(
    after.dailySessions.find((s: { id: string }) => s.id === session.id).cursor,
  ).toBeGreaterThanOrEqual(firstEnd);
  expect(after.dailySessions.find((s: { id: string }) => s.id === session.id).plan).toEqual(
    session.plan,
  );
  await page.goto("/hoje");
  await expect(page.getByText(/Ritmo: Acelerado · Meta diária: 90 minutos/)).toBeVisible();
  await page
    .locator("[data-weekly-active-seconds]:visible")
    .screenshot({ path: `.data/verification/telemetry-weekly-${test.info().project.name}.png` });
  // A normal learner cannot inspect the pilot. Then promote only this disposable local fixture.
  await page.goto("/admin/piloto");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  const dbUrl = process.env.DATABASE_URL ?? "postgresql://jpf@localhost:54329/jpf_dev";
  const parsedUrl = new URL(dbUrl);
  if (
    !["localhost", "127.0.0.1"].includes(parsedUrl.hostname) ||
    !parsedUrl.pathname.endsWith("/jpf_dev")
  )
    throw new Error("Pilot E2E role fixture is restricted to the local development database");
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query("update users set role = 'admin' where email = $1", [learner.email]);
  } finally {
    await client.end();
  }
  await page.goto(`/admin/piloto?learner=${after.user.id}`);
  await expect(
    page.getByRole("heading", { name: "Piloto de aprendizagem", exact: true }),
  ).toBeVisible();
  await expect(page.locator(`[data-pilot-session="${session.id}"]`)).toHaveAttribute(
    "data-pilot-active-seconds",
    String(after.dailySessions.find((s: { id: string }) => s.id === session.id).activeSeconds),
  );
  await expect(page.getByRole("heading", { name: "Linha do tempo educacional" })).toBeVisible();
  await page.screenshot({
    path: `.data/verification/telemetry-pilot-${test.info().project.name}.png`,
  });
});
