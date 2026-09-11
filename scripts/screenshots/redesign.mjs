import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  AUTH_STATE_PATH,
  buildJobScreenshotRoutes,
  DEFAULT_BASE_URL,
  SCREENSHOT_ROUTES,
  UNAUTHENTICATED_SCREENSHOT_ROUTES,
  SCREENSHOT_ROOT,
} from "./config.mjs";
import {
  configurePage,
  ensureDevelopmentServer,
  getBaseUrl,
  openAuthenticatedRoute,
  openUnauthenticatedRoute,
  resolveScreenshotJob,
  settleResponsiveLayout,
} from "./workflow.mjs";

// Visual and interaction QA uses existing account data. Editor checks cancel;
// no profile, portfolio, requirement, or account mutations are submitted.
const output = path.join(SCREENSHOT_ROOT, "redesign", "comfortable");
const viewports = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 1024, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];
const report = [];
const interactionsOnly = process.argv.includes("--interactions-only");
const refinementsOnly = process.argv.includes("--refinements-only");
const browser = await chromium.launch({ headless: true });
try {
  await mkdir(output, { recursive: true });
  const base = await ensureDevelopmentServer(getBaseUrl(DEFAULT_BASE_URL));
  const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
  const job = await resolveScreenshotJob(context.request, base);
  const allRoutes = [
    ...SCREENSHOT_ROUTES,
    ...buildJobScreenshotRoutes(job.id),
    {
      label: "Tambah lowongan",
      slug: "new-job",
      path: "/lowongan/baru",
      readySelector: ".new-job-form",
    },
    {
      label: "Panduan",
      slug: "fit-guide",
      path: "/contoh-perhitungan",
      readySelector: "h1",
    },
  ];
  const routes = refinementsOnly
    ? allRoutes.filter((route) =>
        [
          "cocokkan-profil",
          "persyaratan",
          "account-settings",
          "new-job",
          "fit-guide",
        ].includes(route.slug),
      )
    : allRoutes;
  for (const theme of ["light"]) {
    const page = await context.newPage();
    await configurePage(page);
    for (const route of interactionsOnly ? [] : routes) {
      await page.setViewportSize(viewports[0]);
      await openAuthenticatedRoute(page, base, route);
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await settleResponsiveLayout(page, route.label);
        await assertLayout(page);
        await page.screenshot({
          path: path.join(
            output,
            `${theme}-${route.slug}-${viewport.width}.png`,
          ),
          fullPage: true,
        });
        report.push(`${theme} ${route.slug} ${viewport.width}: layout passed`);
      }
    }
    await checkInteractions(page, base, job.id);
    report.push(
      `${theme}: editors, filters, disclosures, mobile navigation passed`,
    );
    await page.close();
  }
  await context.close();

  for (const theme of interactionsOnly ? [] : ["light"]) {
    const anonymous = await browser.newContext({ colorScheme: theme });
    const page = await anonymous.newPage();
    await configurePage(page);
    for (const route of UNAUTHENTICATED_SCREENSHOT_ROUTES) {
      await page.setViewportSize(viewports[0]);
      await openUnauthenticatedRoute(page, base, route);
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await settleResponsiveLayout(page, route.label);
        await assertLayout(page);
        await page.screenshot({
          path: path.join(
            output,
            `${theme}-${route.slug}-${viewport.width}.png`,
          ),
          fullPage: true,
        });
        report.push(`${theme} ${route.slug} ${viewport.width}: layout passed`);
      }
    }
    await anonymous.close();
  }
  await writeFile(
    path.join(
      output,
      refinementsOnly
        ? "refinements-report.json"
        : interactionsOnly
          ? "interactions-report.json"
          : "report.json",
    ),
    JSON.stringify(report, null, 2),
  );
  console.log(
    `${report.length} QA checks passed. Screenshots: ${path.relative(process.cwd(), output)}`,
  );
} catch (error) {
  // Playwright request traces may contain auth cookies; do not print them.
  console.error(
    String(error.message).startsWith("locator.")
      ? error.message
      : String(error.message).split("Call log:")[0],
  );
  for (const context of browser.contexts())
    for (const page of context.pages())
      await page
        .screenshot({
          path: path.join(output, "qa-failure.png"),
          fullPage: true,
        })
        .catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}

