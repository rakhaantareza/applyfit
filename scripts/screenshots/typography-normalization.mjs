import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  AUTH_STATE_PATH,
  DEFAULT_BASE_URL,
  SCREENSHOT_BROWSER_LAUNCH_OPTIONS,
  SCREENSHOT_DEVICE_SCALE_FACTOR,
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
} from "./workflow.mjs";

const APPEARANCE_STORAGE_KEY = "applyfit-appearance";
const OUTPUT_ROOT = path.join(SCREENSHOT_ROOT, "typography-normalization");
const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "390x844", width: 390, height: 844 },
];
const ROUTES = [
  { label: "Ringkasan", slug: "ringkasan", path: "/beranda", readySelector: ".summary-greeting" },
  { label: "Profil", slug: "profil", path: "/profil-karier", readySelector: ".career-profile-hero" },
  { label: "Portfolio & Pengalaman", slug: "portfolio-pengalaman", path: "/portfolio-pengalaman", readySelector: ".evidence-overview" },
  { label: "Lowongan", slug: "lowongan", path: "/lowongan", readySelector: ".jobs-overview, .jobs-zero-state" },
];
const SCREENSHOT_ROUTE_SLUGS = new Set(["ringkasan", "profil"]);

let browser;

try {
  const baseUrl = await ensureDevelopmentServer(getBaseUrl(DEFAULT_BASE_URL));
  if (!(await fileExists(AUTH_STATE_PATH))) throw expiredStateError();

  browser = await chromium.launch(SCREENSHOT_BROWSER_LAUNCH_OPTIONS);
  await mkdir(OUTPUT_ROOT, { recursive: true });

  for (const appearance of ["light", "dark"]) {
    for (const viewport of VIEWPORTS) {
      const context = await createContext(browser, appearance, viewport);
      const page = await context.newPage();
      await configurePage(page);
      let sharedTypography;

      try {
        for (const route of ROUTES) {
          await openAuthenticatedRoute(page, baseUrl, route);
          await settleResponsiveLayout(
            page,
            `${route.label} ${appearance} ${viewport.name}`,
          );
          assertExpectedPath(page.url(), route);

          const before = await page.locator(".page-header").boundingBox();
          await page.waitForTimeout(250);
          const after = await page.locator(".page-header").boundingBox();
          assertStableHeader(before, after, route.label);

          const audit = await auditLayout(page, viewport.width);
          sharedTypography ??= audit.typography;
          assertSharedTypography(sharedTypography, audit.typography, route.label);

          if (SCREENSHOT_ROUTE_SLUGS.has(route.slug)) {
            const routeDirectory = path.join(OUTPUT_ROOT, appearance, route.slug);
            await mkdir(routeDirectory, { recursive: true });
            await page.screenshot({
              animations: "disabled",
              caret: "hide",
              fullPage: false,
              path: path.join(routeDirectory, `${viewport.name}.png`),
              scale: "device",
            });
          }
        }
      } finally {
        await context.close();
      }

      console.log(`${appearance} ${viewport.name}: 4 pages passed; Ringkasan and Profil captured.`);
    }
  }

  console.log(`Typography normalization QA passed. Screenshots: ${path.relative(process.cwd(), OUTPUT_ROOT)}.`);
} catch (error) {
  console.error(errorMessage(error));
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
}

async function createContext(browserInstance, appearance, viewport) {
  const context = await browserInstance.newContext({
    colorScheme: appearance,
    deviceScaleFactor: SCREENSHOT_DEVICE_SCALE_FACTOR,
    storageState: AUTH_STATE_PATH,
    viewport,
  });
  await context.addInitScript(({ appearanceValue, storageKey }) => {
    try {
      window.localStorage.setItem(storageKey, appearanceValue);
    } catch {
      // The script runs again for the ApplyFit origin.
    }
    document.documentElement.dataset.appearance = appearanceValue;
    document.documentElement.dataset.theme = appearanceValue;
    document.documentElement.style.colorScheme = appearanceValue;
  }, { appearanceValue: appearance, storageKey: APPEARANCE_STORAGE_KEY });
  return context;
}

async function auditLayout(page, viewportWidth) {
  return page.evaluate((width) => {
    const root = document.documentElement;
    if (root.scrollWidth > root.clientWidth) {
      throw new Error(`Horizontal overflow: ${root.scrollWidth}px > ${root.clientWidth}px.`);
    }

    const pageTitle = document.querySelector(".type-page-title");
    if (!pageTitle) throw new Error("Missing semantic page-title role.");

    const sectionTitles = [...document.querySelectorAll(".type-section-title")];
    if (!sectionTitles.length) throw new Error("Missing semantic section-title role.");

    const helpers = [...document.querySelectorAll(".type-helper")];
    if (!helpers.length) throw new Error("Missing semantic helper role.");

    const weightedText = [
      pageTitle,
      ...sectionTitles,
      ...document.querySelectorAll(".type-primary-title"),
    ];
    for (const element of weightedText) {
      if (Number.parseInt(getComputedStyle(element).fontWeight, 10) > 600) {
        throw new Error(`Typography role exceeds weight 600: ${element.textContent?.trim()}.`);
      }
    }

    for (const header of document.querySelectorAll(".page-header, .section-header")) {
      const copy = header.querySelector(":scope > .page-header-copy, :scope > .section-header-copy");
      const action = header.querySelector(":scope > .page-header-action, :scope > .section-header-action");
      if (!copy || !action) continue;
      const copyRect = copy.getBoundingClientRect();
      const actionRect = action.getBoundingClientRect();
      if (actionRect.left < 0 || actionRect.right > root.clientWidth + 0.5) {
        throw new Error("Header action escapes the viewport.");
      }
      if (width <= 767 && actionRect.top + 1 < copyRect.bottom) {
        throw new Error("Mobile header action does not follow its copy.");
      }
      if (width > 767 && Math.abs(actionRect.top - copyRect.top) > 8) {
        throw new Error("Desktop header action is not aligned with its copy.");
      }
    }

    const signature = (element) => {
      const style = getComputedStyle(element);
      return [
        style.fontFamily,
        style.fontSize,
        style.fontWeight,
        style.letterSpacing,
        style.lineHeight,
      ].join("|");
    };
    const allMatch = (elements) => elements.every(
      (element) => signature(element) === signature(elements[0]),
    );
    if (!allMatch(sectionTitles)) throw new Error("Section-title roles are inconsistent within the page.");
    if (!allMatch(helpers)) throw new Error("Helper roles are inconsistent within the page.");

    return {
      typography: {
        pageTitle: signature(pageTitle),
        sectionTitle: signature(sectionTitles[0]),
        helper: signature(helpers[0]),
      },
    };
  }, viewportWidth);
}

function assertSharedTypography(expected, actual, routeLabel) {
  for (const role of ["pageTitle", "sectionTitle", "helper"]) {
    if (actual[role] !== expected[role]) {
      throw new ScreenshotWorkflowError(`${routeLabel} does not share the ${role} typography role.`);
    }
  }
}

function assertStableHeader(before, after, routeLabel) {
  if (!before || !after) {
    throw new ScreenshotWorkflowError(`${routeLabel} page header could not be measured.`);
  }
  if (Math.abs(before.y - after.y) > 1 || Math.abs(before.height - after.height) > 1) {
    throw new ScreenshotWorkflowError(`${routeLabel} page header shifted after settling.`);
  }
}
