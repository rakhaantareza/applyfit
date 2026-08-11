import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  isProtectedApiRoute,
  unauthenticatedApiResponse,
} from "../server/http/api-route-protection.ts";

test("application APIs require authentication while auth bootstrap routes stay public", () => {
  const protectedRoutes = [
    "/api/career-profile",
    "/api/career-profile/skills",
    "/api/evidences",
    "/api/jobs",
    "/api/jobs/job-1/requirements",
    "/api/fit-score",
  ];
  const publicRoutes = [
    "/api/auth/sign-up",
    "/api/auth/sign-in",
    "/api/auth/sign-out",
    "/api/auth/refresh",
    "/api/auth/password-reset/request",
    "/api/auth/password-reset/confirm",
    "/api/auth/resend-verification",
    "/api/auth/verify-email",
    "/login",
  ];

  for (const pathname of protectedRoutes) {
    assert.equal(isProtectedApiRoute(pathname), true, pathname);
  }
  for (const pathname of publicRoutes) {
    assert.equal(isProtectedApiRoute(pathname), false, pathname);
  }
  assert.equal(isProtectedApiRoute("/api/auth/sign-in/"), false);
  assert.equal(isProtectedApiRoute("/api/auth/sign-in/unexpected"), true);
});

test("unauthenticated API response is stable and does not redirect", async () => {
  const response = unauthenticatedApiResponse();

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("location"), null);
  assert.deepEqual(await response.json(), {
    error: {
      code: "UNAUTHENTICATED",
      message: "Silakan masuk untuk mengakses data ApplyFit.",
    },
  });
});

test("Next.js proxy refreshes InsForge sessions before guarding APIs and app pages", async () => {
  const source = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");

  assert.match(source, /@insforge\/sdk\/ssr\/middleware/);
  assert.match(source, /await updateSession/);
  assert.match(
    source,
    /await updateSession[\s\S]+shouldRedirectAuthenticatedUserFromAuthPage/,
  );
  assert.match(source, /session\.accessToken/);
  assert.match(source, /"\/api\/:path\*"/);
  assert.match(source, /"\/login\/:path\*"/);
  assert.match(source, /"\/daftar\/:path\*"/);
  assert.match(source, /"\/pengaturan\/:path\*"/);
  assert.match(source, /shouldRedirectAuthenticatedUserFromAuthPage/);
  assert.match(source, /NextResponse\.redirect\(new URL\("\/beranda"/);
  assert.match(source, /NextResponse\.redirect/);
});
