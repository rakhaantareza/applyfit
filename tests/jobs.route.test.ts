import assert from "node:assert/strict";
import test from "node:test";
import { createJobHandlers, type JobActions } from "../server/http/jobs-handler.ts";
import { JobNotFoundError } from "../server/services/saved-jobs.ts";

const job = {
  id: "job-1", title: "Frontend Developer", company: "Nusa Digital",
  source: "LinkedIn", sourceUrl: "https://example.com/job", location: "Jakarta",
  workArrangement: "Hybrid", rawDescription: "Build accessible web products.",
  createdAt: "2026-08-09T09:00:00.000Z", updatedAt: "2026-08-09T10:00:00.000Z",
};
const summary = {
  id: job.id,
  title: job.title,
  company: job.company,
  source: job.source,
  sourceUrl: job.sourceUrl,
  location: job.location,
  workArrangement: job.workArrangement,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
};

function actions(overrides: Partial<JobActions> = {}): JobActions {
  return {
    list: async () => ({ status: "ok", data: [summary] }),
    get: async () => ({ status: "ok", data: job }),
    create: async () => ({ status: "ok", data: job }),
    update: async () => ({ status: "ok", data: job }),
    remove: async () => ({ status: "ok", data: null }),
    ...overrides,
  };
}

function jsonRequest(method: string, body: unknown) {
  return new Request("http://localhost/api/jobs", {
    method, headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
}

test("GET list preserves the saved-job summary contract", async () => {
  const response = await createJobHandlers(actions()).GET_LIST();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { jobs: [summary], total: 1 } });
});

test("GET item returns the full raw job description", async () => {
  const response = await createJobHandlers(actions()).GET_ITEM("job-1");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { job } });
});

test("POST validates and creates a job", async () => {
  let received: unknown;
  const handlers = createJobHandlers(actions({ create: async (input) => {
    received = input; return { status: "ok", data: job };
  } }));
  const response = await handlers.POST(jsonRequest("POST", {
    title: " Frontend Developer ", company: " Nusa Digital ", source: "LinkedIn",
    sourceUrl: "https://example.com/job", location: "Jakarta",
    workArrangement: "Hybrid", rawDescription: " Build accessible web products. ",
  }));
  assert.equal(response.status, 201);
  assert.deepEqual(received, {
    title: "Frontend Developer", company: "Nusa Digital", source: "LinkedIn",
    sourceUrl: "https://example.com/job", location: "Jakarta",
    workArrangement: "Hybrid", rawDescription: "Build accessible web products.",
  });
});

test("PATCH supports focused job context changes", async () => {
  let received: unknown;
  const handlers = createJobHandlers(actions({ update: async (_id, input) => {
    received = input; return { status: "ok", data: job };
  } }));
  const response = await handlers.PATCH(jsonRequest("PATCH", { location: " Bandung " }), "job-1");
  assert.equal(response.status, 200);
  assert.deepEqual(received, { location: "Bandung" });
});

test("DELETE returns no content and missing jobs return 404", async () => {
  const deleted = await createJobHandlers(actions()).DELETE("job-1");
  const missing = await createJobHandlers(actions({
    get: async () => { throw new JobNotFoundError(); },
  })).GET_ITEM("missing-job");
  assert.equal(deleted.status, 204);
  assert.equal(missing.status, 404);
});

test("job handlers reject invalid and unauthenticated requests", async () => {
  const invalid = await createJobHandlers(actions()).POST(jsonRequest("POST", { title: "Frontend" }));
  const unauthenticated = await createJobHandlers(actions({
    list: async () => ({ status: "unauthenticated" }),
  })).GET_LIST();
  assert.equal(invalid.status, 400);
  assert.equal(unauthenticated.status, 401);
});
