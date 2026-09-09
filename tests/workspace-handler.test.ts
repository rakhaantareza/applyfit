import assert from "node:assert/strict";
import test from "node:test";
import { createWorkspaceHandler } from "../server/http/workspace-handler.ts";

test("workspace handler loads only the requested scope", async () => {
  const calls: string[] = [];
  const handler = createWorkspaceHandler({
    dashboard: async () => { calls.push("dashboard"); return { jobs: 1 }; },
    profile: async () => { calls.push("profile"); return { skills: 2 }; },
    portfolio: async () => { calls.push("portfolio"); return { evidences: 3 }; },
    jobs: async () => { calls.push("jobs"); return { jobs: 4 }; },
  });

  const response = await handler(new Request("https://applyfit.test/api/workspace?scope=jobs"));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { jobs: 4 } });
  assert.deepEqual(calls, ["jobs"]);
});

test("workspace handler rejects an unknown scope", async () => {
  const handler = createWorkspaceHandler({
    dashboard: async () => ({}),
    profile: async () => ({}),
    portfolio: async () => ({}),
    jobs: async () => ({}),
  });

  const response = await handler(new Request("https://applyfit.test/api/workspace?scope=internal"));

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_SCOPE");
});

test("workspace handler normalizes loader failures", async () => {
  const fail = async () => { throw new Error("database detail"); };
  const handler = createWorkspaceHandler({
    dashboard: fail,
    profile: fail,
    portfolio: fail,
    jobs: fail,
  });

  const response = await handler(new Request("https://applyfit.test/api/workspace?scope=dashboard"));

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: { code: "WORKSPACE_UNAVAILABLE", message: "Data halaman belum dapat dimuat." },
  });
});
