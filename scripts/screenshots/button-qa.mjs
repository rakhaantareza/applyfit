import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { AUTH_STATE_PATH, DEFAULT_BASE_URL } from "./config.mjs";
import { ensureDevelopmentServer, resolveScreenshotJob } from "./workflow.mjs";
const browser = await chromium.launch();
let checked = 0;
try {
  const base = await ensureDevelopmentServer(DEFAULT_BASE_URL);
  const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
  const job = await resolveScreenshotJob(context.request, base);
  const page = await context.newPage();
  await mkdir("screenshots/buttons", { recursive: true });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, path, ready] of [
      ["profile", "/profil-karier", ".career-edit-button"],
      ["portfolio", "/portfolio-pengalaman", ".evidence-row"],
      ["jobs", "/lowongan", ".job-info-edit-button"],
      ["detail", `/lowongan/${job.id}`, ".job-description-edit-button"],
      [
        "requirements",
        `/lowongan/${job.id}/persyaratan`,
        ".requirement-edit-button",
      ],
    ]) {
      await page.goto(base + path);
      await page.locator(ready).first().waitFor();
      if (name === "profile")
        await page.locator(".skill-row-menu summary").first().click();
      const controls = page.locator(".ui-record-action:visible");
      for (let i = 0; i < (await controls.count()); i++) {
        const c = controls.nth(i);
        await page.mouse.move(0, 0);
        await page.waitForTimeout(180);
        const before = await c.evaluate((e) => {
          const s = getComputedStyle(e);
          return { bg: s.backgroundColor, color: s.color };
        });
        await c.hover();
        await page.waitForTimeout(190);
        const after = await c.evaluate((e) => {
          const s = getComputedStyle(e),
            r = e.getBoundingClientRect();
          return {
            bg: s.backgroundColor,
            color: s.color,
            width: r.width,
            height: r.height,
          };
        });
        assert.equal(before.bg, "rgba(0, 0, 0, 0)");
        assert.equal(after.bg, before.bg);
        assert.notEqual(after.color, before.color);
        assert(
          after.width >= 43 && after.height >= 43,
          `${name}: ${after.width}x${after.height}`,
        );
        checked++;
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `screenshots/buttons/${width}-${name}.png`,
      });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      console.log(`PASS ${width} ${name}`);
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  const c = page.locator(".ui-record-action").first();
  await c.hover();
  assert.equal(
    await c.locator("svg").evaluate((e) => getComputedStyle(e).transform),
    "none",
  );
  await c.focus();
  assert.equal(
    await c.evaluate((e) => getComputedStyle(e).outlineStyle),
    "solid",
  );
  console.log(
    `PASS ${checked} hover checks; transparent backgrounds, color feedback, 44px targets, reduced motion and keyboard focus.`,
  );
} finally {
  await browser.close();
}
