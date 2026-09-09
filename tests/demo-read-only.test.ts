import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createDemoMutationGuard,
  DEMO_SESSION_COOKIE,
  withDemoSessionCookie,
  withDemoMutationGuard,
} from "../server/http/demo-read-only.ts";

test("Demo mutations are rejected before the application handler runs", async () => {
  let mutationCalls = 0;
  const guard = createDemoMutationGuard(async () => true);
  const mutation = withDemoMutationGuard(async () => {
    mutationCalls += 1;
    return Response.json({ data: { updated: true } });
  }, guard);

  const response = await mutation();

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: {
      code: "DEMO_READ_ONLY",
      message: "Ruang demo hanya untuk dilihat. Perubahan tidak dapat disimpan.",
    },
  });
  assert.equal(mutationCalls, 0);
});

test("demo entry cookie is server-only and can be cleared by a normal login", async () => {
  const demoResponse = withDemoSessionCookie(Response.json({ data: true }), true);
  const normalResponse = withDemoSessionCookie(Response.json({ data: true }), false);
  const demoCookie = demoResponse.headers.get("set-cookie") ?? "";
  const normalCookie = normalResponse.headers.get("set-cookie") ?? "";

  assert.match(demoCookie, new RegExp(`^${DEMO_SESSION_COOKIE}=1;`));
  assert.match(demoCookie, /HttpOnly/);
  assert.match(demoCookie, /SameSite=Lax/);
  assert.match(demoCookie, /Max-Age=86400/);
  assert.match(normalCookie, new RegExp(`^${DEMO_SESSION_COOKIE}=;`));
  assert.match(normalCookie, /Max-Age=0/);
  assert.deepEqual(await demoResponse.json(), { data: true });
});

test("authenticated shells show one shared view-only notice only for demo sessions", async () => {
  const [notice, appShell, focusShell, provider, accountRoute, accountSettings] = await Promise.all([
    readFile(new URL("../app/components/DemoWorkspaceNotice.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/AppShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/JobFocusShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/AuthSessionProvider.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/account/profile/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/pengaturan/AccountSettings.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(notice, /if \(!user\?\.isDemo\) return null/);
  assert.match(notice, /Ruang demo hanya untuk dilihat\./);
  assert.match(notice, /Perubahan tidak dapat disimpan\./);
  assert.match(appShell, /<DemoWorkspaceNotice variant="app" \/>/);
  assert.match(focusShell, /<DemoWorkspaceNotice variant="focus" \/>/);
  assert.match(provider, /isDemo: account\.isDemo === true/);
  assert.match(accountRoute, /await isDemoSession\(\)/);
  assert.match(accountSettings, /if \(user\.isDemo\)/);
  assert.match(accountSettings, /setSecurityError\("Ruang demo hanya untuk dilihat\. Perubahan tidak dapat disimpan\."\)/);
  assert.doesNotMatch(notice, /DEMO_EMAIL|DEMO_READ_ONLY|InsForge/i);
});

test("normal authenticated users can still reach mutation handlers", async () => {
  let mutationCalls = 0;
  const guard = createDemoMutationGuard(async () => false);
  const mutation = withDemoMutationGuard(async () => {
    mutationCalls += 1;
    return Response.json({ data: { updated: true } });
  }, guard);

  const response = await mutation();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { updated: true } });
  assert.equal(mutationCalls, 1);
});

test("Demo reads and Auth/session routes remain outside the mutation guard", async () => {
  const [demoRoute, refreshRoute, signOutRoute, accountRoute, analysisRoute] =
    await Promise.all([
      readFile(new URL("../app/api/auth/demo/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/auth/refresh/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/auth/sign-out/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/account/profile/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/fit-score/summary/route.ts", import.meta.url), "utf8"),
    ]);

  assert.doesNotMatch(demoRoute, /protectDemoMutation|rejectDemoMutation/);
  assert.doesNotMatch(refreshRoute, /protectDemoMutation|rejectDemoMutation/);
  assert.doesNotMatch(signOutRoute, /protectDemoMutation|rejectDemoMutation/);
  assert.doesNotMatch(analysisRoute, /protectDemoMutation|rejectDemoMutation/);
  assert.match(accountRoute, /export const GET = handlers.GET/);
  assert.match(accountRoute, /export const PATCH = protectDemoMutation/);
});

test("all persisted application mutation routes use the shared Demo guard", async () => {
  const routes = [
    "../app/api/account/profile/route.ts",
    "../app/api/career-profile/route.ts",
    "../app/api/career-profile-skill-items/route.ts",
    "../app/api/career-profile-skill-items/[skillId]/route.ts",
    "../app/api/evidences/route.ts",
    "../app/api/evidences/[evidenceId]/route.ts",
    "../app/api/evidence-skill-links/[evidenceId]/route.ts",
    "../app/api/evidence-skill-links/[evidenceId]/[skillId]/route.ts",
    "../app/api/jobs/route.ts",
    "../app/api/jobs/[jobId]/route.ts",
    "../app/api/jobs/[jobId]/extract-requirements/route.ts",
    "../app/api/jobs/[jobId]/requirements/route.ts",
    "../app/api/jobs/[jobId]/requirements/review/route.ts",
    "../app/api/jobs/[jobId]/requirements/merge/route.ts",
    "../app/api/jobs/[jobId]/requirements/auto-match/route.ts",
    "../app/api/jobs/[jobId]/requirements/[requirementId]/route.ts",
    "../app/api/jobs/[jobId]/requirements/[requirementId]/split/route.ts",
    "../app/api/jobs/[jobId]/requirements/[requirementId]/without-evidence/route.ts",
    "../app/api/jobs/[jobId]/requirements/[requirementId]/mappings/route.ts",
    "../app/api/jobs/[jobId]/requirements/[requirementId]/mappings/[skillId]/route.ts",
  ];

  for (const route of routes) {
    const source = await readFile(new URL(route, import.meta.url), "utf8");
    assert.match(
      source,
      /protectDemoMutation|rejectDemoMutation/,
      route + " must use the shared Demo mutation guard",
    );
  }
});
