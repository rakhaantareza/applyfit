import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  DEFAULT_BASE_URL,
  SCREENSHOT_BROWSER_LAUNCH_OPTIONS,
  SCREENSHOT_DEVICE_SCALE_FACTOR,
  SCREENSHOT_ROOT,
} from "./config.mjs";
import {
  ScreenshotWorkflowError,
  configurePage,
  ensureDevelopmentServer,
  errorMessage,
  getBaseUrl,
  openAuthenticatedRoute,
  openUnauthenticatedRoute,
  resolveScreenshotJob,
  settleResponsiveLayout,
} from "./workflow.mjs";

const OUTPUT_ROOT = path.join(SCREENSHOT_ROOT, "auth-refinement");
const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

const captures = [
  {
    file: "login-desktop-light-1440x900.png",
    label: "Login Desktop Light",
    route: { path: "/login", readySelector: "#login-title" },
    viewport: desktop,
  },
  {
    file: "login-mobile-390x844.png",
    label: "Login Mobile",
    route: { path: "/login", readySelector: "#login-title" },
    viewport: mobile,
  },
  {
    file: "register-desktop-light-1440x900.png",
    label: "Register Desktop Light",
    route: { path: "/daftar", readySelector: "#registration-title" },
    viewport: desktop,
  },
  {
    file: "register-mobile-390x844.png",
    label: "Register Mobile",
    route: { path: "/daftar", readySelector: "#registration-title" },
    viewport: mobile,
  },
];

let browser;

try {
  const baseUrl = await ensureDevelopmentServer(getBaseUrl(DEFAULT_BASE_URL));
  browser = await chromium.launch(SCREENSHOT_BROWSER_LAUNCH_OPTIONS);
  await mkdir(OUTPUT_ROOT, { recursive: true });

  for (const capture of captures) {
    const context = await createContext(browser, capture.viewport);
    try {
      const page = await context.newPage();
      await configurePage(page);
      await openUnauthenticatedRoute(page, baseUrl, {
        ...capture.route,
        label: capture.label,
      });
      await assertAuthLayout(page, capture.label);
      await page.screenshot({
        animations: "disabled",
        caret: "hide",
        fullPage: false,
        path: path.join(OUTPUT_ROOT, capture.file),
        scale: "device",
      });
      console.log(
        `${capture.label}: ${capture.viewport.width}x${capture.viewport.height}`,
      );
    } finally {
      await context.close();
    }
  }

  await verifyLoginAndDemo(browser, baseUrl);
  await verifyRegistration(browser, baseUrl);
  await verifyRecoveryAndReset(browser, baseUrl);

  console.log(
    `Auth QA passed. Screenshots: ${path.relative(process.cwd(), OUTPUT_ROOT)}.`,
  );
} catch (error) {
  console.error(errorMessage(error));
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
}

async function createContext(browserInstance, viewport) {
  const context = await browserInstance.newContext({
    colorScheme: "light",
    deviceScaleFactor: SCREENSHOT_DEVICE_SCALE_FACTOR,
    viewport,
  });
  return context;
}

async function assertAuthLayout(page, label) {
  const layout = await page.evaluate(() => ({
    appearance: getComputedStyle(document.documentElement).colorScheme,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    betaCount: [...document.querySelectorAll(".auth-beta")].filter(
      (element) => element.getClientRects().length > 0,
    ).length,
  }));

  if (layout.appearance !== "light") {
    throw new ScreenshotWorkflowError(
      `${label} did not retain the light appearance.`,
    );
  }
  if (layout.scrollWidth > layout.clientWidth) {
    throw new ScreenshotWorkflowError(`${label} has horizontal overflow.`);
  }
  if (layout.betaCount !== 1) {
    throw new ScreenshotWorkflowError(
      `${label} must show one quiet Beta indicator.`,
    );
  }
}

async function verifyLoginAndDemo(browserInstance, baseUrl) {
  const validationContext = await createContext(browserInstance, desktop);
  try {
    const page = await validationContext.newPage();
    await configurePage(page);
    await openUnauthenticatedRoute(page, baseUrl, {
      label: "Login validation",
      path: "/login",
      readySelector: "#login-title",
    });
    await page.locator("#login-email").fill("email-tidak-valid");
    await page.locator("#login-password").fill("123");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await page.locator("#login-error").waitFor({ state: "visible" });
  } finally {
    await validationContext.close();
  }

  const demoContext = await createContext(browserInstance, desktop);
  try {
    const page = await demoContext.newPage();
    await configurePage(page);
    await openUnauthenticatedRoute(page, baseUrl, {
      label: "Demo entry",
      path: "/login",
      readySelector: "#login-title",
    });
    await page.getByRole("button", { name: "Coba demo", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/beranda");
    await page.locator(".summary-greeting").waitFor({ state: "visible" });

    const job = await resolveScreenshotJob(demoContext.request, baseUrl);
    await openAuthenticatedRoute(page, baseUrl, {
      label: "Completed demo Analysis",
      path: `/lowongan/${encodeURIComponent(job.id)}/analisis`,
      readySelector: ".fit-story",
    });
  } finally {
    await demoContext.close();
  }
}

async function verifyRegistration(browserInstance, baseUrl) {
  const context = await createContext(browserInstance, mobile);
  try {
    const page = await context.newPage();
    await configurePage(page);
    await openUnauthenticatedRoute(page, baseUrl, {
      label: "Register validation",
      path: "/daftar",
      readySelector: "#registration-title",
    });
    if (await page.locator("input[type=checkbox]").count()) {
      throw new ScreenshotWorkflowError(
        "Register still exposes a pseudo-legal checkbox.",
      );
    }
    await page.getByRole("button", { name: "Buat akun", exact: true }).click();
    await page.locator("#registration-error").waitFor({ state: "visible" });
  } finally {
    await context.close();
  }
}

async function verifyRecoveryAndReset(browserInstance, baseUrl) {
  const context = await createContext(browserInstance, mobile);
  try {
    const page = await context.newPage();
    await configurePage(page);
    await openUnauthenticatedRoute(page, baseUrl, {
      label: "Password recovery",
      path: "/lupa-kata-sandi",
      readySelector: "#recovery-title",
    });
    await page.locator("#recovery-email").fill("email-tidak-valid");
    await page.getByRole("button", { name: "Kirim kode", exact: true }).click();
    await page.locator("#recovery-error").waitFor({ state: "visible" });

    await page.goto(
      new URL("/reset-kata-sandi?email=demo%40example.com", baseUrl).href,
      {
        waitUntil: "domcontentloaded",
      },
    );
    await page.locator("#reset-title").waitFor({ state: "visible" });
    await page.locator("#reset-code").fill("123");
    await page.locator("#reset-password").fill("baru123");
    await page.locator("#reset-confirmation").fill("baru123");
    await page
      .getByRole("button", { name: "Simpan kata sandi", exact: true })
      .click();
    await page.locator("#reset-error").waitFor({ state: "visible" });
    await settleResponsiveLayout(page, "Reset Password mobile");
    await assertAuthLayout(page, "Reset Password mobile");
  } finally {
    await context.close();
  }
}
