import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { signUp, completeOnboarding } from "./helpers";
import { WRITING_CRITERIA } from "../src/lib/learning/writing/assessment";
import { getContent } from "../src/lib/content";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://jpf@localhost:54329/jpf_dev";
async function fixture<T>(email: string, callback: (db: pg.Client, userId: string) => Promise<T>) {
  const target = new URL(databaseUrl);
  if (
    !["localhost", "127.0.0.1"].includes(target.hostname) ||
    target.pathname !== "/jpf_dev" ||
    !email.endsWith("@example.test")
  )
    throw new Error("Pilot E2E requires local disposable fixtures");
  const db = new pg.Client({ connectionString: databaseUrl });
  await db.connect();
  try {
    const users = await db.query<{ id: string }>("SELECT id FROM users WHERE email=$1", [email]);
    if (users.rows.length !== 1) throw new Error("Fixture user missing");
    return await callback(db, users.rows[0]!.id);
  } finally {
    await db.end();
  }
}
test("optional pilot consent, private feedback, human review and withdrawal", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  const learner = await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });
  await page.goto("/admin/piloto");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  const userId = await fixture(learner.email, async (db, id) => {
    await db.query("UPDATE users SET role='admin' WHERE id=$1", [id]);
    return id;
  });
  await page.goto("/admin/piloto");
  await page.getByLabel("ID do aluno com onboarding concluído").fill(userId);
  await page.getByRole("button", { name: "Convidar para o piloto" }).click();
  await expect(page.getByText("Convite registrado.")).toBeVisible();
  await page.goto("/piloto");
  await expect(page.getByText("Versão do aviso:", { exact: false })).toBeVisible();
  await page.getByRole("checkbox", { name: /Li o aviso/ }).check();
  await page.getByRole("button", { name: "Aceitar participação no piloto" }).click();
  await expect(page.getByText("Aceite registrado. Obrigado por participar!")).toBeVisible();
  // A persisted synthetic assessment exercises the browser workflow. No paid call/audio/seed.
  await fixture(learner.email, async (db, id) => {
    const activity = getContent().placementItems.get("pw-a2-ow")!.activity;
    if (activity.type !== "open_writing" || !activity.rubric)
      throw new Error("Fixture rubric missing");
    const attemptId = randomUUID();
    await db.query(
      `INSERT INTO placement_attempts (id,"userId",mode,status,skills,plan,"startedAt","completedAt") VALUES ($1,$2,'complete','completed',ARRAY['writing']::"Skill"[],'{}',$3::timestamp,$3::timestamp)`,
      [attemptId, id, new Date().toISOString()],
    );
    const answer = {
      writingAssessment: {
        version: 1,
        method: "ai_assessment",
        original:
          "Bonjour, je vous invite chez moi samedi pour prendre un café et discuter ensemble.",
        expectedLevel: activity.rubric.expectedLevel,
        criteria: Object.fromEntries(WRITING_CRITERIA.map((c) => [c, { band: 3, evidence: [] }])),
        confidence: 0.8,
        score: 0.75,
        model: "synthetic-browser-fixture",
      },
    };
    await db.query(
      `INSERT INTO placement_responses (id,"attemptId","itemId",skill,score,answer,"createdAt") VALUES ($1,$2,'pw-a2-ow','writing',.75,$3::jsonb,$4::timestamp)`,
      [randomUUID(), attemptId, JSON.stringify(answer), new Date().toISOString()],
    );
  });
  await page.reload();
  await page.getByText("Deixar feedback opcional do piloto", { exact: true }).click();
  await page.getByLabel("Difícil demais", { exact: true }).check();
  await page.getByLabel("Teve algum problema? (opcional)").fill("Instrução da tarefa confusa.");
  await page.getByRole("button", { name: "Enviar feedback" }).click();
  await expect(page.getByText("Feedback registrado. Obrigado!")).toBeVisible();
  await page.goto(`/admin/piloto?learner=${userId}`);
  await expect(page.getByText(/Percepção:.*Difícil demais: 1/)).toBeVisible();
  const select = page.getByLabel("Avaliação consentida");
  await expect(select.locator("option")).toHaveCount(2);
  await select.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Selecionar amostra para revisão" }).click();
  await expect(page.getByText("Amostra selecionada. Abra a revisão abaixo.")).toBeVisible();
  await page.getByRole("link", { name: /Revisar writing · pendente/ }).click();
  await expect(
    page.getByRole("heading", { name: "Amostra selecionada para revisão humana" }),
  ).toBeVisible();
  await page
    .getByRole("heading", { name: "Amostra selecionada para revisão humana" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: `.data/verification/pilot-review-${testInfo.project.name}.png` });
  for (const criterion of WRITING_CRITERIA)
    await page
      .getByLabel(`Nota humana: ${criterion}`, { exact: true })
      .selectOption(criterion === "grammar" ? "1" : "3");
  await page.getByRole("button", { name: "Salvar revisão humana" }).click();
  await expect(
    page.getByText("Revisão humana salva. Nenhum critério de pontuação foi alterado."),
  ).toBeVisible();
  await expect(page.locator("[data-pilot-calibration-summary]")).toHaveText(
    "1 de 1 amostras comparadas. Nenhum critério foi alterado.",
  );
  await page.goto("/piloto");
  await page.getByRole("button", { name: "Retirar aceite do piloto" }).click();
  await expect(page.getByText(/Aceite retirado\. Feedback e revisões/)).toBeVisible();
  await fixture(learner.email, async (db, id) => {
    expect((await db.query('SELECT 1 FROM pilot_feedback WHERE "userId"=$1', [id])).rowCount).toBe(
      0,
    );
    expect(
      (await db.query('SELECT 1 FROM pilot_calibration WHERE "userId"=$1', [id])).rowCount,
    ).toBe(0);
    expect(
      (await db.query('SELECT 1 FROM learner_profiles WHERE "userId"=$1', [id])).rowCount,
    ).toBe(1);
  });
  await page.goto(`/admin/piloto?learner=${userId}`);
  await expect(page.locator("[data-pilot-participant]")).toHaveAttribute(
    "data-pilot-status",
    "withdrawn",
  );
  await expect(
    page.getByRole("heading", { name: "Revisão do participante selecionado" }),
  ).toHaveCount(0);
});
