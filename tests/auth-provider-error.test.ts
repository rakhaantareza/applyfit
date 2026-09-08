import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  normalizeAuthProviderError,
  normalizeAuthProviderResponse,
} from "../server/http/auth-provider-error.ts";
import {
  createSignInHandler,
  createSignOutHandler,
} from "../server/http/auth-session-handler.ts";
import { createSignUpHandler } from "../server/http/auth-sign-up-handler.ts";
import { createVerifyEmailHandler } from "../server/http/auth-email-verification-handler.ts";

test("normalizes known provider failures without exposing raw messages", () => {
  const cases = [
    {
      flow: "sign-in" as const,
      provider: { error: "INVALID_CREDENTIALS", message: "Invalid credentials", statusCode: 401 },
      expected: {
        code: "INVALID_CREDENTIALS",
        message: "Email atau kata sandi salah.",
        statusCode: 401,
      },
    },
    {
      flow: "sign-up" as const,
      provider: { error: "USER_ALREADY_EXISTS", message: "User already exists", statusCode: 409 },
      expected: {
        code: "USER_ALREADY_EXISTS",
        message: "Email ini sudah terdaftar. Coba masuk atau gunakan email lain.",
        statusCode: 409,
      },
    },
    {
      flow: "verify-email" as const,
      provider: { error: "INVALID_INPUT", message: "Invalid or expired verification code", statusCode: 400 },
      expected: {
        code: "INVALID_VERIFICATION",
        message: "Kode verifikasi tidak valid atau sudah kedaluwarsa.",
        statusCode: 400,
      },
    },
  ];

  for (const { flow, provider, expected } of cases) {
    const normalized = normalizeAuthProviderError(provider, flow);
    assert.deepEqual(normalized, expected);
    assert.notEqual(normalized.message, provider.message);
  }
});

test("serialized Auth responses cannot contain provider messages", async () => {
  const signIn = createSignInHandler(async () => ({
    status: "error",
    error: normalizeAuthProviderError({ message: "Invalid credentials", statusCode: 401 }, "sign-in"),
  }));
  const signUp = createSignUpHandler(async () => ({
    status: "error",
    error: normalizeAuthProviderError({ message: "User already exists", statusCode: 409 }, "sign-up"),
  }));
  const verify = createVerifyEmailHandler(async () => ({
    status: "error",
    error: normalizeAuthProviderError(
      { message: "Invalid or expired verification code", statusCode: 400 },
      "verify-email",
    ),
  }));

  const responses = await Promise.all([
    signIn(jsonRequest("/api/auth/sign-in", {
      email: "aruna@example.com",
      password: "rahasia",
    })),
    signUp(jsonRequest("/api/auth/sign-up", {
      email: "aruna@example.com",
      password: "rahasia",
      name: "Aruna",
    })),
    verify(jsonRequest("/api/auth/verify-email", {
      email: "aruna@example.com",
      otp: "123456",
    })),
  ]);
  const bodies = await Promise.all(responses.map((response) => response.json()));

  assert.deepEqual(responses.map((response) => response.status), [401, 409, 400]);
  assert.deepEqual(bodies.map((body) => body.error.message), [
    "Email atau kata sandi salah.",
    "Email ini sudah terdaftar. Coba masuk atau gunakan email lain.",
    "Kode verifikasi tidak valid atau sudah kedaluwarsa.",
  ]);
  assert.doesNotMatch(
    JSON.stringify(bodies),
    /Invalid credentials|User already exists|Invalid or expired verification code/,
  );
});

function jsonRequest(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("masks unknown provider failures while preserving their status", () => {
  const providerMessage = "private provider stack trace";
  const normalized = normalizeAuthProviderError({
    error: "SOMETHING_INTERNAL",
    message: providerMessage,
    statusCode: 503,
  }, "sign-up");

  assert.deepEqual(normalized, {
    code: "AUTH_FAILED",
    message: "Terjadi kesalahan. Coba lagi.",
    statusCode: 503,
  });
  assert.doesNotMatch(JSON.stringify(normalized), /private|provider|stack|SOMETHING_INTERNAL/);

  assert.deepEqual(
    normalizeAuthProviderError({ error: "UNMAPPED", statusCode: 401 }, "sign-in"),
    { code: "AUTH_FAILED", message: "Terjadi kesalahan. Coba lagi.", statusCode: 401 },
  );
  assert.deepEqual(
    normalizeAuthProviderError({ error: "UNMAPPED", statusCode: 400 }, "verify-email"),
    { code: "AUTH_FAILED", message: "Terjadi kesalahan. Coba lagi.", statusCode: 400 },
  );
});

test("Auth route adapters normalize provider errors at the API boundary", async () => {
  const sources = await Promise.all([
    readFile(new URL("../app/api/auth/sign-in/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/sign-up/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/verify-email/route.ts", import.meta.url), "utf8"),
  ]);

  for (const source of sources) {
    assert.match(source, /error: normalizeAuthProviderError/);
  }
});


test("sign-out and refresh failures cannot expose provider details", async () => {
  const signOut = createSignOutHandler(async () => ({
    status: "error",
    error: normalizeAuthProviderError({
      error: "INTERNAL_PROVIDER_CODE",
      message: "private provider stack trace",
      statusCode: 401,
    }, "sign-out"),
  }));
  const refresh = normalizeAuthProviderResponse(
    Response.json({
      error: "AUTH_UNAUTHORIZED",
      message: "Refresh token cookie is missing",
      stack: "private provider stack trace",
    }, { status: 401 }),
    "refresh",
  );

  const [signOutResponse, signOutBody, refreshBody] = await Promise.all([
    signOut(),
    signOut().then((response) => response.json()),
    refresh.json(),
  ]);

  assert.equal(signOutResponse.status, 401);
  assert.equal(refresh.status, 401);
  assert.deepEqual(signOutBody, {
    error: { code: "AUTH_FAILED", message: "Terjadi kesalahan. Coba lagi." },
  });
  assert.deepEqual(refreshBody, {
    error: { code: "AUTH_FAILED", message: "Terjadi kesalahan. Coba lagi." },
  });
  assert.doesNotMatch(
    JSON.stringify([signOutBody, refreshBody]),
    /provider|stack|Refresh token|AUTH_UNAUTHORIZED|INTERNAL_PROVIDER_CODE/i,
  );
});

test("sign-out and refresh route adapters reuse approved normalization", async () => {
  const [signOutSource, refreshSource] = await Promise.all([
    readFile(new URL("../app/api/auth/sign-out/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/refresh/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(signOutSource, /normalizeAuthProviderError/);
  assert.match(refreshSource, /normalizeAuthProviderResponse/);
});
