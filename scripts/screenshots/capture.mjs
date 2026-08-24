import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  AUTH_STATE_PATH,
  buildJobScreenshotRoutes,
  DEFAULT_BASE_URL,
  SCREENSHOT_ROOT,
  SCREENSHOT_BROWSER_LAUNCH_OPTIONS,
  SCREENSHOT_ROUTES,
  SCREENSHOT_DEVICE_SCALE_FACTOR,
  UNAUTHENTICATED_SCREENSHOT_ROUTES,
  VIEWPORTS,
} from "./config.mjs";
import {
  ScreenshotWorkflowError,
  assertExpectedPath,
  assertUnauthenticatedPath,
  configurePage,
  ensureDevelopmentServer,
  errorMessage,
  expiredStateError,
  fileExists,
  getBaseUrl,
  openAuthenticatedRoute,
  openUnauthenticatedRoute,
  resolveScreenshotJob,
  settleResponsiveLayout,
  verifyScreenshotRoutes,
} from "./workflow.mjs";

let browser;
let context;
let anonymousContext;

try {
  const configuredBaseUrl = getBaseUrl(DEFAULT_BASE_URL);
  const baseUrl = await ensureDevelopmentServer(configuredBaseUrl);

  if (!(await fileExists(AUTH_STATE_PATH))) throw expiredStateError();

  browser = await chromium.launch(SCREENSHOT_BROWSER_LAUNCH_OPTIONS);
  try {
    context = await browser.newContext({
      deviceScaleFactor: SCREENSHOT_DEVICE_SCALE_FACTOR,
      storageState: AUTH_STATE_PATH,
      viewport: {
        width: VIEWPORTS[0].width,
        height: VIEWPORTS[0].height,
      },
    });
  } catch (error) {
    throw new ScreenshotWorkflowError(expiredStateError().message, { cause: error });
  }

  const page = await context.newPage();
  configurePage(page);
  const job = await resolveScreenshotJob(context.request, baseUrl);
  const dynamicJobRoutes = buildJobScreenshotRoutes(job.id);
  const captureRoutes = [...SCREENSHOT_ROUTES, ...dynamicJobRoutes];
  await verifyScreenshotRoutes(context.request, baseUrl, captureRoutes);
  console.log(`Verified ${captureRoutes.length} screenshot routes at ${baseUrl}.`);
  console.log(`Resolved dynamic job pages for ${job.title} at ${job.company}.`);
  await mkdir(SCREENSHOT_ROOT, { recursive: true });

  let captured = 0;
  for (const route of captureRoutes) {
    const routeDirectory = path.join(SCREENSHOT_ROOT, route.slug);
    await mkdir(routeDirectory, { recursive: true });
    await page.setViewportSize({
      width: VIEWPORTS[0].width,
      height: VIEWPORTS[0].height,
    });
    await openAuthenticatedRoute(page, baseUrl, route);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await settleResponsiveLayout(page, `${route.label} at ${viewport.width}x${viewport.height}`);
      assertExpectedPath(page.url(), route);

      const screenshotPath = path.join(routeDirectory, `${viewport.name}.png`);
      await page.screenshot({
        animations: "disabled",
        caret: "hide",
        fullPage: true,
        path: screenshotPath,
        scale: "device",
      });
      captured += 1;
      console.log(`${route.label}: ${viewport.width}x${viewport.height}`);
    }
  }

  console.log(
    `Captured ${captured} authenticated screenshots in ${path.relative(process.cwd(), SCREENSHOT_ROOT)}.`,
  );

  anonymousContext = await browser.newContext({
    deviceScaleFactor: SCREENSHOT_DEVICE_SCALE_FACTOR,
    viewport: {
      width: VIEWPORTS[0].width,
      height: VIEWPORTS[0].height,
    },
  });
  await verifyScreenshotRoutes(
    anonymousContext.request,
    baseUrl,
    UNAUTHENTICATED_SCREENSHOT_ROUTES,
  );
  console.log(
    `Verified ${UNAUTHENTICATED_SCREENSHOT_ROUTES.length} unauthenticated screenshot routes at ${baseUrl}.`,
  );

  const anonymousPage = await anonymousContext.newPage();
  configurePage(anonymousPage);
  let anonymousCaptured = 0;
  for (const route of UNAUTHENTICATED_SCREENSHOT_ROUTES) {
    const routeDirectory = path.join(SCREENSHOT_ROOT, route.slug);
    await mkdir(routeDirectory, { recursive: true });
    await anonymousPage.setViewportSize({
      width: VIEWPORTS[0].width,
      height: VIEWPORTS[0].height,
    });
    await openUnauthenticatedRoute(anonymousPage, baseUrl, route);

    for (const viewport of VIEWPORTS) {
      await anonymousPage.setViewportSize({ width: viewport.width, height: viewport.height });
      await settleResponsiveLayout(
        anonymousPage,
        `${route.label} at ${viewport.width}x${viewport.height}`,
      );
      assertUnauthenticatedPath(anonymousPage.url(), route);

      const screenshotPath = path.join(routeDirectory, `${viewport.name}.png`);
      await anonymousPage.screenshot({
        animations: "disabled",
        caret: "hide",
        fullPage: true,
        path: screenshotPath,
        scale: "device",
      });
      anonymousCaptured += 1;
      console.log(`${route.label}: ${viewport.width}x${viewport.height}`);
    }
  }

  console.log(
    `Captured ${anonymousCaptured} unauthenticated screenshots in ${path.relative(process.cwd(), SCREENSHOT_ROOT)}.`,
  );
  console.log(`Captured ${captured + anonymousCaptured} screenshots total.`);
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
  await anonymousContext?.close().catch(() => {});
  await context?.close().catch(() => {});
  await browser?.close().catch(() => {});
}
