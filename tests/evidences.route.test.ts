import assert from "node:assert/strict";
import test from "node:test";
import { createEvidenceHandlers, type EvidenceActions } from "../server/http/evidences-handler.ts";
import { EvidenceNotFoundError } from "../server/services/evidences.ts";

const evidence = {
  id: "evidence-1",
  profileId: "profile-1",
  title: "Dashboard analytics",
  type: "project" as const,
  url: "https://github.com/example/dashboard",
  description: "Membangun dashboard dengan React dan TypeScript.",
  createdAt: "2026-08-09T09:00:00.000Z",
  updatedAt: "2026-08-09T10:00:00.000Z",
};

function actions(overrides: Partial<EvidenceActions> = {}): EvidenceActions {
  return {
    list: async () => ({ status: "ok", data: [evidence] }),
    create: async () => ({ status: "ok", data: evidence }),
    update: async () => ({ status: "ok", data: evidence }),
    remove: async () => ({ status: "ok", data: null }),
    ...overrides,
  };
}

function jsonRequest(method: string, body: unknown) {
  return new Request("http://localhost/api/evidences", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("GET lists evidence with a total", async () => {
  const response = await createEvidenceHandlers(actions()).GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    data: { evidences: [evidence], total: 1 },
    filters: {},
  });
});

test("GET passes text, type, and skill filters to the evidence service", async () => {
  let received: unknown;
  const handlers = createEvidenceHandlers(actions({
    list: async (filters) => {
      received = filters;
      return { status: "ok", data: [evidence] };
    },
  }));
  const response = await handlers.GET(new Request(
    "http://localhost/api/evidences?q=dashboard&type=project&skillId=skill-1",
  ));
  assert.equal(response.status, 200);
  assert.deepEqual(received, {
    query: "dashboard",
    type: "project",
    skillId: "skill-1",
  });
});

test("GET rejects unsupported evidence type filters", async () => {
  const response = await createEvidenceHandlers(actions()).GET(
    new Request("http://localhost/api/evidences?type=course"),
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_EVIDENCE_FILTER");
});

test("POST validates, trims, and creates evidence", async () => {
  let received: unknown;
  const handlers = createEvidenceHandlers(actions({
    create: async (input) => {
      received = input;
      return { status: "ok", data: evidence };
    },
  }));
  const response = await handlers.POST(jsonRequest("POST", {
    title: " Dashboard analytics ",
    type: "project",
    url: " https://github.com/example/dashboard ",
    description: " React dashboard ",
  }));
  assert.equal(response.status, 201);
  assert.deepEqual(received, {
    title: "Dashboard analytics",
    type: "project",
    url: "https://github.com/example/dashboard",
    description: "React dashboard",
  });
});

test("PATCH supports clearing an optional evidence URL", async () => {
  let received: unknown;
  const handlers = createEvidenceHandlers(actions({
    update: async (_id, input) => {
      received = input;
      return { status: "ok", data: { ...evidence, url: null } };
    },
  }));
  const response = await handlers.PATCH(jsonRequest("PATCH", { url: "" }), "evidence-1");
  assert.equal(response.status, 200);
  assert.deepEqual(received, { url: null });
});

test("DELETE returns no content", async () => {
  const response = await createEvidenceHandlers(actions()).DELETE("evidence-1");
  assert.equal(response.status, 204);
});

test("handlers reject invalid types and unauthenticated access", async () => {
  const invalid = await createEvidenceHandlers(actions()).POST(jsonRequest("POST", {
    title: "Course", type: "course", url: null, description: "Course completion",
  }));
  const unauthenticated = await createEvidenceHandlers(actions({
    list: async () => ({ status: "unauthenticated" }),
  })).GET();
  assert.equal(invalid.status, 400);
  assert.equal(unauthenticated.status, 401);
});

test("handlers return not found for evidence outside the owned profile", async () => {
  const response = await createEvidenceHandlers(actions({
    remove: async () => { throw new EvidenceNotFoundError(); },
  })).DELETE("missing-evidence");
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "EVIDENCE_NOT_FOUND");
});
