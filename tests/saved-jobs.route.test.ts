import assert from "node:assert/strict";
import test from "node:test";
import { createSavedJobsHandler } from "../server/http/saved-jobs-handler.ts";
import { SavedJobsQueryError } from "../server/services/saved-jobs.ts";

const savedJob = {
  id: "job-latest",
  title: "Frontend Developer",
  company: "Nusa Digital",
  source: "LinkedIn",
  sourceUrl: "https://example.com/jobs/frontend",
  createdAt: "2026-08-08T01:45:00.000Z",
  updatedAt: "2026-08-08T02:00:00.000Z",
};

test("GET returns the current user's saved jobs", async () => {
  const GET = createSavedJobsHandler(async () => ({
    status: "ok",
    jobs: [savedJob],
  }));

  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    data: { jobs: [savedJob], total: 1 },
  });
});

test("GET returns an empty list without treating it as an error", async () => {
  const GET = createSavedJobsHandler(async () => ({
    status: "ok",
    jobs: [],
  }));

  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    data: { jobs: [], total: 0 },
  });
});

test("GET rejects unauthenticated requests", async () => {
  const GET = createSavedJobsHandler(async () => ({
    status: "unauthenticated",
  }));

  const response = await GET();

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, "UNAUTHENTICATED");
});

test("GET exposes a stable error when the database query fails", async () => {
  const GET = createSavedJobsHandler(async () => {
    throw new SavedJobsQueryError();
  });

  const response = await GET();

  assert.equal(response.status, 502);
  assert.equal((await response.json()).error.code, "SAVED_JOBS_UNAVAILABLE");
});
