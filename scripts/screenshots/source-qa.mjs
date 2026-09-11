import assert from "node:assert/strict";
import { chromium } from "playwright";
import { AUTH_STATE_PATH, DEFAULT_BASE_URL } from "./config.mjs";
import { ensureDevelopmentServer } from "./workflow.mjs";
const browser = await chromium.launch();
try {
  const base = await ensureDevelopmentServer(DEFAULT_BASE_URL);
  const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
  const writes = [];
  await context.route("**/api/**", (r) => {
    if (["GET", "HEAD"].includes(r.request().method())) return r.continue();
    writes.push(r.request().postDataJSON());
    return r.fulfill({
      status: 400,
      json: { error: { message: "QA intercepted" } },
    });
  });
  const page = await context.newPage();
  await page.goto(base + "/lowongan/baru");
  await page.locator("input[name=title]").fill("QA role");
  await page.locator("input[name=company]").fill("QA company");
  await page.locator("textarea[name=rawDescription]").fill("QA description");
  await page.getByLabel("Sumber", { exact: true }).selectOption("custom");
  await page
    .getByLabel("Nama sumber", { exact: true })
    .fill("  Komunitas Alumni  ");
  await page.evaluate(() => {
    localStorage.setItem("applyfit-language", "en");
    window.dispatchEvent(new Event("storage"));
  });
  await page.getByLabel("Source name", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Source name", { exact: true }).inputValue(),
    "  Komunitas Alumni  ",
  );
  await page.locator(".new-job-form button[type=submit]").click();
  await page.getByText("QA intercepted", { exact: true }).waitFor();
  assert.equal(writes.at(-1).source, "Komunitas Alumni");
  await page.getByLabel("Source", { exact: true }).selectOption("LinkedIn");
  await page.locator(".new-job-form button[type=submit]").click();
  await page.getByText("QA intercepted", { exact: true }).waitFor();
  assert.equal(writes.at(-1).source, "LinkedIn");
  await page.route("**/api/workspace?scope=jobs", async (r) => {
    if (r.request().method() !== "GET") return r.fallback();
    const response = await r.fetch();
    const body = await response.json();
    body.data.jobs.forEach((item) => {
      item.source = "Komunitas Alumni";
    });
    await r.fulfill({ response, json: body });
  });
  await page.goto(base + "/lowongan");
  await page.locator(".job-info-edit-button").first().click();
  assert.equal(
    await page.getByLabel("Source", { exact: true }).inputValue(),
    "custom",
  );
  assert.equal(
    await page.getByLabel("Source name", { exact: true }).inputValue(),
    "Komunitas Alumni",
  );
  await page.locator(".job-info-editor button[type=submit]").click();
  await page.getByText("QA intercepted", { exact: true }).waitFor();
  assert.equal(writes.at(-1).source, "Komunitas Alumni");
  console.log(
    "PASS source payloads: preset, trimmed custom, preserved legacy custom, ID/EN draft retention. All writes intercepted.",
  );
} finally {
  await browser.close();
}
