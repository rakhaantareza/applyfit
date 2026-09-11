import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { AUTH_STATE_PATH, DEFAULT_BASE_URL } from "./config.mjs";
import {
  configurePage,
  ensureDevelopmentServer,
  getBaseUrl,
  resolveScreenshotJob,
  settleResponsiveLayout,
} from "./workflow.mjs";

const browser = await chromium.launch();
const output = "screenshots/redesign/brand/states";
try {
  await mkdir(output, { recursive: true });
  const base = await ensureDevelopmentServer(getBaseUrl(DEFAULT_BASE_URL));
  const context = await browser.newContext({
    storageState: AUTH_STATE_PATH,
    colorScheme: "dark",
  });
  const job = await resolveScreenshotJob(context.request, base);
  const page = await context.newPage();
  await configurePage(page);
  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "/portfolio-pengalaman");
    await page.locator(".evidence-row").first().waitFor();
    await chooseLanguage(page, "ENG");
    const filter = page.locator(".evidence-filter-field select").first();
    await filter.selectOption("Proyek");
    assert.equal(await filter.inputValue(), "Proyek");
    assert((await page.locator(".evidence-row").count()) > 0);
    assert(
      (await page.locator(".evidence-type-label").allTextContents()).every(
        (text) => text === "Project",
      ),
    );
    await filter.selectOption("Semua");
    await page
      .getByRole("button", { name: "Add portfolio item", exact: true })
      .click();
    const draft = page
      .locator(".evidence-editor input:not([type=checkbox])")
      .first();
    await draft.fill("Proyek pribadi — jangan diterjemahkan");
    await chooseLanguage(page, "IDN");
    assert.equal(
      await draft.inputValue(),
      "Proyek pribadi — jangan diterjemahkan",
    );
    await page.getByRole("button", { name: "Batal", exact: true }).click();
    await chooseLanguage(page, "ENG");
    await page.reload();
    await page
      .getByRole("button", { name: "Add portfolio item", exact: true })
      .waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.lang),
      "en",
    );
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).colorScheme,
      ),
      "light",
    );

    await page.goto(base + `/lowongan/${job.id}/analisis`);
    await page.locator(".score-card").waitFor();
    await page.getByLabel("Filter requirement priority").selectOption("Wajib");
    assert.equal(
      await page.getByLabel("Filter requirement priority").inputValue(),
      "Wajib",
    );
    await page
      .getByLabel("Filter requirement priority")
      .selectOption("Semua prioritas");
    await page.locator(".job-switcher").click();
    await page
      .getByPlaceholder("Search roles or companies")
      .fill("no-matching-job");
    await settleResponsiveLayout(page);
    const popup = await page.locator(".job-popover").boundingBox();
    assert(
      popup.x >= 0 && popup.x + popup.width <= width + 1,
      "Job picker stays in viewport",
    );
    await page.screenshot({
      path: `${output}/en-${width}-job-picker.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    console.log(`PASS language, draft, filters, job picker ${width}`);
  }

  // Empty fixtures only intercept read responses; no application data is changed.
  await page.route("**/api/workspace?scope=profile", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.data.profile = null;
    body.data.skills = [];
    await route.fulfill({ response, json: body });
  });
  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "/profil-karier");
    await page.locator(".skill-empty-state").waitFor();
    assert.equal(
      await page
        .locator(".skill-empty-state")
        .evaluate((el) => getComputedStyle(el).borderTopWidth),
      "0px",
    );
    await page.screenshot({
      path: `${output}/en-${width}-empty-profile.png`,
      fullPage: true,
    });
    await page.goto(base + "/portfolio-pengalaman");
    await page.locator(".evidence-row").first().waitFor();
    await page
      .getByPlaceholder("Search titles, skills, or sources")
      .fill("no-result-fixture");
    await page.locator(".evidence-empty-state").waitFor();
    assert.equal(
      await page
        .locator(".evidence-empty-state")
        .evaluate((el) => getComputedStyle(el).borderTopWidth),
      "0px",
    );
    await page.screenshot({
      path: `${output}/en-${width}-empty-search.png`,
      fullPage: true,
    });
    console.log(`PASS empty collections ${width}`);
  }
  await page.route("**/api/workspace?scope=portfolio", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.data.evidences = [];
    await route.fulfill({ response, json: body });
  });
  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "/portfolio-pengalaman");
    await page
      .getByText("No portfolio or experience yet", { exact: true })
      .waitFor();
    assert.equal(await page.locator(".evidence-row").count(), 0);
    await page.screenshot({
      path: `${output}/en-${width}-empty-portfolio.png`,
      fullPage: true,
    });
    console.log(`PASS empty portfolio ${width}`);
  }
  const anonymous = await browser.newContext({ colorScheme: "dark" });
  const authPage = await anonymous.newPage();
  await configurePage(authPage);
  for (const width of [390, 820, 1440]) {
    await authPage.setViewportSize({ width, height: 900 });
    for (const route of [
      "/login",
      "/daftar",
      "/lupa-kata-sandi",
      "/reset-kata-sandi",
    ]) {
      await authPage.goto(base + route);
      await chooseLanguage(authPage, "ENG");
      await authPage.waitForFunction(
        () => document.documentElement.lang === "en",
      );
      if (route === "/login")
        await authPage
          .getByRole("heading", { name: "Sign in to ApplyFit" })
          .waitFor();
      await settleResponsiveLayout(authPage);
      assert.equal(
        await authPage.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      assert.equal(
        await authPage.evaluate(
          () => getComputedStyle(document.documentElement).colorScheme,
        ),
        "light",
      );
      await authPage.screenshot({
        path: `${output}/en-${width}-${route.slice(1)}.png`,
        fullPage: true,
      });
    }
    console.log(`PASS auth ${width}`);
  }
} finally {
  await browser.close();
}

async function chooseLanguage(page, label) {
  await settleResponsiveLayout(page);
  const inDrawer =
    page.viewportSize().width < 768 &&
    (await page.locator(".sidebar").count()) > 0;
  if (inDrawer) {
    await page.locator(".app-topbar-mobile-menu").click();
    await page.locator(".sidebar.sidebar-mobile-open").waitFor();
  }
  await page.locator(".language-trigger:visible").click();
  await page.getByRole("menuitemradio", { name: label }).click();
  if (inDrawer) await page.locator(".mobile-drawer-close").click();
}
