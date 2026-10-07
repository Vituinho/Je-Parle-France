/**
 * Dev helper: signs in (optional) and screenshots pages for visual review.
 *   npx tsx scripts/shot.mts <outDir> <email|-> <password|-> <width> <path> [path...]
 */
import { chromium } from "@playwright/test";

const [outDir, email, password, width, ...paths] = process.argv.slice(2);
const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: Number(width ?? 1280), height: 900 },
  locale: "pt-BR",
});
const page = await context.newPage();
if (email && email !== "-") {
  await page.goto(`${base}/entrar`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/entrar"), { timeout: 30_000 });
}
for (const [index, path] of paths.entries()) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const file = `${outDir}/${index}-${path.replace(/[^a-z0-9]+/gi, "_")}-${width}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(file);
}
await browser.close();
