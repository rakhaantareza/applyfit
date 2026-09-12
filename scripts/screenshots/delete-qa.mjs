import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { AUTH_STATE_PATH, DEFAULT_BASE_URL } from "./config.mjs";
import { ensureDevelopmentServer, resolveScreenshotJob } from "./workflow.mjs";
const browser = await chromium.launch();
try {
  const base = await ensureDevelopmentServer(DEFAULT_BASE_URL);
  const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
  const job = await resolveScreenshotJob(context.request, base);
  await context.route("**/api/**", (r) =>
    ["GET", "HEAD"].includes(r.request().method()) ? r.continue() : r.abort(),
  );
  const page = await context.newPage();
  await mkdir("screenshots/delete", { recursive: true });
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, path, container, trigger] of [
      [
        "skill",
        "/profil-karier",
        ".skill-delete-confirmation",
        ".skill-row-menu .ui-record-action--delete",
      ],
      [
        "portfolio",
        "/portfolio-pengalaman",
        ".evidence-delete-confirmation",
        ".evidence-row-actions .ui-record-action--delete",
      ],
      [
        "requirements",
        `/lowongan/${job.id}/persyaratan`,
        ".requirement-delete-confirmation",
        ".requirement-row-actions .ui-record-action--delete",
      ],
      ["job", "/lowongan", ".job-delete-dialog", ".job-delete-button"],
    ]) {
      await page.goto(base + path);
      if (name === "skill")
        await page.locator(".skill-row-menu summary").first().click();
      await page.locator(trigger).first().click();
      const popup = page.locator(container);
      await popup.waitFor();
      const buttons = popup.locator("button");
      const a = await buttons.first().boundingBox(),
        b = await buttons.last().boundingBox();
      assert(
        Math.abs(a.y - b.y) < 2,
        `${width} ${name}: buttons must share a row`,
      );
      assert(a.height >= 43 && b.height >= 43);
      for (const button of [buttons.first(), buttons.last()]) {
        await button.hover();
        const style = await button.evaluate((e) => {
          const s = getComputedStyle(e);
          return {
            font: parseFloat(s.fontSize),
            color: s.color,
            bg: s.backgroundColor,
            underline: s.textDecorationLine,
          };
        });
        assert(style.font >= 13);
        assert.notEqual(style.color, style.bg);
        assert.equal(style.underline, "none");
      }
      await popup.screenshot({
        path: `screenshots/delete/${width}-${name}.png`,
      });
      await buttons.first().click();
      await popup.waitFor({ state: "hidden" });
      console.log(`PASS ${width} ${name}`);
    }
  }
} finally {
  await browser.close();
}
