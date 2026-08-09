import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createSignInHandler,
  createSignOutHandler,
  type SignInAction,
} from "../server/http/auth-session-handler.ts";

function signInRequest(body: unknown) {
  return new Request("http://localhost/api/auth/sign-in", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("POST sign-in normalizes credentials and returns safe identity data", async () => {
  let receivedInput: Parameters<SignInAction>[0] | null = null;
  const handler = createSignInHandler(async (input) => {
    receivedInput = input;
    return {
      status: "ok",
      data: {
        user: {
          id: "user-1",
          email: input.email,
          emailVerified: true,
        },
      },
    };
  });

  const response = await handler(signInRequest({
    email: " ARUNA@EXAMPLE.COM ",
    password: "aman123",
  }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(receivedInput, {
    email: "aruna@example.com",
    password: "aman123",
  });
  assert.equal(body.data.user.email, "aruna@example.com");
  assert.doesNotMatch(JSON.stringify(body), /password|accessToken|refreshToken/i);
});

test("POST sign-in rejects malformed input and preserves Auth failures", async () => {
  let called = false;
  const invalidHandler = createSignInHandler(async () => {
    called = true;
    throw new Error("should not run");
  });
  const deniedHandler = createSignInHandler(async () => ({
    status: "error",
    error: {
      code: "INVALID_CREDENTIALS",
      message: "Email atau kata sandi tidak sesuai.",
      statusCode: 401,
    },
  }));

  const invalidResponse = await invalidHandler(signInRequest({
    email: "invalid",
    password: "123",
  }));
  const deniedResponse = await deniedHandler(signInRequest({
    email: "aruna@example.com",
    password: "aman123",
  }));

  assert.equal(invalidResponse.status, 400);
  assert.equal(called, false);
  assert.equal(deniedResponse.status, 401);
  assert.equal((await deniedResponse.json()).error.code, "INVALID_CREDENTIALS");
});

test("POST sign-out is idempotent and returns no token-bearing body", async () => {
  let called = false;
  const handler = createSignOutHandler(async () => {
    called = true;
    return { status: "ok" };
  });

  const response = await handler();

  assert.equal(called, true);
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
});

test("session routes use SSR auth actions instead of custom session storage", async () => {
  const [signInSource, signOutSource, authRouteSource, providerSource] = await Promise.all([
    readFile(new URL("../app/api/auth/sign-in/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/sign-out/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/insforge/auth-route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/AuthSessionProvider.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(authRouteSource, /createAuthActions/);
  assert.match(authRouteSource, /requestCookies:\s*request\.cookies/);
  assert.match(authRouteSource, /responseCookies:\s*cookieCarrier\.cookies/);
  assert.match(authRouteSource, /cookieCarrier\.headers\.getSetCookie\(\)/);
  assert.doesNotMatch(authRouteSource, /cookieCarrier\.cookies\.getAll\(\)/);
  assert.doesNotMatch(authRouteSource, /createAuthActions\(\{\s*cookies:/);
  assert.match(signInSource, /createAuthRouteContext\(request\)/);
  assert.match(signInSource, /withSessionCookies/);
  assert.match(signInSource, /signInWithPassword/);
  assert.match(signOutSource, /createAuthRouteContext\(request\)/);
  assert.match(signOutSource, /withSessionCookies/);
  assert.match(signOutSource, /auth\.signOut\(\)/);
  assert.match(providerSource, /fetch\("\/api\/account\/profile"/);
  assert.doesNotMatch(providerSource, /auth\.getCurrentUser\(\)/);
  assert.doesNotMatch(
    `${signInSource}\n${signOutSource}\n${authRouteSource}`,
    /localStorage|database|auth\.users/i,
  );
});
