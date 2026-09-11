import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { AUTH_STATE_PATH, DEFAULT_BASE_URL } from "./config.mjs";
import {
  configurePage,
  ensureDevelopmentServer,
  resolveScreenshotJob,
  settleResponsiveLayout,
} from "./workflow.mjs";
const out = "screenshots/refinement";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const report = [];
try {
  const base = await ensureDevelopmentServer(DEFAULT_BASE_URL);
  const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
  // No writes from this QA may reach the server.
  await context.route("**/api/**", (route) =>
    ["GET", "HEAD"].includes(route.request().method()) ||
    /\/api\/fit-score\/(summary|requirements)$/.test(
      new URL(route.request().url()).pathname,
    )
      ? route.continue()
      : route.fulfill({
          status: 400,
          json: { error: { message: "QA: submission intercepted" } },
        }),
  );
  const job = await resolveScreenshotJob(context.request, base);
  const page = await context.newPage();
  await configurePage(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const routes = [
    ["summary", "/beranda", ".summary-greeting"],
    ["profile", "/profil-karier", ".career-profile-hero"],
    ["portfolio", "/portfolio-pengalaman", ".evidence-row"],
    ["jobs", "/lowongan", ".job-library-row"],
    ["new-job", "/lowongan/baru", ".new-job-form"],
    ["settings", "/pengaturan", ".account-profile-form"],
    ["detail", `/lowongan/${job.id}`, ".job-detail-hero"],
    [
      "requirements",
      `/lowongan/${job.id}/persyaratan`,
      ".requirement-review-list article",
    ],
    ["analysis", `/lowongan/${job.id}/analisis`, ".requirements-list"],
  ];
  for (const width of [360, 390, 768, 820, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, path, ready] of routes) {
      await page.goto(base + path);
      await page.locator(ready).first().waitFor();
      await inspect(name);
      if (name === "jobs") {
        await page
          .getByLabel("Cari lowongan", { exact: true })
          .fill("no-matching-job-fixture");
        await page.locator(".jobs-filter-empty").waitFor();
        await inspect("jobs-search-empty");
        await page
          .getByRole("button", { name: "Reset filter", exact: true })
          .click();
        assert((await page.locator(".job-library-row").count()) > 0);
        await page.getByLabel("Filter tahap lowongan").selectOption("review");
        assert(
          (await page.locator(".job-stage").allTextContents()).every(
            (t) => t === "Persyaratan tersedia",
          ),
        );
      }
      if (name === "new-job") {
        const source = page.getByLabel("Sumber", { exact: true });
        await source.selectOption("custom");
        await page
          .getByLabel("Nama sumber", { exact: true })
          .fill("Komunitas desain");
        assert.equal(
          await page.locator("input[name=source]").inputValue(),
          "Komunitas desain",
        );
        await source.selectOption("LinkedIn");
        assert.equal(
          await page.locator("input[name=source]").inputValue(),
          "LinkedIn",
        );
        await source.selectOption("custom");
        assert.equal(
          await page.getByLabel("Nama sumber", { exact: true }).inputValue(),
          "Komunitas desain",
        );
        await inspect("source-custom");
      }
      if (name === "detail" || name === "jobs") {
        for (const [button, form, label] of [
          [".job-info-edit-button", ".job-info-editor", "info-editor"],
          [
            ".job-description-edit-button",
            ".job-description-editor",
            "description-editor",
          ],
          [".job-delete-button", ".job-delete-dialog", "delete-dialog"],
        ]) {
          if ((name === "detail") !== (label === "description-editor"))
            continue;
          await page.locator(button).first().click();
          await inspect(label);
          await page
            .locator(form)
            .getByRole("button", { name: "Batal", exact: true })
            .click();
        }
      }
      if (name === "requirements") {
        await page.locator(".requirement-edit-button").first().click();
        await inspect("requirement-editor");
        await page
          .locator(".requirement-editor")
          .getByRole("button", { name: "Batal", exact: true })
          .click();
        await page.locator(".requirement-delete-button").first().click();
        await inspect("requirement-delete");
        await page
          .locator(".requirement-delete-confirmation")
          .getByRole("button", { name: "Batal", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Pilih & gabungkan", exact: true })
          .first()
          .click();
        await inspect("requirement-selection");
      }
      if (name === "analysis") {
        const statuses = await page
          .locator(".requirements-list .status-badge")
          .evaluateAll((es) => es.map((e) => e.classList.contains("missing")));
        const firstMissing = statuses.indexOf(true);
        assert(
          firstMissing < 0 || statuses.slice(firstMissing).every(Boolean),
          "Unmatched requirements must be last",
        );
        await page
          .getByLabel("Filter status persyaratan")
          .selectOption("Missing");
        await inspect("analysis-missing");
      }
    }
    await page.route("**/api/workspace?scope=jobs", (r) =>
      r.fulfill({ json: { data: { jobs: [] } } }),
    );
    await page.goto(base + "/lowongan");
    await page.locator(".jobs-zero-state").waitFor();
    await inspect("jobs-empty");
    await page.unroute("**/api/workspace?scope=jobs");
    await page.route("**/api/workspace?scope=portfolio", (r) =>
      r.fulfill({ json: { data: { evidences: [], skills: [] } } }),
    );
    await page.goto(base + "/portfolio-pengalaman");
    await page.locator(".evidence-empty-state").waitFor();
    await inspect("portfolio-empty");
    await page.unroute("**/api/workspace?scope=portfolio");
    async function inspect(name) {
      await settleResponsiveLayout(page, name);
      const overflow = await page.evaluate(() => {
        const bad = [];
        if (document.documentElement.scrollWidth > innerWidth + 1)
          bad.push("document");
        for (const e of document.querySelectorAll(
          "button,input:not([type=hidden]),select,textarea,a.ui-button",
        )) {
          if (!e.checkVisibility() || e.closest("[inert]")) continue;
          const r = e.getBoundingClientRect();
          if (r.width && r.height && (r.left < -1 || r.right > innerWidth + 1))
            bad.push(
              e.getAttribute("aria-label") ||
                e.textContent?.trim().slice(0, 50) ||
                e.tagName,
            );
        }
        return bad;
      });
      await page.screenshot({
        path: `${out}/${width}-${name}.png`,
        fullPage: true,
      });
      report.push({ width, name, overflow });
      assert.deepEqual(overflow, [], `${width} ${name}`);
      console.log(`PASS ${width} ${name}`);
    }
  }
  assert.deepEqual(errors, [], "No browser runtime errors");
} finally {
  await writeFile(out + "/report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
