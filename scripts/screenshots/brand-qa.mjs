import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import {
  AUTH_STATE_PATH,
  DEFAULT_BASE_URL,
  SCREENSHOT_ROUTES,
  buildJobScreenshotRoutes,
} from "./config.mjs";
import {
  configurePage,
  ensureDevelopmentServer,
  getBaseUrl,
  openAuthenticatedRoute,
  resolveScreenshotJob,
  settleResponsiveLayout,
} from "./workflow.mjs";

const output = "screenshots/redesign/brand";
const report = [];
const browser = await chromium.launch();
try {
  await mkdir(output, { recursive: true });
  const base = await ensureDevelopmentServer(getBaseUrl(DEFAULT_BASE_URL));
  const context = await browser.newContext({
    storageState: AUTH_STATE_PATH,
    colorScheme: "dark",
  });
  const job = await resolveScreenshotJob(context.request, base);
  const routes = [
    "/beranda",
    "/profil-karier",
    "/portfolio-pengalaman",
    "/lowongan",
    "/pengaturan",
    "/lowongan/baru",
    "/contoh-perhitungan",
    ...["", "/persyaratan", "/cocokkan-profil", "/analisis"].map(
      (part) => `/lowongan/${job.id}${part}`,
    ),
  ];
  const configuredRoutes = [
    ...SCREENSHOT_ROUTES,
    ...buildJobScreenshotRoutes(job.id),
  ];
  const page = await context.newPage();
  await configurePage(page);
  for (const language of process.argv.includes("--audit")
    ? ["en"]
    : ["id", "en"]) {
    await page.addInitScript((value) => {
      localStorage.setItem("applyfit-language", value);
      localStorage.setItem("applyfit-appearance", "dark");
    }, language);
    for (const width of process.argv.includes("--audit")
      ? [1440]
      : [1440, 1920, 1024, 820, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await openAuthenticatedRoute(
          page,
          base,
          configuredRoutes.find((entry) => entry.path === route) ?? {
            path: route,
            label: route,
            readySelector: route === "/lowongan/baru" ? ".new-job-form" : "h1",
          },
        );
        await settleResponsiveLayout(page);
        const state = await page.evaluate(() => ({
          text: document.body.innerText,
          lang: document.documentElement.lang,
          overflow: document.documentElement.scrollWidth > innerWidth,
          background: getComputedStyle(document.body).backgroundColor,
          errors: [...document.querySelectorAll('[role="alert"]')].map(
            (el) => el.textContent,
          ),
        }));
        assert.equal(state.lang, language);
        assert.equal(
          state.overflow,
          false,
          `${language} ${width} ${route} overflow`,
        );
        await page.screenshot({
          path: `${output}/${language}-${width}-${route.split("/").pop()}.png`,
          fullPage: true,
        });
        report.push({ language, width, route, ...state });
        console.log(`PASS ${language} ${width} ${route}`);
      }
    }
  }
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
