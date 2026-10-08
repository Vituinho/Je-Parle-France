import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { completeOnboarding, signUp } from "./helpers";

test("a learner changes preferences, exports their data and deletes the account", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const learner = await signUp(page);
  await completeOnboarding(page, { experience: "Nunca estudei francês", start: "Começar do zero" });

  await page.goto("/conta");
  await expect(page.getByRole("heading", { name: "Conta e privacidade" })).toBeVisible();
  await page.getByText("30 minutos", { exact: true }).click();
  await page.getByText("Mais francês", { exact: true }).click();
  await page.getByRole("button", { name: "Salvar preferências" }).click();
  await expect(page.getByText("Preferências salvas")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio", { name: /30 minutos/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /Mais francês/ })).toBeChecked();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Baixar meus dados" }).click(),
  ]);
  const exported = JSON.parse(await readFile(await download.path(), "utf8"));
  expect(exported.format).toBe("je-parle-francais/export");
  expect(exported.user.email).toBe(learner.email);
  expect(exported.profile.dailyMinutes).toBe(30);

  await page.getByRole("button", { name: "Excluir minha conta" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Sua senha").fill(learner.password);
  const confirm = dialog.getByRole("button", { name: "Excluir conta" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel(/para confirmar/).fill("EXCLUIR");
  await confirm.click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(learner.email);
  await page.getByLabel("Senha").fill(learner.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
});
