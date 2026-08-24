import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  AUTH_STATE_PATH,
  buildJobScreenshotRoutes,
  DEFAULT_BASE_URL,
  PORTFOLIO_DEVICE_SCALE_FACTOR,
  SCREENSHOT_BROWSER_LAUNCH_OPTIONS,
  SCREENSHOT_ROOT,
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
  resolveScreenshotJob,
  verifyScreenshotRoutes,
} from "./workflow.mjs";

const PORTFOLIO_VIEWPORT_WIDTH = 1440;
const INITIAL_VIEWPORT_HEIGHT = 1200;
const APPROVED_CAPTURE_HEIGHT = 1106;
const MIN_REGION_BOTTOM_PADDING = 16;
const FEATURED_OUTPUT_PATH = path.join(
  SCREENSHOT_ROOT,
  "portfolio",
  "applyfit-featured.png",
);
const JOB_WORKSPACE_OUTPUT_DIRECTORY = path.join(SCREENSHOT_ROOT, "portfolio", "job-workspace");

let browser;
let context;

try {
  const configuredBaseUrl = getBaseUrl(DEFAULT_BASE_URL);
  const baseUrl = await ensureDevelopmentServer(configuredBaseUrl);
  if (!(await fileExists(AUTH_STATE_PATH))) throw expiredStateError();


  browser = await chromium.launch(SCREENSHOT_BROWSER_LAUNCH_OPTIONS);
  context = await browser.newContext({
    deviceScaleFactor: PORTFOLIO_DEVICE_SCALE_FACTOR,
    storageState: AUTH_STATE_PATH,
    viewport: {
      width: PORTFOLIO_VIEWPORT_WIDTH,
      height: INITIAL_VIEWPORT_HEIGHT,
    },
  });

  const job = await resolveScreenshotJob(context.request, baseUrl);
  const workspaceRoutes = buildJobScreenshotRoutes(job.id);
  await verifyScreenshotRoutes(context.request, baseUrl, workspaceRoutes);
  await mkdir(JOB_WORKSPACE_OUTPUT_DIRECTORY, { recursive: true });

  const page = await context.newPage();
  configurePage(page);

  for (const route of workspaceRoutes) {
    await page.setViewportSize({
      width: PORTFOLIO_VIEWPORT_WIDTH,
      height: INITIAL_VIEWPORT_HEIGHT,
    });
    await openPortfolioRoute(page, baseUrl, route);
    await validateWorkspaceJob(page, route, job);

    const outputPath = path.join(JOB_WORKSPACE_OUTPUT_DIRECTORY, `${route.slug}.png`);
    await page.screenshot({
      animations: "disabled",
      caret: "hide",
      fullPage: true,
      path: outputPath,
      scale: "device",
    });
    console.log(`${route.label}: ${path.relative(process.cwd(), outputPath)}`);
  }

  const analysisRoute = workspaceRoutes.at(-1);
  if (!analysisRoute || analysisRoute.kind !== "analysis") {
    throw new ScreenshotWorkflowError("The portfolio analysis route is not configured last.");
  }
  const { fontReport, region } = await captureFeaturedAnalysis(page, analysisRoute, job);

  console.log(
    `Captured 4 authenticated job-workspace screenshots for ${job.title} at ${job.company}.`,
  );
  console.log(`Resolved demo job ID at runtime: ${job.id}.`);
  console.log(`Featured analysis: ${path.relative(process.cwd(), FEATURED_OUTPUT_PATH)}.`);
  console.log(
    `Output dimensions: ${PORTFOLIO_VIEWPORT_WIDTH * PORTFOLIO_DEVICE_SCALE_FACTOR}x${region.height * PORTFOLIO_DEVICE_SCALE_FACTOR}.`,
  );
  console.log(
    `Verified application fonts: ${fontReport.loadedFamilies.join(", ")}.`,
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


async function validateWorkspaceJob(page, route, job) {
  await requireExactText(
    page.locator(route.jobTitleSelector).first(),
    job.title,
    `${route.label} job`,
  );

  if (route.kind !== "analysis") return;
  const currentUrl = new URL(page.url());
  if (currentUrl.searchParams.get("job") !== job.id) {
    throw new ScreenshotWorkflowError(
      `Job analysis did not retain the resolved demo job ID ${job.id}.`,
    );
  }

  await requireExactText(page.locator(".topbar h1"), "Skor Kecocokan", "page heading");
  await requireExactText(
    page.locator(".analyzed-job-heading > span"),
    job.company,
    "analyzed company",
  );
  const scoreText = (await page.locator(".score-ring strong").textContent())?.trim();
  const score = Number(scoreText?.replaceAll(".", "").replace(",", "."));
  if (!scoreText || !Number.isFinite(score) || score < 0 || score > 100) {
    throw new ScreenshotWorkflowError(
      `Expected a calculated Fit Score for ${job.title}, but found ${scoreText || "no score"}.`,
    );
  }
}

async function captureFeaturedAnalysis(page, analysisRoute, job) {
  await validateWorkspaceJob(page, analysisRoute, job);
  let region = await measureFeaturedRegion(page);
  await page.setViewportSize({
    width: PORTFOLIO_VIEWPORT_WIDTH,
    height: region.height,
  });
  const fontReport = await settleResponsiveLayout(page, `${analysisRoute.label} featured viewport`);

  region = await measureFeaturedRegion(page);
  if (page.viewportSize()?.height !== region.height) {
    await page.setViewportSize({
      width: PORTFOLIO_VIEWPORT_WIDTH,
      height: region.height,
    });
    await settleResponsiveLayout(page, `${analysisRoute.label} featured viewport`);
    region = await measureFeaturedRegion(page);
  }

  await mkdir(path.dirname(FEATURED_OUTPUT_PATH), { recursive: true });
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    clip: {
      x: 0,
      y: 0,
      width: PORTFOLIO_VIEWPORT_WIDTH,
      height: region.height,
    },
    path: FEATURED_OUTPUT_PATH,
    scale: "device",
  });

  return { fontReport, region };
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

  const minimumHeight = Math.ceil(bounds.attentionBottom + MIN_REGION_BOTTOM_PADDING);
  const maximumHeight = Math.floor(bounds.requirementsTop) - 1;
  if (minimumHeight > maximumHeight) {
    throw new ScreenshotWorkflowError(
      "The featured capture cannot include Perlu Perhatian without also including Detail Requirement.",
    );
  }

  return {
    height: Math.min(
      Math.max(APPROVED_CAPTURE_HEIGHT, minimumHeight),
      maximumHeight,
    ),
  };
}
