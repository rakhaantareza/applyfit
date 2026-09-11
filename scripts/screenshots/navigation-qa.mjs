import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { AUTH_STATE_PATH, DEFAULT_BASE_URL } from "./config.mjs";
import {
  configurePage,
  ensureDevelopmentServer,
  getBaseUrl,
  settleResponsiveLayout,
} from "./workflow.mjs";

const browser = await chromium.launch();
const output = "screenshots/redesign/navigation";
try {
  await mkdir(output, { recursive: true });
  const base = await ensureDevelopmentServer(getBaseUrl(DEFAULT_BASE_URL));
  for (const theme of ["light"]) {
    const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
    const page = await context.newPage();
    await configurePage(page);
    for (const [width, height] of [
      [390, 844],
      [360, 640],
      [667, 320],
      [768, 1024],
      [820, 650],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(base + "/portfolio-pengalaman");
      await page.locator(".evidence-row").first().waitFor();
      await settleResponsiveLayout(page);
      const sidebar = page.locator(".sidebar");
      if (width < 768) {
        const bottomNavigation = page.locator(".mobile-bottom-nav");
        assert.equal(await bottomNavigation.locator("a").count(), 4);
        assert.equal(
          await bottomNavigation
            .locator('[aria-current="page"]')
            .getAttribute("href"),
          "/portfolio-pengalaman",
        );
        await page.locator(".evidence-search-field input").focus();
        assert.equal(
          await page
            .locator(".evidence-search-field input")
            .evaluate((el) => getComputedStyle(el).outlineStyle),
          "none",
        );
        await page.evaluate(() => window.scrollTo(0, 400));
        const before = await page.evaluate(() => window.scrollY);
        await page.getByRole("button", { name: "Buka navigasi utama" }).click();
        await settleResponsiveLayout(page);
        const box = await sidebar.boundingBox();
        assert.equal(box.y, 0);
        assert.equal(Math.round(box.height), height);
        assert.equal(
          await page.locator("main").evaluate((el) => el.inert),
          true,
        );
        assert.equal(await bottomNavigation.evaluate((el) => el.inert), true);
        await page.keyboard.press("Shift+Tab");
        assert.equal(
          await page
            .locator(".mobile-menu-signout button")
            .last()
            .evaluate((el) => el === document.activeElement),
          true,
        );
        await page.keyboard.press("Tab");
        assert.equal(
          await page
            .locator(".mobile-drawer-close")
            .evaluate((el) => el === document.activeElement),
          true,
        );
        await sidebar.hover();
        await page.mouse.wheel(0, 800);
        await page.waitForTimeout(200);
        await page
          .locator(".mobile-menu-signout button")
          .last()
          .scrollIntoViewIfNeeded();
        const last = await page
          .locator(".mobile-menu-signout button")
          .last()
          .boundingBox();
        assert(last.y >= 0 && last.y + last.height <= height);
        const close = await page.locator(".mobile-drawer-close").boundingBox();
        assert(close.y >= 0 && close.y + close.height <= height);
        await page.screenshot({ path: `${output}/${theme}-${width}-menu.png` });
        await page.keyboard.press("Escape");
        assert.equal(await page.evaluate(() => window.scrollY), before);
        assert.equal(
          await page.locator("main").evaluate((el) => el.inert),
          false,
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Buka navigasi utama" })
            .evaluate((el) => el === document.activeElement),
          true,
        );
        await page.getByRole("button", { name: "Buka navigasi utama" }).click();
        await page
          .locator(".sidebar-backdrop")
          .click({ position: { x: width - 8, y: height / 2 } });
        assert.equal(await page.evaluate(() => window.scrollY), before);
        await page.getByRole("button", { name: "Buka navigasi utama" }).click();
        await sidebar.locator(".mobile-menu-profile").click();
        await page.waitForURL("**/profil-karier");
        assert.equal(
          await page.evaluate(() => document.body.style.position),
          "",
        );
        await page.getByRole("button", { name: "Buka navigasi utama" }).click();
        await page.setViewportSize({ width: 820, height: 900 });
        await settleResponsiveLayout(page);
        assert.equal(
          await page.evaluate(() => document.body.style.position),
          "",
        );
      } else {
        await page.screenshot({ path: `${output}/${theme}-${width}-rail.png` });
        await page.getByRole("button", { name: "Perluas sidebar" }).click();
        await settleResponsiveLayout(page);
        await page.screenshot({
          path: `${output}/${theme}-${width}-expanded.png`,
        });
        await page.getByRole("button", { name: "Ringkas sidebar" }).click();
      }
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      console.log(`PASS ${theme} ${width}x${height}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
