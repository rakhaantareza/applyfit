import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  AUTH_STATE_PATH,
  DEFAULT_BASE_URL,
  SCREENSHOT_ROOT,
  SCREENSHOT_ROUTES,
  VIEWPORTS,
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

let browser;
let context;

try {
  const configuredBaseUrl = getBaseUrl(DEFAULT_BASE_URL);
  const baseUrl = await ensureDevelopmentServer(configuredBaseUrl);

  if (!(await fileExists(AUTH_STATE_PATH))) throw expiredStateError();

  browser = await chromium.launch({ headless: true });
  try {
    context = await browser.newContext({
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
  await mkdir(SCREENSHOT_ROOT, { recursive: true });

  let captured = 0;
  for (const route of SCREENSHOT_ROUTES) {
    const routeDirectory = path.join(SCREENSHOT_ROOT, route.slug);
    await mkdir(routeDirectory, { recursive: true });
    await page.setViewportSize({
      width: VIEWPORTS[0].width,
      height: VIEWPORTS[0].height,
    });
    await openAuthenticatedRoute(page, baseUrl, route);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await settleResponsiveLayout(page);
      assertExpectedPath(page.url(), route);

      const screenshotPath = path.join(routeDirectory, `${viewport.name}.png`);
      await page.screenshot({
        animations: "disabled",
        caret: "hide",
        fullPage: true,
        path: screenshotPath,
        scale: "css",
      });
      captured += 1;
      console.log(`${route.label}: ${viewport.width}x${viewport.height}`);
    }
  }

  console.log(
    `Captured ${captured} authenticated screenshots in ${path.relative(process.cwd(), SCREENSHOT_ROOT)}.`,
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
