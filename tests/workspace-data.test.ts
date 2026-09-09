import assert from "node:assert/strict";
import test from "node:test";
import { attachRequirementCounts } from "../server/services/workspace-data.ts";
import type { JobRequirement } from "../server/services/job-requirements.ts";
import type { SavedJob } from "../server/services/saved-jobs.ts";

const jobs: SavedJob[] = [
  {
    id: "job-1",
    title: "Frontend Engineer",
    company: "Northstar Labs",
    source: null,
    sourceUrl: null,
    location: null,
    workArrangement: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "job-2",
    title: "Product Engineer",
    company: "Atlas",
    source: null,
    sourceUrl: null,
    location: null,
    workArrangement: null,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
];

function requirement(id: string, jobId: string): JobRequirement {
  return {
    id,
    jobId,
    name: "React",
    type: "skill",
    priority: "required",
    reviewedWithoutEvidence: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

test("attachRequirementCounts derives every job count from one requirement collection", () => {
  assert.deepEqual(
    attachRequirementCounts(jobs, [
      requirement("requirement-1", "job-1"),
      requirement("requirement-2", "job-1"),
    ]).map(({ id, requirementCount }) => ({ id, requirementCount })),
    [
      { id: "job-1", requirementCount: 2 },
      { id: "job-2", requirementCount: 0 },
    ],
  );
});

test("attachRequirementCounts does not mutate saved jobs", () => {
  const result = attachRequirementCounts(jobs, [requirement("requirement-1", "job-1")]);

  assert.equal("requirementCount" in jobs[0], false);
  assert.notEqual(result[0], jobs[0]);
});
