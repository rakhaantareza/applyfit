import { access } from "node:fs/promises";
import { SCREENSHOT_FONT_PROBES } from "./config.mjs";

const NAVIGATION_TIMEOUT_MS = 30_000;
const SERVER_CHECK_TIMEOUT_MS = 5_000;
const APP_ROUTE_PROBE_PATH = "/beranda";
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
    const routeUrl = new URL(APP_ROUTE_PROBE_PATH, candidate);
    try {
      const response = await fetch(routeUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(SERVER_CHECK_TIMEOUT_MS),
      });

      if (await isApplyFitRouteResponse(response, candidate)) return candidate;
      failures.push(
        `${routeUrl.href} did not serve the ApplyFit route (HTTP ${response.status})`,
      );
    } catch (error) {
      failures.push(`${routeUrl.href} failed: ${errorMessage(error)}`);
    }
  }

  throw new ScreenshotWorkflowError(
    `ApplyFit is not reachable. Tried ${candidates.join(" and ")}. Start the development server with "npm run dev" and try again. ${failures.join("; ")}`,
  );
}

async function isApplyFitRouteResponse(response, candidate) {
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) return false;

    const redirectUrl = new URL(location, candidate);
    return redirectUrl.origin === candidate && redirectUrl.pathname === "/login";
  }

  if (!response.ok) return false;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return false;

  const html = await response.text();
  return /ApplyFit/i.test(html);
}

function getLocalBaseUrlCandidates(baseUrl) {
  const url = new URL(baseUrl);
  if (!["127.0.0.1", "localhost"].includes(url.hostname)) return [url.origin];

  const localhostUrl = new URL(url.origin);
  localhostUrl.hostname = "localhost";
  const loopbackUrl = new URL(url.origin);
  loopbackUrl.hostname = "127.0.0.1";
  return [localhostUrl.origin, loopbackUrl.origin];
}

export async function verifyScreenshotRoutes(request, baseUrl, routes) {
  const failures = [];

  for (const route of routes) {
    const targetUrl = new URL(route.href ?? route.path, baseUrl);
    try {
      const response = await request.get(targetUrl.href, {
        failOnStatusCode: false,
        timeout: NAVIGATION_TIMEOUT_MS,
      });
      const finalUrl = new URL(response.url());

      if (!response.ok()) {
        failures.push(`${route.label} returned HTTP ${response.status()}`);
      } else if (
        finalUrl.origin !== baseUrl ||
        finalUrl.pathname !== route.path ||
        (targetUrl.search && finalUrl.search !== targetUrl.search)
      ) {
        failures.push(`${route.label} resolved to ${finalUrl.href}`);
      }
    } catch (error) {
      failures.push(`${route.label} failed: ${errorMessage(error)}`);
    }
  }

  if (failures.length > 0) {
    throw new ScreenshotWorkflowError(
      `Screenshot route verification failed for ${baseUrl}: ${failures.join("; ")}`,
    );
  }
}

export async function resolveScreenshotJob(request, baseUrl) {
  const jobsResponse = await request.get(new URL("/api/jobs", baseUrl).href, {
    failOnStatusCode: false,
  });
  if (jobsResponse.status() === 401) throw expiredStateError();

  const jobsBody = await readJsonResponse(jobsResponse);
  const jobs = Array.isArray(jobsBody?.data?.jobs)
    ? jobsBody.data.jobs.filter(
      (job) =>
        typeof job?.id === "string" && job.id &&
        typeof job?.title === "string" && typeof job?.company === "string",
    )
    : [];
  if (!jobsResponse.ok() || jobs.length === 0) {
    throw new ScreenshotWorkflowError(
      "The authenticated demo account has no existing job available for screenshot capture.",
    );
  }

  for (const job of jobs) {
    const encodedJobId = encodeURIComponent(job.id);
    const requirementsResponse = await request.get(
      new URL(`/api/jobs/${encodedJobId}/requirements`, baseUrl).href,
      { failOnStatusCode: false },
    );
    if (!requirementsResponse.ok()) continue;

    const requirementsBody = await readJsonResponse(requirementsResponse);
    if (!(Number(requirementsBody?.data?.total) > 0)) continue;

    const mappingResponse = await request.get(
      new URL(`/api/jobs/${encodedJobId}/requirements/mapping-summary`, baseUrl).href,
      { failOnStatusCode: false },
    );
    if (mappingResponse.ok()) return job;
  }

  throw new ScreenshotWorkflowError(
    "The authenticated demo account has no existing job with persisted requirements ready for detail, review, mapping, and analysis screenshots.",
  );
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
  const targetUrl = new URL(route.href ?? route.path, baseUrl);
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

  await settleResponsiveLayout(page, route.label);
  await throwIfRouteErrorVisible(page, route.label);
  assertExpectedPath(page.url(), route);
}

