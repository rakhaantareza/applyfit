import assert from "node:assert/strict";
import test from "node:test";
import {
  createResendVerificationHandler,
  createVerifyEmailHandler,
} from "../server/http/auth-email-verification-handler.ts";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/verify-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("email verification normalizes identity and accepts only six digit codes", async () => {
  let received: { email: string; otp: string } | null = null;
  const handler = createVerifyEmailHandler(async (input) => {
    received = input;
    return { status: "ok" };
  });

  const response = await handler(jsonRequest({
    email: " ARUNA@EXAMPLE.COM ",
    otp: "123456",
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(received, { email: "aruna@example.com", otp: "123456" });
  assert.deepEqual(await response.json(), { data: { verified: true } });

  const invalid = await handler(jsonRequest({ email: "aruna@example.com", otp: "123" }));
  assert.equal(invalid.status, 400);
});

test("resend verification preserves rate limiting without exposing provider details", async () => {
  const handler = createResendVerificationHandler(async () => ({
    status: "error",
    error: { statusCode: 429 },
  }));
  const response = await handler(jsonRequest({ email: "aruna@example.com" }));

  assert.equal(response.status, 429);
  assert.equal((await response.json()).error.code, "VERIFICATION_RATE_LIMITED");
});
