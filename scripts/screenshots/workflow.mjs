import { access } from "node:fs/promises";

const NAVIGATION_TIMEOUT_MS = 30_000;
const SERVER_CHECK_TIMEOUT_MS = 5_000;
const ROUTE_ERROR_SELECTOR = [
  ".app-shell .career-profile-state.error",
  ".app-shell .persisted-job-state.error",
  ".app-shell [role=\"alert\"]",
].join(", ");

export class ScreenshotWorkflowError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "ScreenshotWorkflowError";
  }
}

export function getBaseUrl(defaultBaseUrl) {
  const configured = process.env.BASE_URL?.trim() || defaultBaseUrl;

  let url;
  try {
    url = new URL(configured);
  } catch {
    throw new ScreenshotWorkflowError(
      `BASE_URL must be an absolute http(s) URL. Received: ${configured}`,
    );
  }

  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new ScreenshotWorkflowError(
      "BASE_URL must use http(s) and must not contain credentials.",
    );
  }

  return url.origin;
}

export function requireEnvironmentVariable(name, { trim = true } = {}) {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new ScreenshotWorkflowError(
      `${name} is missing. Add it to the ignored .env.local file or provide it in the command environment.`,
    );
  }
  return trim ? value.trim() : value;
}

export async function ensureDevelopmentServer(baseUrl) {
  const candidates = getLocalBaseUrlCandidates(baseUrl);
  const failures = [];

  for (const candidate of candidates) {
    const loginUrl = new URL("/login", candidate);
    try {
      const response = await fetch(loginUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(SERVER_CHECK_TIMEOUT_MS),
      });

      if (response.status < 500) return candidate;
      failures.push(`${candidate} returned HTTP ${response.status}`);
    } catch (error) {
      failures.push(`${candidate} failed: ${errorMessage(error)}`);
    }
  }

  throw new ScreenshotWorkflowError(
    `ApplyFit is not reachable. Tried ${candidates.join(" and ")}. Start the development server with "npm run dev" and try again. ${failures.join("; ")}`,
  );
}

function getLocalBaseUrlCandidates(baseUrl) {
  const url = new URL(baseUrl);
  const fallbackHost = url.hostname === "127.0.0.1"
    ? "localhost"
    : url.hostname === "localhost" ? "127.0.0.1" : null;

  if (!fallbackHost) return [url.origin];

  const fallbackUrl = new URL(url.origin);
  fallbackUrl.hostname = fallbackHost;
  return [url.origin, fallbackUrl.origin];
}

export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function configurePage(page) {
  page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
  page.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);
}

export async function openAuthenticatedRoute(page, baseUrl, route) {
  const targetUrl = new URL(route.path, baseUrl);
  let response;

  try {
    response = await page.goto(targetUrl.href, { waitUntil: "domcontentloaded" });
  } catch (error) {
    throw new ScreenshotWorkflowError(
      `Failed to load ${route.label} at ${targetUrl.href}: ${errorMessage(error)}`,
      { cause: error },
    );
  }

  if (!response) {
    throw new ScreenshotWorkflowError(
      `No navigation response was received for ${route.label} at ${targetUrl.href}.`,
    );
  }
  if (!response.ok()) {
    throw new ScreenshotWorkflowError(
      `${route.label} failed to load with HTTP ${response.status()} at ${targetUrl.href}.`,
    );
  }

  await waitForAuthenticatedRoute(page, route);

  try {
    await page.waitForLoadState("networkidle", {
      timeout: NAVIGATION_TIMEOUT_MS,
    });
  } catch (error) {
    throw new ScreenshotWorkflowError(
      `${route.label} did not finish its important network loading within ${NAVIGATION_TIMEOUT_MS / 1000} seconds.`,
      { cause: error },
    );
  }

  await waitForFonts(page, route.label);
  await throwIfRouteErrorVisible(page, route.label);
  assertExpectedPath(page.url(), route);
}

async function waitForAuthenticatedRoute(page, route) {
  let state;
  try {
    const handle = await page.waitForFunction(
      ({ errorSelector, expectedPath, readySelector }) => {
        if (window.location.pathname === "/login") {
          return { status: "login" };
        }
        if (window.location.pathname !== expectedPath) {
          return { path: window.location.pathname, status: "redirect" };
        }

        const errorElement = document.querySelector(errorSelector);
        if (errorElement) {
          return {
            message: errorElement.textContent?.trim() || "Unknown application error",
            status: "error",
          };
        }

        if (document.querySelector(readySelector)) {
          return { status: "ready" };
        }

        return null;
      },
      {
        errorSelector: ROUTE_ERROR_SELECTOR,
        expectedPath: route.path,
        readySelector: route.readySelector,
      },
      { timeout: NAVIGATION_TIMEOUT_MS },
    );
    state = await handle.jsonValue();
  } catch (error) {
    throw new ScreenshotWorkflowError(
      `${route.label} did not reach its ready state within ${NAVIGATION_TIMEOUT_MS / 1000} seconds. The page may still be loading or its authenticated data may have failed.`,
      { cause: error },
    );
  }

  if (state?.status === "login") {
    throw expiredStateError();
  }
  if (state?.status === "redirect") {
    throw new ScreenshotWorkflowError(
      `${route.label} redirected unexpectedly from ${route.path} to ${state.path}.`,
    );
  }
  if (state?.status === "error") {
    throw new ScreenshotWorkflowError(
      `${route.label} displayed an application error: ${state.message}`,
    );
  }
}

async function waitForFonts(page, routeLabel) {
  try {
    await page.evaluate(async () => {
      if (document.fonts) await document.fonts.ready;
    });
  } catch (error) {
    throw new ScreenshotWorkflowError(
      `Fonts did not finish loading for ${routeLabel}: ${errorMessage(error)}`,
      { cause: error },
    );
  }
}

async function throwIfRouteErrorVisible(page, routeLabel) {
  const errorLocator = page.locator(ROUTE_ERROR_SELECTOR).first();
  if (await errorLocator.isVisible().catch(() => false)) {
    const message = (await errorLocator.textContent())?.trim() || "Unknown application error";
    throw new ScreenshotWorkflowError(
      `${routeLabel} displayed an application error: ${message}`,
    );
  }
}

export async function settleResponsiveLayout(page) {
  await page.evaluate(
    () => new Promise((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
    }),
  );
}

export function assertExpectedPath(currentUrl, route) {
  const url = new URL(currentUrl);
  if (url.pathname === "/login") throw expiredStateError();
  if (url.pathname !== route.path) {
    throw new ScreenshotWorkflowError(
      `${route.label} redirected unexpectedly from ${route.path} to ${url.pathname}.`,
    );
  }
}

export async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function responseErrorMessage(body, fallback) {
  return typeof body?.error?.message === "string" && body.error.message.trim()
    ? body.error.message.trim()
    : fallback;
}

export function isVerificationFailure(response, body) {
  const code = typeof body?.error?.code === "string" ? body.error.code : "";
  const message = responseErrorMessage(body, "");
  return response.status() === 403 || /verif|verify|confirm/i.test(`${code} ${message}`);
}

export function expiredStateError() {
  return new ScreenshotWorkflowError(
    "Stored authentication is missing, invalid, or expired. Run \"npm run screenshots:auth\" again, then retry \"npm run screenshots\".",
  );
}

export function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
