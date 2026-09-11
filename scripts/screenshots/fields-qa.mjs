import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { AUTH_STATE_PATH, DEFAULT_BASE_URL } from "./config.mjs";
import { ensureDevelopmentServer, getBaseUrl } from "./workflow.mjs";
const browser = await chromium.launch();
const output = "screenshots/redesign/fields";
try {
  await mkdir(output, { recursive: true });
  const base = await ensureDevelopmentServer(getBaseUrl(DEFAULT_BASE_URL));
  const context = await browser.newContext();
  const page = await context.newPage();
  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "/login");
    await page.locator("#login-password").fill("example-only");
    for (const selector of ["#login-email", "#login-password"]) {
      await page.locator(selector).focus();
      const styles = await page.locator(selector).evaluate((el) => {
        const s = getComputedStyle(el);
        const p = getComputedStyle(el.parentElement);
        return {
          border: s.borderTopWidth,
          outline: s.outlineStyle,
          shadow: s.boxShadow,
          outer: p.borderTopWidth,
        };
      });
      assert.deepEqual(styles, {
        border: "0px",
        outline: "none",
        shadow: "none",
        outer: "1px",
      });
    }
    await page.screenshot({ path: `${output}/login-${width}.png` });
    const trigger = page.getByRole("button", { name: "Bahasa / Language" });
    await page.waitForFunction(
      () => !document.querySelector(".language-trigger")?.disabled,
    );
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await page.getByRole("menuitemradio", { name: "IDN" }).waitFor();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.documentElement.lang === "en");
    assert.equal(
      await trigger.evaluate((el) => el === document.activeElement),
      true,
    );
    await trigger.click();
    await page.keyboard.press("Escape");
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    console.log(`PASS fields and language keyboard ${width}`);
  }
  const auth = await browser.newContext({
    storageState: AUTH_STATE_PATH,
    viewport: { width: 390, height: 844 },
  });
  const app = await auth.newPage();
  await app.goto(base + "/beranda");
  await app.locator(".summary-greeting").waitFor();
  await app.getByRole("button", { name: "Buka navigasi utama" }).click();
  await app.locator(".sidebar .language-trigger").click();
  await app.screenshot({ path: `${output}/mobile-language.png` });
  const menu = await app.locator(".app-topbar-mobile-menu").boundingBox();
  const language = await app.locator(".language-trigger").boundingBox();
  assert(menu);
  assert(language);
  assert.equal(
    await app.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  console.log("PASS mobile header placement");
} finally {
  await browser.close();
}