export async function openUnauthenticatedRoute(page, baseUrl, route) {
  const targetUrl = new URL(route.href ?? route.path, baseUrl);
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

  try {
    await page.locator(route.readySelector).waitFor({ state: "visible" });
    await page.waitForLoadState("networkidle", { timeout: NAVIGATION_TIMEOUT_MS });
  } catch (error) {
    throw new ScreenshotWorkflowError(
      `${route.label} did not reach its unauthenticated ready state within ${NAVIGATION_TIMEOUT_MS / 1000} seconds.`,
      { cause: error },
    );
  }

  await settleResponsiveLayout(page, route.label);
  assertUnauthenticatedPath(page.url(), route);
}

export function assertUnauthenticatedPath(currentUrl, route) {
  const url = new URL(currentUrl);
  const expectedUrl = new URL(route.href ?? route.path, url.origin);
  if (
    url.pathname !== route.path ||
    (expectedUrl.search && url.search !== expectedUrl.search)
  ) {
    throw new ScreenshotWorkflowError(
      `${route.label} redirected unexpectedly from ${expectedUrl.pathname}${expectedUrl.search} to ${url.pathname}${url.search}.`,
    );
  }
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
  let report;
  try {
    report = await page.evaluate(async (fontProbes) => {
      if (!document.fonts) return { supported: false };

      const loadResults = await Promise.all(
        fontProbes.map(async (probe) => ({
          family: probe.family,
          loadedCount: (await document.fonts.load(probe.descriptor, probe.sample)).length,
        })),
      );

      // Cover every additional face currently needed by rendered content.
      await document.fonts.ready;

      const normalizeFamily = (family) => family.replaceAll('"', "").replaceAll("'", "");
      const loadedFamilies = [...document.fonts]
        .filter((face) => face.status === "loaded")
        .map((face) => normalizeFamily(face.family));

      return {
        loadResults,
        loadedFamilies,
        status: document.fonts.status,
        supported: true,
      };
    }, SCREENSHOT_FONT_PROBES);
  } catch (error) {
    throw new ScreenshotWorkflowError(
      `Fonts did not finish loading for ${routeLabel}: ${errorMessage(error)}`,
      { cause: error },
    );
  }

  if (!report.supported) {
    throw new ScreenshotWorkflowError(
      `The browser does not expose document.fonts for ${routeLabel}; refusing to capture with unverified fallback fonts.`,
    );
  }

  const missingFamilies = SCREENSHOT_FONT_PROBES
    .filter((probe) => {
      const result = report.loadResults.find((entry) => entry.family === probe.family);
      return !result?.loadedCount || !report.loadedFamilies.includes(probe.family);
    })
    .map((probe) => probe.family);

  if (report.status !== "loaded" || missingFamilies.length > 0) {
    const detail = missingFamilies.length > 0
      ? ` Missing application font faces: ${missingFamilies.join(", ")}.`
      : "";
    throw new ScreenshotWorkflowError(
      `Application fonts were not fully loaded for ${routeLabel}; refusing to capture fallback typography.${detail}`,
    );
  }

  return report;
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

export async function settleResponsiveLayout(page, routeLabel = "the current page") {
  const fontReport = await waitForFonts(page, routeLabel);

  const layoutIsStable = await page.evaluate(async () => {
    await Promise.all(
      [...document.images]
        .filter((image) => image.complete)
        .map((image) => image.decode?.().catch(() => {})),
    );

    const nextFrame = () => new Promise((resolve) => window.requestAnimationFrame(resolve));
    const layoutSignature = () => {
      const root = document.documentElement;
      const body = document.body;
      const elementMetrics = [...body.querySelectorAll("*")]
        .filter(
          (element) =>
            element instanceof HTMLElement && element.getClientRects().length > 0,
        )
        .map((element) => [
          element.offsetLeft,
          element.offsetTop,
          element.offsetWidth,
          element.offsetHeight,
          element.scrollWidth,
          element.scrollHeight,
        ]);

      return JSON.stringify([
        root.clientWidth,
        root.clientHeight,
        root.scrollWidth,
        root.scrollHeight,
        body.scrollWidth,
        body.scrollHeight,
        elementMetrics,
      ]);
    };

    let previous = "";
    let stableFrames = 0;
    for (let frame = 0; frame < 30; frame += 1) {
      await nextFrame();
      const current = layoutSignature();
      stableFrames = current === previous ? stableFrames + 1 : 0;
      if (stableFrames >= 2) return true;
      previous = current;
    }
    return false;
  });

  if (!layoutIsStable) {
    throw new ScreenshotWorkflowError(
      `${routeLabel} did not reach a stable layout after its fonts loaded.`,
    );
  }

  return fontReport;
}

export function assertExpectedPath(currentUrl, route) {
  const url = new URL(currentUrl);
  if (url.pathname === "/login") throw expiredStateError();
  const expectedUrl = new URL(route.href ?? route.path, url.origin);
  if (
    url.pathname !== route.path ||
    (expectedUrl.search && url.search !== expectedUrl.search)
  ) {
    throw new ScreenshotWorkflowError(
      `${route.label} redirected unexpectedly from ${expectedUrl.pathname}${expectedUrl.search} to ${url.pathname}${url.search}.`,
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
