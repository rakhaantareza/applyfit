import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createDemoSignInHandler,
  type DemoSignInAction,
} from "../server/http/auth-demo-handler.ts";

test("POST demo creates a safe session response without accepting credentials", async () => {
  let called = false;
  const action: DemoSignInAction = async () => {
    called = true;
    return {
      status: "ok",
      data: {
        user: {
          id: "demo-user",
          email: "demo@example.com",
          emailVerified: true,
        },
      },
    };
  };
  const response = await createDemoSignInHandler(action)();
  const body = await response.json();

  assert.equal(called, true);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(body.data.user, {
    id: "demo-user",
    email: "demo@example.com",
    emailVerified: true,
  });
  assert.doesNotMatch(JSON.stringify(body), /password|accessToken|refreshToken/i);
});

test("POST demo masks missing configuration and provider failures", async () => {
  const unavailable = await createDemoSignInHandler(async () => ({ status: "error" }))();
  const failed = await createDemoSignInHandler(async () => {
    throw new Error("private provider detail");
  })();

  for (const response of [unavailable, failed]) {
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: {
        code: "DEMO_UNAVAILABLE",
        message: "Demo belum dapat dibuka. Coba lagi.",
      },
    });
  }
});

test("demo route keeps credentials server-side and reuses production session cookies", async () => {
  const source = await readFile(
    new URL("../app/api/auth/demo/route.ts", import.meta.url),
    "utf8",
  );
  const loginSource = await readFile(
    new URL("../app/login/LoginForm.tsx", import.meta.url),
    "utf8",
  );
  const signInSource = await readFile(
    new URL("../app/api/auth/sign-in/route.ts", import.meta.url),
    "utf8",
  );
  const signOutSource = await readFile(
    new URL("../app/api/auth/sign-out/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /process\.env\.DEMO_EMAIL/);
  assert.match(source, /process\.env\.DEMO_PASSWORD/);
  assert.match(source, /createAuthRouteContext\(request\)/);
  assert.match(source, /withSessionCookies/);
  assert.match(source, /response\.ok \? withDemoSessionCookie\(response, true\) : response/);
  assert.match(source, /auth\.signInWithPassword/);
  assert.match(signInSource, /response\.ok \? withDemoSessionCookie\(response, false\) : response/);
  assert.match(signOutSource, /response\.ok \? withDemoSessionCookie\(response, false\) : response/);
  assert.match(loginSource, /fetch\("\/api\/auth\/demo"/);
  assert.doesNotMatch(loginSource, /DEMO_EMAIL|DEMO_PASSWORD|@gmail\.com|applyfit-demo/i);
});
