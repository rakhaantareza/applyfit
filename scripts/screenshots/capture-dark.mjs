import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  AUTH_STATE_PATH,
  DEFAULT_BASE_URL,
  SCREENSHOT_BROWSER_LAUNCH_OPTIONS,
  SCREENSHOT_DEVICE_SCALE_FACTOR,
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
  verifyScreenshotRoutes,
} from "./workflow.mjs";

const APPEARANCE_STORAGE_KEY = "applyfit-appearance";
const DARK_SCREENSHOT_ROOT = path.join(SCREENSHOT_ROOT, "dark");
const ringkasanRoute = SCREENSHOT_ROUTES.find((route) => route.path === "/beranda");

let browser;
let context;

try {
  if (!ringkasanRoute) {
    throw new ScreenshotWorkflowError("The Ringkasan screenshot route is not configured.");
  }

  const configuredBaseUrl = getBaseUrl(DEFAULT_BASE_URL);
  const baseUrl = await ensureDevelopmentServer(configuredBaseUrl);
  if (!(await fileExists(AUTH_STATE_PATH))) throw expiredStateError();

  browser = await chromium.launch(SCREENSHOT_BROWSER_LAUNCH_OPTIONS);
  try {
    context = await browser.newContext({
      colorScheme: "light",
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

  await context.addInitScript((storageKey) => {
    try {
      window.localStorage.setItem(storageKey, "dark");
    } catch {
      // Opaque documents such as about:blank do not expose localStorage. The
      // script runs again for the ApplyFit origin before application scripts.
    }

    document.documentElement.dataset.appearance = "dark";
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";
  }, APPEARANCE_STORAGE_KEY);

  const captureRoutes = [{ ...ringkasanRoute, label: "Ringkasan", slug: "ringkasan" }];
  await verifyScreenshotRoutes(context.request, baseUrl, captureRoutes);
  console.log(`Verified the authenticated Dark screenshot route at ${baseUrl}.`);

  const page = await context.newPage();
  configurePage(page);
  await mkdir(DARK_SCREENSHOT_ROOT, { recursive: true });

  let captured = 0;
  for (const route of captureRoutes) {
    const routeDirectory = path.join(DARK_SCREENSHOT_ROOT, route.slug);
    await mkdir(routeDirectory, { recursive: true });
    await page.setViewportSize({
      width: VIEWPORTS[0].width,
      height: VIEWPORTS[0].height,
    });
    await openAuthenticatedRoute(page, baseUrl, route);
    await assertExplicitDarkAppearance(page, route.label);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await settleResponsiveLayout(
        page,
        `${route.label} Dark at ${viewport.width}x${viewport.height}`,
      );
      assertExpectedPath(page.url(), route);
      await assertExplicitDarkAppearance(page, route.label);

      const screenshotPath = path.join(routeDirectory, `${viewport.name}.png`);
      await page.screenshot({
        animations: "disabled",
        caret: "hide",
        fullPage: true,
        path: screenshotPath,
        scale: "device",
      });
      captured += 1;
      console.log(`${route.label} Dark: ${viewport.width}x${viewport.height}`);
    }
  }

  console.log(
    `Captured ${captured} authenticated Dark screenshots in ${path.relative(process.cwd(), DARK_SCREENSHOT_ROOT)}.`,
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

async function assertExplicitDarkAppearance(page, routeLabel) {
  const appearance = await page.evaluate((storageKey) => ({
    preference: window.localStorage.getItem(storageKey),
    appearance: document.documentElement.dataset.appearance,
    theme: document.documentElement.dataset.theme,
    colorScheme: document.documentElement.style.colorScheme,
  }), APPEARANCE_STORAGE_KEY);

  if (
    appearance.preference !== "dark" ||
    appearance.appearance !== "dark" ||
    appearance.theme !== "dark" ||
    appearance.colorScheme !== "dark"
  ) {
    throw new ScreenshotWorkflowError(
      `${routeLabel} did not render with the explicit Dark appearance; refusing to capture.`,
    );
  }
}
