import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { AUTH_STATE_PATH, DEFAULT_BASE_URL } from "./config.mjs";
import { ensureDevelopmentServer, resolveScreenshotJob } from "./workflow.mjs";

// Capture visual styles without submitting changes to the demo workspace.
const snapshot =
  process.argv
    .find((value) => value.startsWith("--snapshot="))
    ?.split("=")[1] ?? "current";
assert(["before", "after", "current"].includes(snapshot));
const directory = `screenshots/ui-qa/${snapshot}`;
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const results = {};
try {
  const base = await ensureDevelopmentServer(DEFAULT_BASE_URL);
  const context = await browser.newContext({
    storageState: AUTH_STATE_PATH,
    reducedMotion: "reduce",
  });
  await context.route("**/api/**", (route) => {
    const request = route.request();
    const isRead =
      ["GET", "HEAD", "OPTIONS"].includes(request.method()) ||
      /\/api\/fit-score\//.test(request.url());
    return isRead
      ? route.continue()
      : route.fulfill({ status: 400, json: { error: "Read-only visual QA" } });
  });
  const job = await resolveScreenshotJob(context.request, base);
  const routes = [
    ["summary", "/beranda", ".summary-greeting"],
    ["profile", "/profil-karier", ".career-profile-hero"],
    ["portfolio", "/portfolio-pengalaman", ".evidence-row"],
    ["jobs", "/lowongan", ".job-library-row"],
    ["new-job", "/lowongan/baru", ".new-job-form"],
    ["settings", "/pengaturan", ".account-identity-card"],
    ["detail", `/lowongan/${job.id}`, ".job-detail-hero"],
    [
      "requirements",
      `/lowongan/${job.id}/persyaratan`,
      ".requirement-review-list article",
    ],
    ["matching", `/lowongan/${job.id}/cocokkan-profil`, ".mapping-row"],
    ["analysis", `/lowongan/${job.id}/analisis`, ".requirements-list"],
    ["guide", "/contoh-perhitungan", "h1"],
  ];
  const page = await context.newPage();
  for (const width of (process.env.QA_WIDTHS ?? "390,768,1024,1440")
    .split(",")
    .map(Number)) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, path, ready] of routes) {
      await page.goto(base + path);
      await page.locator(ready).first().waitFor({ state: "attached" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(600);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${width} ${name}: overflow`,
      );
      results[`${width}-${name}`] = await page.evaluate(() => {
        const properties = [
          "display",
          "position",
          "width",
          "height",
          "padding",
          "margin",
          "font-family",
          "font-size",
          "font-weight",
          "line-height",
          "color",
          "background-color",
          "border-top-width",
          "border-top-color",
          "border-radius",
          "gap",
          "grid-template-columns",
          "box-shadow",
        ];
        return [...document.querySelectorAll("main *")]
          .filter(
            (element) =>
              element.getClientRects().length && !element.closest("svg"),
          )
          .map((element) => {
            const style = getComputedStyle(element);
            return [
              element.tagName,
              ...properties.map((property) => style.getPropertyValue(property)),
            ];
          });
      });
      await page.screenshot({
        path: `${directory}/${width}-${name}.png`,
        fullPage: true,
      });
      console.log(`PASS ${width} ${name}`);
    }
  }
  await writeFile(`${directory}/computed.json`, JSON.stringify(results));
  if (snapshot === "after") {
    const before = JSON.parse(
      await readFile("screenshots/ui-qa/before/computed.json", "utf8"),
    );
    const changed = Object.keys(results).filter(
      (key) => JSON.stringify(results[key]) !== JSON.stringify(before[key]),
    );
    await writeFile(
      `${directory}/changes.json`,
      JSON.stringify(changed, null, 2),
    );
    assert.deepEqual(
      changed,
      [],
      "Computed styles changed; review before accepting cleanup.",
    );
  }
} finally {
  await browser.close();
}
