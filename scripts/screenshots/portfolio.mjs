import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  AUTH_STATE_PATH,
  DEFAULT_BASE_URL,
  PROJECT_ROOT,
  SCREENSHOT_ROOT,
  SCREENSHOT_ROUTES,
} from "./config.mjs";
import {
  ScreenshotWorkflowError,
  assertExpectedPath,
  configurePage,
  ensureDevelopmentServer,
  errorMessage,
  expiredStateError,
  fileExists,
  getBaseUrl,
  openAuthenticatedRoute,
  settleResponsiveLayout,
} from "./workflow.mjs";

const PORTFOLIO_VIEWPORT_WIDTH = 1440;
const INITIAL_VIEWPORT_HEIGHT = 1200;
const DEVICE_SCALE_FACTOR = 2;
const APPROVED_CAPTURE_HEIGHT = 1106;
const MIN_REGION_BOTTOM_PADDING = 16;
const PLUS_JAKARTA_FONT_PATH = path.join(
  PROJECT_ROOT,
  "node_modules",
  "@fontsource-variable",
  "plus-jakarta-sans",
  "files",
  "plus-jakarta-sans-latin-wght-normal.woff2",
);
const OUTPUT_PATH = path.join(
  SCREENSHOT_ROOT,
  "portfolio",
  "applyfit-featured.png",
);

let browser;
let context;

try {
  const configuredBaseUrl = getBaseUrl(DEFAULT_BASE_URL);
  const baseUrl = await ensureDevelopmentServer(configuredBaseUrl);
  if (!(await fileExists(AUTH_STATE_PATH))) throw expiredStateError();

  const fitScoreRoute = SCREENSHOT_ROUTES.find(
    (route) => route.path === "/skor-kecocokan",
  );
  if (!fitScoreRoute) {
    throw new ScreenshotWorkflowError("The Fit Score screenshot route is not configured.");
  }

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    storageState: AUTH_STATE_PATH,
    viewport: {
      width: PORTFOLIO_VIEWPORT_WIDTH,
      height: INITIAL_VIEWPORT_HEIGHT,
    },
  });

  const page = await context.newPage();
  configurePage(page);
  await openPortfolioRoute(page, baseUrl, fitScoreRoute);
  const fontReport = await ensurePortfolioFont(page);
  await validateFeaturedContent(page);

  let region = await measureFeaturedRegion(page);
  await page.setViewportSize({
    width: PORTFOLIO_VIEWPORT_WIDTH,
    height: region.height,
  });
  await settleResponsiveLayout(page);

  // Re-measure after the viewport change so the fixed sidebar fills the exact
  // same DOM-bounded region as the Fit Score content.
  region = await measureFeaturedRegion(page);
  if (page.viewportSize()?.height !== region.height) {
    await page.setViewportSize({
      width: PORTFOLIO_VIEWPORT_WIDTH,
      height: region.height,
    });
    await settleResponsiveLayout(page);
    region = await measureFeaturedRegion(page);
  }

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    clip: {
      x: 0,
      y: 0,
      width: PORTFOLIO_VIEWPORT_WIDTH,
      height: region.height,
    },
    path: OUTPUT_PATH,
    scale: "device",
  });

  console.log("Captured the authenticated ApplyFit portfolio feature image.");
  console.log(`Saved to ${path.relative(process.cwd(), OUTPUT_PATH)}.`);
  console.log(
    `Output dimensions: ${PORTFOLIO_VIEWPORT_WIDTH * DEVICE_SCALE_FACTOR}x${region.height * DEVICE_SCALE_FACTOR}.`,
  );
  console.log(
    `Verified fonts: ${fontReport.pageHeading.family} (${fontReport.pageHeading.weight}), ${fontReport.readinessHeading.family} (${fontReport.readinessHeading.weight}).`,
  );
} catch (error) {
  const message = errorMessage(error);
  if (/executable.*doesn.t exist|browser.*not found/i.test(message)) {
    console.error(
      'Chromium is not installed for Playwright. Run "npx playwright install chromium" and retry.',
    );
  } else {
    console.error(message);
  }
  process.exitCode = 1;
} finally {
  await context?.close().catch(() => {});
  await browser?.close().catch(() => {});
}

async function openPortfolioRoute(page, baseUrl, route) {
  try {
    await openAuthenticatedRoute(page, baseUrl, route);
  } catch (error) {
    // FitScoreWorkspace briefly renders its existing generic error between
    // async state commits in Vinext dev. Accept it only when the real score
    // content becomes visible immediately afterward.
    try {
      await page.locator(route.readySelector).waitFor({ state: "visible" });
      await page.waitForLoadState("networkidle");
      assertExpectedPath(page.url(), route);
    } catch {
      throw error;
    }
  }
}

