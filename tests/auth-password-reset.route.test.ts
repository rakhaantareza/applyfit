import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createPasswordResetConfirmHandler,
  createPasswordResetRequestHandler,
  type PasswordResetConfirmAction,
  type PasswordResetRequestAction,
} from "../server/http/auth-password-reset-handler.ts";

function resetRequest(body: unknown) {
  return new Request("http://localhost/api/auth/password-reset/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("POST accepts a normalized email without revealing account existence", async () => {
  let receivedEmail = "";
  const handler = createPasswordResetRequestHandler(async (email) => {
    receivedEmail = email;
    return { status: "ok" };
  });

  const response = await handler(resetRequest({ email: " ARUNA@EXAMPLE.COM " }));
  const body = await response.json();

  assert.equal(response.status, 202);
  assert.equal(receivedEmail, "aruna@example.com");
  assert.deepEqual(body, {
    data: {
      accepted: true,
      message: "Jika akun terdaftar, instruksi reset akan dikirim ke email tersebut.",
    },
  });
});

test("POST rejects malformed email before invoking InsForge Auth", async () => {
  let called = false;
  const action: PasswordResetRequestAction = async () => {
    called = true;
    return { status: "ok" };
  };
  const handler = createPasswordResetRequestHandler(action);

  const response = await handler(resetRequest({ email: "tidak-valid" }));

  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test("POST exposes rate limiting without leaking provider details", async () => {
  const handler = createPasswordResetRequestHandler(async () => ({
    status: "error",
    statusCode: 429,
  }));

  const response = await handler(resetRequest({ email: "aruna@example.com" }));
  const body = await response.json();

  assert.equal(response.status, 429);
  assert.deepEqual(body.error, {
    code: "RESET_RATE_LIMITED",
    message: "Tunggu sebentar sebelum meminta kode baru.",
  });
});

test("route delegates delivery to InsForge Auth", async () => {
  const source = await readFile(
    new URL("../app/api/auth/password-reset/request/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /createInsForgeServerClient/);
  assert.match(source, /auth\.sendResetPasswordEmail\(\{ email \}\)/);
  assert.doesNotMatch(source, /database|auth\.users|insert\(/i);
});

function confirmRequest(body: unknown) {
  return new Request("http://localhost/api/auth/password-reset/confirm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("POST confirmation validates OTP input and stores no reset token in its response", async () => {
  let receivedInput: Parameters<PasswordResetConfirmAction>[0] | null = null;
  const handler = createPasswordResetConfirmHandler(async (input) => {
    receivedInput = input;
    return { status: "ok" };
  });

  const response = await handler(confirmRequest({
    email: " ARUNA@EXAMPLE.COM ",
    code: "123456",
    newPassword: "baru123",
  }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(receivedInput, {
    email: "aruna@example.com",
    code: "123456",
    newPassword: "baru123",
  });
  assert.equal(body.data.updated, true);
  assert.doesNotMatch(JSON.stringify(body), /password|token|otp/i);
});

test("POST confirmation rejects malformed and expired reset requests safely", async () => {
  let called = false;
  const invalidHandler = createPasswordResetConfirmHandler(async () => {
    called = true;
    return { status: "ok" };
  });
  const expiredHandler = createPasswordResetConfirmHandler(async () => ({
    status: "error",
    statusCode: 400,
  }));

  const invalidResponse = await invalidHandler(confirmRequest({
    email: "aruna@example.com",
    code: "123",
    newPassword: "pendek",
  }));
  const expiredResponse = await expiredHandler(confirmRequest({
    email: "aruna@example.com",
    code: "123456",
    newPassword: "baru123",
  }));

  assert.equal(invalidResponse.status, 400);
  assert.equal(called, false);
  assert.equal(expiredResponse.status, 400);
  assert.equal((await expiredResponse.json()).error.code, "INVALID_OR_EXPIRED_RESET");
});

test("confirmation route exchanges the code and resets through InsForge Auth server-side", async () => {
  const source = await readFile(
    new URL("../app/api/auth/password-reset/confirm/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /exchangeResetPasswordToken/);
  assert.match(source, /auth\.resetPassword/);
  assert.doesNotMatch(source, /database|auth\.users|insert\(/i);
});
