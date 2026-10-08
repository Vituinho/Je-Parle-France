import { expect, test } from "@playwright/test";
import { answerCurrentStep, completeOnboarding, signUp } from "./helpers";

/** All ten authored B1.1 lessons; the shared player also has mobile coverage. */
for (const unit of [1, 2, 3, 4, 5]) {
  test(`plays unit b1-u${unit}`, async ({ page }, info) => {
    test.skip(info.project.name !== "desktop");
    test.setTimeout(240_000);
    await signUp(page);
    await completeOnboarding(page, { experience: "Estudei um pouco", start: "Começar do zero" });
    for (const lesson of [1, 2]) {
      await page.goto(`/licao/b1-u${unit}-l${lesson}`);
      for (let i = 0; i < 40; i += 1) {
        if (await page.getByRole("heading", { name: "Lição concluída" }).isVisible()) break;
        await answerCurrentStep(page);
      }
      await expect(page.getByRole("heading", { name: "Lição concluída" })).toBeVisible();
    }
  });
}
