import assert from "node:assert/strict";
import test from "node:test";
import {
  createRequirementMappingHandlers,
  type RequirementMappingActions,
} from "../server/http/requirement-mappings-handler.ts";
import {
  RequirementMappingConflictError,
  RequirementMappingNotFoundError,
  RequirementMappingTargetNotFoundError,
} from "../server/services/requirement-mappings.ts";

const mapping = {
  id: "mapping-1",
  requirementId: "requirement-1",
  skillId: "skill-1",
  userId: "user-1",
  createdAt: "2026-08-09T09:00:00.000Z",
  updatedAt: "2026-08-09T09:00:00.000Z",
};
const summary = {
  requirements: [],
  informationalRequirements: [],
  mappedCount: 0,
  unmappedCount: 0,
  totalMappableRequirements: 0,
  statusCounts: { proven: 0, partial: 0, learning: 0, missing: 0 },
};

function actions(overrides: Partial<RequirementMappingActions> = {}): RequirementMappingActions {
  return {
    create: async () => ({ status: "ok", data: mapping }),
    remove: async () => ({ status: "ok", data: null }),
    markWithoutEvidence: async () => ({
      status: "ok",
      data: { requirementId: "requirement-1", status: "missing" },
    }),
    summary: async () => ({ status: "ok", data: summary }),
    ...overrides,
  };
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/jobs/job-1/requirements/requirement-1/mappings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("POST creates an owned manual requirement-skill mapping", async () => {
  let received: unknown;
  const handlers = createRequirementMappingHandlers(actions({
    create: async (jobId, requirementId, skillId) => {
      received = { jobId, requirementId, skillId };
      return { status: "ok", data: mapping };
    },
  }));
  const response = await handlers.POST(
    jsonRequest({ skillId: " skill-1 " }),
    "job-1",
    "requirement-1",
  );
  assert.equal(response.status, 201);
  assert.deepEqual(received, {
    jobId: "job-1", requirementId: "requirement-1", skillId: "skill-1",
  });
  assert.deepEqual(await response.json(), { data: { mapping } });
});

test("DELETE removes the selected manual mapping", async () => {
  let received: unknown;
  const response = await createRequirementMappingHandlers(actions({
    remove: async (jobId, requirementId, skillId) => {
      received = { jobId, requirementId, skillId };
      return { status: "ok", data: null };
    },
  })).DELETE("job-1", "requirement-1", "skill-1");
  assert.equal(response.status, 204);
  assert.deepEqual(received, {
    jobId: "job-1", requirementId: "requirement-1", skillId: "skill-1",
  });
});

test("manual mapping endpoints validate IDs and authentication", async () => {
  const handlers = createRequirementMappingHandlers(actions());
  const invalid = await handlers.POST(jsonRequest({}), "job-1", "requirement-1");
  const unauthenticated = await createRequirementMappingHandlers(actions({
    create: async () => ({ status: "unauthenticated" }),
  })).POST(jsonRequest({ skillId: "skill-1" }), "job-1", "requirement-1");
  assert.equal(invalid.status, 400);
  assert.equal(unauthenticated.status, 401);
});

test("manual mapping endpoints expose target, duplicate, and missing-link errors", async () => {
  const target = await createRequirementMappingHandlers(actions({
    create: async () => { throw new RequirementMappingTargetNotFoundError(); },
  })).POST(jsonRequest({ skillId: "skill-1" }), "job-1", "requirement-1");
  const duplicate = await createRequirementMappingHandlers(actions({
    create: async () => { throw new RequirementMappingConflictError(); },
  })).POST(jsonRequest({ skillId: "skill-1" }), "job-1", "requirement-1");
  const missing = await createRequirementMappingHandlers(actions({
    remove: async () => { throw new RequirementMappingNotFoundError(); },
  })).DELETE("job-1", "requirement-1", "skill-1");
  assert.equal(target.status, 404);
  assert.equal(duplicate.status, 409);
  assert.equal(missing.status, 404);
});

test("without-evidence endpoint resolves the requirement as missing without a marker row", async () => {
  let marked: unknown;
  const handlers = createRequirementMappingHandlers(actions({
    markWithoutEvidence: async (jobId, requirementId) => {
      marked = { jobId, requirementId };
      return {
        status: "ok",
        data: { requirementId, status: "missing" },
      };
    },
  }));
  const create = await handlers.MARK_WITHOUT_EVIDENCE("job-1", "requirement-1");
  assert.equal(create.status, 200);
  assert.deepEqual(marked, { jobId: "job-1", requirementId: "requirement-1" });
  assert.deepEqual(await create.json(), {
    data: { requirementId: "requirement-1", status: "missing" },
  });
});

test("GET_SUMMARY returns the current mapping review state", async () => {
  const response = await createRequirementMappingHandlers(actions()).GET_SUMMARY("job-1");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: summary });
});
