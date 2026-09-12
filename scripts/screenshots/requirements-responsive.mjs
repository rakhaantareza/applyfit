import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { AUTH_STATE_PATH, DEFAULT_BASE_URL } from "./config.mjs";
import { ensureDevelopmentServer, resolveScreenshotJob } from "./workflow.mjs";

const directory = "screenshots/requirements-responsive";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
try {
  const base = await ensureDevelopmentServer(DEFAULT_BASE_URL);
  const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
  await context.route("**/api/**", (route) =>
    ["GET", "HEAD"].includes(route.request().method())
      ? route.continue()
      : route.fulfill({
          status: 400,
          json: { error: { message: "Read-only QA" } },
        }),
  );
  const job = await resolveScreenshotJob(context.request, base);
  const page = await context.newPage();
  for (const width of [
    360, 390, 600, 768, 1023, 1024, 1060, 1100, 1101, 1199, 1200, 1440,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/lowongan/${job.id}/persyaratan`);
    const row = page.locator(".requirement-review-list article").first();
    await row.waitFor();
    await page.evaluate(() => document.fonts.ready);
    await row.scrollIntoViewIfNeeded();
    const control = row.locator(".requirement-priority-control");
    const geometry = await control.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const buttons = [...element.querySelectorAll("button")].map((button) =>
        button.getBoundingClientRect(),
      );
      return {
        width: rect.width,
        content: buttons.reduce((sum, button) => sum + button.width, 0),
      };
    });
    assert(
      geometry.width <= geometry.content + 12,
      `${width}: priority control stretched`,
    );
    await inspect("list");
    await row.locator(".requirement-edit-button").click();
    await inspect("edit");
    await page
      .locator(".requirement-editor")
      .getByRole("button", { name: "Batal", exact: true })
      .click();
    await row.locator(".requirement-delete-button").click();
    await inspect("delete");
    await page
      .locator(".requirement-delete-confirmation")
      .getByRole("button", { name: "Batal", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Pilih & gabungkan", exact: true })
      .first()
      .click();
    await inspect("selection");
    async function inspect(state) {
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${width} ${state}: page overflow`,
      );
      const clipped = await page
        .locator(
          ".requirement-review-list button, .requirement-editor input, .requirement-editor textarea",
        )
        .evaluateAll((elements) =>
          elements
            .filter((element) => {
              if (!element.checkVisibility()) return false;
              const rect = element.getBoundingClientRect();
              return rect.left < -1 || rect.right > innerWidth + 1;
            })
            .map((element) => element.textContent),
        );
      assert.deepEqual(clipped, [], `${width} ${state}: clipped controls`);
      await page.screenshot({ path: `${directory}/${width}-${state}.png` });
      console.log(`PASS ${width} ${state}`);
    }
  }
} finally {
  await browser.close();
}
