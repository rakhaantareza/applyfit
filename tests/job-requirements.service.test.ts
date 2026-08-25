import assert from "node:assert/strict";
import test from "node:test";
import {
  JobRequirementsQueryError,
  normalizeJobRequirement,
  normalizeJobRequirements,
} from "../server/services/job-requirements.ts";

const databaseRow = {
  id: "requirement-1",
  job_id: "job-1",
  name: "TypeScript",
  type: "skill",
  priority: "required",
  reviewed_without_evidence: true,
  created_at: "2026-08-09T09:00:00.000Z",
  updated_at: "2026-08-09T09:00:00.000Z",
};

test("normalizeJobRequirement maps the persisted review contract", () => {
  assert.deepEqual(normalizeJobRequirement(databaseRow), {
    id: "requirement-1",
    jobId: "job-1",
    name: "TypeScript",
    type: "skill",
    priority: "required",
    reviewedWithoutEvidence: true,
    createdAt: "2026-08-09T09:00:00.000Z",
    updatedAt: "2026-08-09T09:00:00.000Z",
  });
});

test("normalizeJobRequirements accepts every supported requirement type", () => {
  const requirements = normalizeJobRequirements(
    ["skill", "tool", "education", "experience"].map((type, index) => ({
      ...databaseRow,
      id: `requirement-${index}`,
      type,
      priority: index % 2 === 0 ? "required" : "preferred",
    })),
  );
  assert.deepEqual(requirements.map(({ type }) => type), [
    "skill", "tool", "education", "experience",
  ]);
  assert.deepEqual(requirements.map(({ priority }) => priority), [
    "required", "preferred", "required", "preferred",
  ]);
});

test("normalizeJobRequirement rejects status-bearing or malformed rows", () => {
  assert.throws(
    () => normalizeJobRequirement({ ...databaseRow, type: "location" }),
    JobRequirementsQueryError,
  );
});
