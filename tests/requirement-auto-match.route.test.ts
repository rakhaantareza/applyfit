import assert from "node:assert/strict";
import test from "node:test";
import { createRequirementAutoMatchHandler } from "../server/http/requirement-auto-match-handler.ts";
import { RequirementMappingsQueryError } from "../server/services/requirement-mappings.ts";
import { JobNotFoundError } from "../server/services/saved-jobs.ts";

const result = {
  matches: [{
    requirementId: "requirement-1",
    requirementName: "TypeScript",
    skillId: "skill-1",
    skillName: "typescript",
  }],
  createdCount: 1,
};

test("POST returns persisted exact-name matches without recommendation copy", async () => {
  const response = await createRequirementAutoMatchHandler(async () => ({
    status: "ok", data: result,
  }))("job-1");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    data: { matches: result.matches, total: 1, created: 1, strategy: "exact_name" },
  });
});

test("POST requires authentication and an owned job", async () => {
  const unauthenticated = await createRequirementAutoMatchHandler(async () => ({
    status: "unauthenticated",
  }))("job-1");
  const missing = await createRequirementAutoMatchHandler(async () => {
    throw new JobNotFoundError();
  })("missing-job");
  assert.equal(unauthenticated.status, 401);
  assert.equal(missing.status, 404);
});

test("POST exposes a stable mapping error", async () => {
  const response = await createRequirementAutoMatchHandler(async () => {
    throw new RequirementMappingsQueryError();
  })("job-1");
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error.code, "MAPPINGS_UNAVAILABLE");
});
