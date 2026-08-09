import assert from "node:assert/strict";
import test from "node:test";
import {
  createJobRequirementHandlers,
  type JobRequirementActions,
} from "../server/http/job-requirements-handler.ts";
import { JobRequirementNotFoundError } from "../server/services/job-requirements.ts";
import { JobRequirementMergeError } from "../server/services/job-requirements.ts";
import { JobRequirementSplitError } from "../server/services/job-requirements.ts";
import { JobRequirementReviewError } from "../server/services/job-requirements.ts";
import { JobNotFoundError } from "../server/services/saved-jobs.ts";

const requirement = {
  id: "requirement-1",
  jobId: "job-1",
  name: "TypeScript",
  type: "skill" as const,
  priority: "required" as const,
  createdAt: "2026-08-09T09:00:00.000Z",
  updatedAt: "2026-08-09T09:00:00.000Z",
};

function actions(overrides: Partial<JobRequirementActions> = {}): JobRequirementActions {
  return {
    list: async () => ({ status: "ok", data: [requirement] }),
    get: async () => ({ status: "ok", data: requirement }),
    create: async () => ({ status: "ok", data: requirement }),
    update: async () => ({ status: "ok", data: requirement }),
    remove: async () => ({ status: "ok", data: null }),
    merge: async () => ({ status: "ok", data: requirement }),
    split: async () => ({ status: "ok", data: [requirement, { ...requirement, id: "requirement-2" }] }),
    saveReview: async () => ({ status: "ok", data: [requirement] }),
    ...overrides,
  };
}