async function ensurePortfolioFont(page) {
  const fontData = await readFile(PLUS_JAKARTA_FONT_PATH);
  const fontSource = `data:font/woff2;base64,${fontData.toString("base64")}`;
  await page.addStyleTag({
    content: `
      @font-face {
        font-family: "Plus Jakarta Sans";
        font-style: normal;
        font-display: block;
        font-weight: 200 800;
        src: url("${fontSource}") format("woff2-variations");
      }
    `,
  });

  const report = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 16px "Plus Jakarta Sans"', "Skor Kecocokan"),
      document.fonts.load(
        '700 16px "Plus Jakarta Sans"',
        "Analisis kesiapanmu untuk role ini",
      ),
    ]);
    await document.fonts.ready;

    const familyName = "Plus Jakarta Sans";
    const loadedFaces = [...document.fonts].filter(
      (face) =>
        face.family.replaceAll('"', "").replaceAll("'", "") === familyName &&
        face.status === "loaded",
    );
    const readStyle = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const computed = getComputedStyle(element);
      return {
        family: computed.fontFamily,
        weight: computed.fontWeight,
      };
    };

    return {
      fontSetStatus: document.fonts.status,
      loadedFaceCount: loadedFaces.length,
      pageHeading: readStyle(".topbar h1"),
      readinessHeading: readStyle("#score-title"),
    };
  });

  const headings = [report.pageHeading, report.readinessHeading];
  if (
    report.fontSetStatus !== "loaded" ||
    report.loadedFaceCount < 1 ||
    headings.some((heading) => !heading?.family.includes("Plus Jakarta Sans"))
  ) {
    throw new ScreenshotWorkflowError(
      "Plus Jakarta Sans did not finish loading for the portfolio screenshot.",
    );
  }

  return report;
}

async function validateFeaturedContent(page) {
  await requireExactText(page.locator(".sidebar-user-copy strong"), "Kimi Leonhart", "demo persona");
  await requireExactText(page.locator(".topbar h1"), "Skor Kecocokan", "page heading");
  await requireExactText(
    page.locator(".analyzed-job-heading strong"),
    "Frontend Engineer",
    "analyzed job title",
  );
  await requireExactText(
    page.locator(".analyzed-job-heading > span"),
    "Northstar Labs",
    "analyzed company",
  );

  const score = (await page.locator(".score-ring strong").textContent())?.trim();
  if (!score || !/^92[,.]3$/.test(score)) {
    throw new ScreenshotWorkflowError(
      `Expected the prepared 92.3% Fit Score, but found ${score || "no score"}.`,
    );
  }

  const statuses = await page.locator(".status-item").evaluateAll((items) =>
    items.map((item) => ({
      label: item.querySelector("span:not(.status-dot)")?.textContent?.trim(),
      value: item.querySelector("strong")?.textContent?.trim(),
    })),
  );
  const proven = statuses.find((status) => status.label === "Proven");
  const missing = statuses.find((status) => status.label === "Missing");
  if (proven?.value !== "10" || missing?.value !== "2") {
    throw new ScreenshotWorkflowError(
      "Expected the prepared Proven 10 and Missing 2 status summary.",
    );
  }

  const attentionCards = page.locator(".attention-item");
  if (await attentionCards.count() !== 2) {
    throw new ScreenshotWorkflowError(
      "Expected exactly two missing requirement cards in Perlu Perhatian.",
    );
  }
  const cardStatuses = await attentionCards.locator(".status-badge").allTextContents();
  if (cardStatuses.some((status) => status.trim() !== "Missing")) {
    throw new ScreenshotWorkflowError(
      "Both Perlu Perhatian cards must have Missing status.",
    );
  }
}

async function requireExactText(locator, expected, label) {
  const value = (await locator.textContent())?.trim();
  if (value !== expected) {
    throw new ScreenshotWorkflowError(
      `Expected ${label} "${expected}", but found "${value || "nothing"}".`,
    );
  }
}

async function measureFeaturedRegion(page) {
  const bounds = await page.evaluate(() => {
    window.scrollTo(0, 0);
    const attention = document.querySelector(".attention-section")?.getBoundingClientRect();
    const requirements = document.querySelector(".requirements-panel")?.getBoundingClientRect();
    if (!attention || !requirements) return null;
    return {
      attentionBottom: attention.bottom,
      requirementsTop: requirements.top,
    };
  });

  if (!bounds) {
    throw new ScreenshotWorkflowError(
      "Could not locate the Perlu Perhatian and Detail Requirement boundaries.",
    );
  }

  const bottomPadding = APPROVED_CAPTURE_HEIGHT - bounds.attentionBottom;
  if (bottomPadding < MIN_REGION_BOTTOM_PADDING) {
    throw new ScreenshotWorkflowError(
      "The approved capture no longer contains the complete Perlu Perhatian section.",
    );
  }
  if (APPROVED_CAPTURE_HEIGHT >= Math.floor(bounds.requirementsTop)) {
    throw new ScreenshotWorkflowError(
      "The DOM capture boundary would include Detail Requirement; no image was written.",
    );
  }

  return { height: APPROVED_CAPTURE_HEIGHT };
}