async function assertLayout(page) {
  const violations = await page.evaluate(() => {
    const issues = [];
    if (document.documentElement.scrollWidth > innerWidth)
      issues.push("Horizontal overflow");
    for (const element of document.querySelectorAll(
      "main button, main input, main select, main textarea, main .ui-text-cta",
    )) {
      if (!element.checkVisibility()) continue;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      if (rect.left < -1 || rect.right > innerWidth + 1)
        issues.push(
          `${element.tagName} outside viewport: ${element.textContent?.trim().slice(0, 50)}`,
        );
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        const box = parent.getBoundingClientRect();
        if (
          ["hidden", "clip"].includes(style.overflowY) &&
          (rect.top < box.top - 1 || rect.bottom > box.bottom + 1)
        ) {
          issues.push(`Clipped control in ${parent.className}`);
          break;
        }
        parent = parent.parentElement;
      }
    }
    return issues;
  });
  assert.deepEqual(
    violations,
    [],
    `${new URL(page.url()).pathname}: ${violations.join(", ")}`,
  );
}

async function checkInteractions(page, base, jobId) {
  for (const width of [1440, 768, 390]) {
    console.log(`Interactions: ${width}px`);
    await page.setViewportSize({ width, height: 900 });
    console.log("Profile editors and navigation");
    await page.goto(`${base}/profil-karier`);
    console.log("Open skill");
    await page.locator(".skill-add-button").click();
    await page
      .locator(".skill-editor input:not([type=checkbox])")
      .first()
      .waitFor({ state: "visible" });
    await assertLayout(page);
    await page
      .locator(".skill-editor")
      .getByRole("button", { name: "Batal", exact: true })
      .click();
    console.log("Open direction");
    await page.locator(".career-edit-button").click();
    await page
      .locator(".career-direction-form input")
      .first()
      .waitFor({ state: "visible" });
    await assertLayout(page);
    await page
      .locator(".career-direction-form")
      .getByRole("button", { name: "Batal", exact: true })
      .click();

    if (width === 390) {
      console.log("Open mobile menu");
      await page.getByRole("button", { name: "Buka navigasi utama" }).click();
      await page.locator(".sidebar-mobile-open").waitFor({ state: "visible" });
      console.log("Close mobile menu");
      await page
        .locator(".sidebar-mobile-heading")
        .getByRole("button", { name: "Tutup navigasi utama" })
        .click();
    } else if (width === 768) {
      await page.locator(".sidebar-context-toggle").click();
      await settleResponsiveLayout(page, "Sidebar toggle");
      await assertLayout(page);
      await page.locator(".sidebar-context-toggle").click();
    }

    if (width === 1440) {
      assert.equal(
        await page
          .locator(".global-navigation a[aria-current=page]")
          .innerText(),
        "Profil",
      );
      await page
        .locator(".global-navigation")
        .getByRole("link", { name: "Portfolio & Pengalaman", exact: true })
        .click();
      await page.waitForURL("**/portfolio-pengalaman");
    } else {
      await page.goto(`${base}/portfolio-pengalaman`);
    }
    console.log("Portfolio editor and filters");
    const description = page.locator(".expandable-text button").first();
    if (await description.count()) {
      await description.click();
      assert.equal(await description.getAttribute("aria-expanded"), "true");
      await assertLayout(page);
      await description.click();
    }
    await page.locator(".evidence-add-button").click();
    await page
      .locator(".evidence-editor input")
      .first()
      .waitFor({ state: "visible" });
    await assertLayout(page);
    await page
      .locator(".evidence-editor")
      .getByRole("button", { name: "Batal", exact: true })
      .click();
    const search = page.locator(".evidence-search-field input");
    await search.fill("no-results-applyfit-qa");
    assert.equal(await page.locator(".evidence-row").count(), 0);
    await search.fill("");
    assert.ok((await page.locator(".evidence-row").count()) > 0);

    console.log("Matching disclosures");
    await page.goto(`${base}/lowongan/${jobId}/cocokkan-profil`);
    await page.locator(".mapping-resolved > summary").click();
    await page
      .locator(".mapping-resolved .mapping-row")
      .first()
      .waitFor({ state: "visible" });
    await assertLayout(page);
    await page.locator(".mapping-resolved > summary").click();

    console.log("Analysis details and filters");
    await page.goto(`${base}/lowongan/${jobId}/analisis`);
    await page.locator(".requirement-summary").first().click();
    await page
      .locator("details[open] .requirement-expanded")
      .waitFor({ state: "visible" });
    await assertLayout(page);
    await page.getByLabel("Filter status persyaratan").selectOption("Missing");
    assert.equal(await page.locator(".requirement-summary").count(), 0);
    await page
      .getByRole("button", { name: "Reset filter", exact: true })
      .click();
  }
}