function jsonRequest(method: string, body: unknown) {
  return new Request("http://localhost/api/jobs/job-1/requirements", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("GET endpoints return requirements for the selected job", async () => {
  const handlers = createJobRequirementHandlers(actions());
  const list = await handlers.GET_LIST("job-1");
  const item = await handlers.GET_ITEM("job-1", "requirement-1");
  assert.deepEqual(await list.json(), { data: { requirements: [requirement], total: 1 } });
  assert.deepEqual(await item.json(), { data: { requirement } });
});

test("POST trims and creates a reviewable requirement", async () => {
  let received: unknown;
  const handlers = createJobRequirementHandlers(actions({
    create: async (_jobId, input) => {
      received = input;
      return { status: "ok", data: requirement };
    },
  }));
  const response = await handlers.POST(jsonRequest("POST", {
    name: " TypeScript ", type: "skill", priority: "required",
  }), "job-1");
  assert.equal(response.status, 201);
  assert.deepEqual(received, { name: "TypeScript", type: "skill", priority: "required" });
});

test("POST supports preferred requirements and rejects unknown priorities", async () => {
  let received: unknown;
  const handlers = createJobRequirementHandlers(actions({
    create: async (_jobId, input) => {
      received = input;
      return { status: "ok", data: { ...requirement, priority: input.priority } };
    },
  }));
  const preferred = await handlers.POST(jsonRequest("POST", {
    name: "GraphQL", type: "skill", priority: "preferred",
  }), "job-1");
  const invalid = await handlers.POST(jsonRequest("POST", {
    name: "GraphQL", type: "skill", priority: "optional",
  }), "job-1");

  assert.equal(preferred.status, 201);
  assert.deepEqual(received, { name: "GraphQL", type: "skill", priority: "preferred" });
  assert.equal(invalid.status, 400);
});

test("PATCH changes only editable requirement fields", async () => {
  let received: unknown;
  const handlers = createJobRequirementHandlers(actions({
    update: async (_jobId, _requirementId, input) => {
      received = input;
      return { status: "ok", data: requirement };
    },
  }));
  const response = await handlers.PATCH(
    jsonRequest("PATCH", { priority: "preferred" }),
    "job-1",
    "requirement-1",
  );
  assert.equal(response.status, 200);
  assert.deepEqual(received, { priority: "preferred" });
});

test("CRUD payloads reject persisted Fit Score status", async () => {
  const handlers = createJobRequirementHandlers(actions());
  const create = await handlers.POST(jsonRequest("POST", {
    name: "TypeScript", type: "skill", priority: "required", status: "proven",
  }), "job-1");
  const update = await handlers.PATCH(
    jsonRequest("PATCH", { status: "missing" }),
    "job-1",
    "requirement-1",
  );
  assert.equal(create.status, 400);
  assert.equal(update.status, 400);
});

test("DELETE returns no content and ownership misses return 404", async () => {
  const deleted = await createJobRequirementHandlers(actions()).DELETE("job-1", "requirement-1");
  const missingJob = await createJobRequirementHandlers(actions({
    list: async () => { throw new JobNotFoundError(); },
  })).GET_LIST("missing-job");
  const missingRequirement = await createJobRequirementHandlers(actions({
    get: async () => { throw new JobRequirementNotFoundError(); },
  })).GET_ITEM("job-1", "missing-requirement");
  assert.equal(deleted.status, 204);
  assert.equal(missingJob.status, 404);
  assert.equal(missingRequirement.status, 404);
});

test("requirement handlers enforce authentication", async () => {
  const response = await createJobRequirementHandlers(actions({
    list: async () => ({ status: "unauthenticated" }),
  })).GET_LIST("job-1");
  assert.equal(response.status, 401);
});

test("MERGE combines two unique requirements with an optional reviewed name", async () => {
  let received: unknown;
  const handlers = createJobRequirementHandlers(actions({
    merge: async (_jobId, input) => {
      received = input;
      return { status: "ok", data: { ...requirement, name: input.name ?? requirement.name } };
    },
  }));
  const response = await handlers.MERGE(jsonRequest("POST", {
    requirementIds: ["requirement-1", "requirement-2"],
    name: " React dan TypeScript ",
  }), "job-1");
  assert.equal(response.status, 200);
  assert.deepEqual(received, {
    requirementIds: ["requirement-1", "requirement-2"],
    name: "React dan TypeScript",
  });
});

test("MERGE rejects too few, duplicate, and mixed-classification inputs", async () => {
  const handlers = createJobRequirementHandlers(actions({
    merge: async () => { throw new JobRequirementMergeError(); },
  }));
  const tooFew = await handlers.MERGE(jsonRequest("POST", {
    requirementIds: ["requirement-1"],
  }), "job-1");
  const duplicate = await handlers.MERGE(jsonRequest("POST", {
    requirementIds: ["requirement-1", "requirement-1"],
  }), "job-1");
  const mixed = await handlers.MERGE(jsonRequest("POST", {
    requirementIds: ["requirement-1", "requirement-2"],
  }), "job-1");
  assert.equal(tooFew.status, 400);
  assert.equal(duplicate.status, 400);
  assert.equal(mixed.status, 409);
});

test("SPLIT creates reviewed parts that inherit source classification", async () => {
  let received: unknown;
  const parts = [
    { ...requirement, id: "requirement-a", name: "React" },
    { ...requirement, id: "requirement-b", name: "TypeScript" },
  ];
  const handlers = createJobRequirementHandlers(actions({
    split: async (_jobId, _requirementId, input) => {
      received = input;
      return { status: "ok", data: parts };
    },
  }));
  const response = await handlers.SPLIT(jsonRequest("POST", {
    names: [" React ", " TypeScript "],
  }), "job-1", "requirement-1");
  assert.equal(response.status, 200);
  assert.deepEqual(received, { names: ["React", "TypeScript"] });
  assert.deepEqual(await response.json(), { data: { requirements: parts, total: 2 } });
});

test("SPLIT rejects duplicate parts and exposes atomic split conflicts", async () => {
  const handlers = createJobRequirementHandlers(actions({
    split: async () => { throw new JobRequirementSplitError(); },
  }));
  const duplicate = await handlers.SPLIT(jsonRequest("POST", {
    names: ["React", "react"],
  }), "job-1", "requirement-1");
  const conflict = await handlers.SPLIT(jsonRequest("POST", {
    names: ["React", "TypeScript"],
  }), "job-1", "requirement-1");
  assert.equal(duplicate.status, 400);
  assert.equal(conflict.status, 409);
});

test("SAVE_REVIEW atomically accepts retained and new reviewed requirements", async () => {
  let received: unknown;
  const saved = [
    requirement,
    { ...requirement, id: "requirement-2", name: "Figma", type: "tool" as const },
  ];
  const handlers = createJobRequirementHandlers(actions({
    saveReview: async (_jobId, requirements) => {
      received = requirements;
      return { status: "ok", data: saved };
    },
  }));
  const response = await handlers.SAVE_REVIEW(jsonRequest("PUT", {
    requirements: [
      { id: " requirement-1 ", name: " TypeScript ", type: "skill", priority: "required" },
      { name: " Figma ", type: "tool", priority: "preferred" },
    ],
  }), "job-1");
  assert.equal(response.status, 200);
  assert.deepEqual(received, [
    { id: "requirement-1", name: "TypeScript", type: "skill", priority: "required" },
    { name: "Figma", type: "tool", priority: "preferred" },
  ]);
  assert.deepEqual(await response.json(), { data: { requirements: saved, total: 2 } });
});

test("SAVE_REVIEW supports an empty review and rejects status or duplicate IDs", async () => {
  const handlers = createJobRequirementHandlers(actions({
    saveReview: async () => ({ status: "ok", data: [] }),
  }));
  const empty = await handlers.SAVE_REVIEW(jsonRequest("PUT", { requirements: [] }), "job-1");
  const status = await handlers.SAVE_REVIEW(jsonRequest("PUT", { requirements: [
    { name: "TypeScript", type: "skill", priority: "required", status: "proven" },
  ] }), "job-1");
  const duplicate = await handlers.SAVE_REVIEW(jsonRequest("PUT", { requirements: [
    { id: "requirement-1", name: "React", type: "skill", priority: "required" },
    { id: "requirement-1", name: "TypeScript", type: "skill", priority: "required" },
  ] }), "job-1");
  assert.equal(empty.status, 200);
  assert.equal(status.status, 400);
  assert.equal(duplicate.status, 400);
});

test("SAVE_REVIEW exposes a stable atomic persistence conflict", async () => {
  const response = await createJobRequirementHandlers(actions({
    saveReview: async () => { throw new JobRequirementReviewError(); },
  })).SAVE_REVIEW(jsonRequest("PUT", { requirements: [] }), "job-1");
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.code, "REQUIREMENT_REVIEW_NOT_SAVED");
});
