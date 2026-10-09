import { expect, test } from "@playwright/test";
import pg from "pg";
import { completeOnboarding, signUp } from "./helpers";
import { calibrationTemplate } from "../scripts/calibration-kit";

/** Local development database (the same one the dev server uses). */
const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://jpf@localhost:54329/jpf_dev";

async function promoteToAdmin(email: string) {
  const target = new URL(DATABASE_URL);
  if (
    !["localhost", "127.0.0.1"].includes(target.hostname) ||
    !target.pathname.endsWith("/jpf_dev") ||
    !email.endsWith("@example.test")
  )
    throw new Error(
      "Admin E2E fixtures require the local development database and a disposable test account",
    );
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query("update users set role = 'admin' where email = $1", [email]);
  } finally {
    await client.end();
  }
}

test("learners cannot open the admin area", async ({ page }) => {
  await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });
  // The shell is streamed first (Partial Prerendering), so the check shows the
  // not-found page inside the stream; no admin data is ever rendered.
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Administração do conteúdo" })).toHaveCount(0);
  await page.goto("/admin/piloto");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});

test("an admin reviews the content inventory and previews a lesson with its answers", async ({
  page,
}) => {
  const learner = await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });
  await promoteToAdmin(learner.email);

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Administração do conteúdo" })).toBeVisible();
  await expect(page.getByText("Nenhum erro ou aviso no conteúdo.")).toBeVisible();
  await page.getByRole("link", { name: /ca-u2-l2/ }).click();
  await expect(page.getByRole("heading", { name: "No banco" })).toBeVisible();
  await expect(page.getByText("J'ai besoin d'ouvrir un compte.").first()).toBeVisible();
  await expect(page.getByText(/lex:avoir-besoin-de · recall/).first()).toBeVisible();
  await page.goto("/admin/piloto");
  await expect(
    page.getByRole("heading", { name: "Piloto de aprendizagem", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Arquivo do kit de calibração").setInputFiles({
    name: "calibration.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(calibrationTemplate())),
  });
  await page.getByRole("button", { name: "Comparar avaliações" }).click();
  await expect(
    page.getByText("0 de 3 amostras comparadas. Nenhum critério foi alterado."),
  ).toBeVisible();
});
