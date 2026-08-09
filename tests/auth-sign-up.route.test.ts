import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createSignUpHandler,
  type SignUpAction,
} from "../server/http/auth-sign-up-handler.ts";

function signUpRequest(body: unknown) {
  return new Request("http://localhost/api/auth/sign-up", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("POST registers through InsForge Auth and returns only safe user data", async () => {
  let receivedInput: Parameters<SignUpAction>[0] | null = null;
  const handler = createSignUpHandler(async (input) => {
    receivedInput = input;
    return {
      status: "ok",
      data: {
        user: {
          id: "user-1",
          email: input.email,
          emailVerified: false,
        },
        requireEmailVerification: true,
      },
    };
  });

  const response = await handler(signUpRequest({
    email: "  ARUNA@EXAMPLE.COM ",
    password: "aman123",
    name: "  Aruna   Wijaya ",
  }));
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(receivedInput, {
    email: "aruna@example.com",
    password: "aman123",
    name: "Aruna Wijaya",
  });
  assert.deepEqual(body, {
    data: {
      user: {
        id: "user-1",
        email: "aruna@example.com",
        emailVerified: false,
      },
      requireEmailVerification: true,
    },
  });
  assert.doesNotMatch(JSON.stringify(body), /password|accessToken|refreshToken/i);
});

test("POST rejects malformed registration input before calling Auth", async () => {
  let called = false;
  const handler = createSignUpHandler(async () => {
    called = true;
    throw new Error("should not run");
  });

  const response = await handler(signUpRequest({
    email: "bukan-email",
    password: "123",
  }));

  assert.equal(response.status, 400);
  assert.equal(called, false);
  assert.equal((await response.json()).error.code, "INVALID_SIGN_UP");
});

test("POST preserves safe Auth client errors and masks service failures", async () => {
  const duplicateHandler = createSignUpHandler(async () => ({
    status: "error",
    error: {
      code: "USER_ALREADY_EXISTS",
      message: "Akun dengan email tersebut sudah terdaftar.",
      statusCode: 409,
    },
  }));
  const unavailableHandler = createSignUpHandler(async () => {
    throw new Error("private backend detail");
  });

  const duplicateResponse = await duplicateHandler(signUpRequest({
    email: "aruna@example.com",
    password: "aman123",
  }));
  const unavailableResponse = await unavailableHandler(signUpRequest({
    email: "aruna@example.com",
    password: "aman123",
  }));

  assert.equal(duplicateResponse.status, 409);
  assert.equal((await duplicateResponse.json()).error.code, "USER_ALREADY_EXISTS");
  assert.equal(unavailableResponse.status, 503);
  assert.deepEqual(await unavailableResponse.json(), {
    error: {
      code: "AUTH_UNAVAILABLE",
      message: "Pendaftaran akun belum tersedia. Coba lagi.",
    },
  });
});

test("route implementation uses SSR auth actions instead of database inserts", async () => {
  const [source, authRouteSource] = await Promise.all([
    readFile(new URL("../app/api/auth/sign-up/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/insforge/auth-route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(authRouteSource, /createAuthActions/);
  assert.match(authRouteSource, /requestCookies:\s*request\.cookies/);
  assert.match(authRouteSource, /responseCookies:\s*cookieCarrier\.cookies/);
  assert.match(source, /createAuthRouteContext\(request\)/);
  assert.match(source, /withSessionCookies/);
  assert.match(source, /auth\.signUp\(input\)/);
  assert.doesNotMatch(`${source}\n${authRouteSource}`, /database|auth\.users|insert\(/i);
});
