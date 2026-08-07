import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeSavedJobs,
  SavedJobsQueryError,
} from "../server/services/saved-jobs.ts";

test("normalizeSavedJobs maps database columns to the API contract", () => {
  const jobs = normalizeSavedJobs([
    {
      id: "job-latest",
      title: "Frontend Developer",
      company: "Nusa Digital",
      source: "LinkedIn",
      source_url: "https://example.com/jobs/frontend",
      created_at: "2026-08-08T01:45:00.000Z",
      updated_at: "2026-08-08T02:00:00.000Z",
    },
  ]);

  assert.deepEqual(jobs, [
    {
      id: "job-latest",
      title: "Frontend Developer",
      company: "Nusa Digital",
      source: "LinkedIn",
      sourceUrl: "https://example.com/jobs/frontend",
      createdAt: "2026-08-08T01:45:00.000Z",
      updatedAt: "2026-08-08T02:00:00.000Z",
    },
  ]);
});

test("normalizeSavedJobs normalizes optional empty strings", () => {
  const [job] = normalizeSavedJobs([
    {
      id: "job-1",
      title: "UI Engineer",
      company: "PixelWorks",
      source: "",
      source_url: null,
      created_at: "2026-08-07T01:45:00.000Z",
      updated_at: "2026-08-07T01:45:00.000Z",
    },
  ]);

  assert.equal(job.source, null);
  assert.equal(job.sourceUrl, null);
});

test("normalizeSavedJobs rejects malformed database results", () => {
  assert.throws(
    () => normalizeSavedJobs([{ id: "job-without-required-fields" }]),
    SavedJobsQueryError,
  );
});
