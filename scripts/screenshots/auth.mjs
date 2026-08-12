import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  AUTH_STATE_PATH,
  DEFAULT_BASE_URL,
  SCREENSHOT_ROUTES,
} from "./config.mjs";
import {
  ScreenshotWorkflowError,
  configurePage,
  ensureDevelopmentServer,
  errorMessage,
  getBaseUrl,
  isVerificationFailure,
  openAuthenticatedRoute,
  readJsonResponse,
  requireEnvironmentVariable,
  responseErrorMessage,
} from "./workflow.mjs";

let browser;
let context;

try {
  const baseUrl = getBaseUrl(DEFAULT_BASE_URL);
  const email = requireEnvironmentVariable("DEMO_EMAIL").toLocaleLowerCase("id-ID");
  const password = requireEnvironmentVariable("DEMO_PASSWORD", { trim: false });

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ScreenshotWorkflowError("DEMO_EMAIL must be a valid email address.");
  }
  if (password.length < 6) {
    throw new ScreenshotWorkflowError("DEMO_PASSWORD must contain at least 6 characters.");
  }

  await ensureDevelopmentServer(baseUrl);
  await mkdir(path.dirname(AUTH_STATE_PATH), { recursive: true });

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  configurePage(page);

  await page.goto(new URL("/login", baseUrl).href, { waitUntil: "domcontentloaded" });
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);

  const signInResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/auth/sign-in" &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Masuk ke ApplyFit" }).click();
  const signInResponse = await signInResponsePromise;
  const body = await readJsonResponse(signInResponse);

  if (!signInResponse.ok() || !body?.data?.user) {
    if (isVerificationFailure(signInResponse, body)) {
      throw new ScreenshotWorkflowError(
        "The demo account is not email-verified. Verify it manually through the existing ApplyFit registration flow, then run this command again.",
      );
    }
    throw new ScreenshotWorkflowError(
      `Authentication failed: ${responseErrorMessage(body, "Email or password was rejected.")}`,
    );
  }

  if (body.data.user.email?.toLocaleLowerCase("id-ID") !== email) {
    throw new ScreenshotWorkflowError(
      "Authentication returned a different account than DEMO_EMAIL; the state was not saved.",
    );
  }
  if (body.data.user.emailVerified !== true) {
    throw new ScreenshotWorkflowError(
      "The demo account signed in but is not marked as email-verified. Verify it manually before saving screenshot state.",
    );
  }

  const homeRoute = SCREENSHOT_ROUTES.find((route) => route.path === "/beranda");
  if (!homeRoute) throw new ScreenshotWorkflowError("The Beranda screenshot route is not configured.");
  await openAuthenticatedRoute(page, baseUrl, homeRoute);
  await context.storageState({ path: AUTH_STATE_PATH });

  console.log("Authenticated demo state refreshed successfully.");
  console.log(`Saved locally to ${path.relative(process.cwd(), AUTH_STATE_PATH)}.`);
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
