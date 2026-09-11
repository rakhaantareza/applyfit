import assert from "node:assert/strict";
import { chromium } from "playwright";
import { AUTH_STATE_PATH, DEFAULT_BASE_URL } from "./config.mjs";
import {
  ensureDevelopmentServer,
  getBaseUrl,
  resolveScreenshotJob,
} from "./workflow.mjs";
const browser = await chromium.launch();
try {
  const base = await ensureDevelopmentServer(getBaseUrl(DEFAULT_BASE_URL));
  const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
  const job = await resolveScreenshotJob(context.request, base);
  const page = await context.newPage();
  for (const width of [1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + `/lowongan/${job.id}/analisis`);
    await page.locator(".score-card").waitFor();
    const breadcrumb = await page.locator(".app-topbar-context").boundingBox();
    const tab = await page.locator(".app-topbar-brand").boundingBox();
    assert(
      Math.abs(
        breadcrumb.y + breadcrumb.height / 2 - (tab.y + tab.height / 2),
      ) < 2,
      `vertical alignment ${width}`,
    );
    if (width === 1920) {
      const detail = await page
        .locator(".job-workspace-nav a")
        .first()
        .boundingBox();
      assert(Math.abs(breadcrumb.x + 3 - detail.x) < 2);
    }
    assert.equal(
      await page
        .locator(".inline-back-link")
        .first()
        .evaluate((el) => getComputedStyle(el).color),
      "rgb(255, 255, 255)",
    );
    await page.locator(".app-topbar-context .inline-back-link").hover();
    assert.equal(
      await page
        .locator(".app-topbar-context .inline-back-link")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      "rgba(0, 0, 0, 0)",
    );
    await page.screenshot({
      path: `screenshots/redesign/fields/workspace-${width}.png`,
    });
    console.log(`PASS breadcrumb ${width}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/beranda", `/lowongan/${job.id}/analisis`]) {
    await page.goto(base + route);
    await page.locator("h1").first().waitFor();
    const header = page.locator(".app-topbar");
    assert.equal(
      await header
        .locator(".language-trigger:visible,.topbar-account-trigger:visible")
        .count(),
      0,
    );
    if (route.includes("/analisis")) {
      await page.locator(".score-card").waitFor();
      assert(await page.locator(".app-topbar-context").isVisible());
      assert(
        (
          await page
            .locator(".app-topbar-context .inline-back-link")
            .boundingBox()
        ).width <= 24,
      );
      assert(
        await page
          .locator(".app-topbar-context .shell-breadcrumb-separator")
          .isVisible(),
      );
      assert(
        await page.locator(".app-topbar-context .inline-back-link").isVisible(),
      );
      assert(
        (await page.locator(".shell-breadcrumb-current").innerText()).includes(
          job.title,
        ),
      );
      const current = await page
        .locator(".shell-breadcrumb-current")
        .evaluate((el) => ({
          height: el.getBoundingClientRect().height,
          font: parseFloat(getComputedStyle(el).fontSize),
        }));
      assert(current.height >= current.font * 1.5);
    }
    await page.getByRole("button", { name: "Buka navigasi utama" }).click();
    assert.equal(await page.locator(".sidebar .main-nav a:visible").count(), 0);
    await page.locator(".sidebar .language-trigger").click();
    await page.getByRole("menuitemradio", { name: "ENG" }).click();
    assert.equal(
      await page.evaluate(() => document.documentElement.lang),
      "en",
    );
    await page.locator(".sidebar .language-trigger").click();
    await page.getByRole("menuitemradio", { name: "IDN" }).click();
    await page.locator(".mobile-drawer-close").click();
    assert.equal(await page.evaluate(() => document.body.style.position), "");
    console.log(`PASS utility menu ${route}`);
  }
} finally {
  await browser.close();
}
