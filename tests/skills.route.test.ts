import assert from "node:assert/strict";
import test from "node:test";
import { createSkillsHandlers, type SkillsActions } from "../server/http/skills-handler.ts";
import { SkillConflictError, SkillNotFoundError } from "../server/services/skills.ts";

const skill = {
  id: "skill-1",
  profileId: "profile-1",
  name: "TypeScript",
  status: "active" as const,
  level: "Menengah",
  createdAt: "2026-08-09T09:00:00.000Z",
  updatedAt: "2026-08-09T10:00:00.000Z",
};

function actions(overrides: Partial<SkillsActions> = {}): SkillsActions {
  return {
    list: async () => ({ status: "ok", data: [skill] }),
    create: async () => ({ status: "ok", data: skill }),
    update: async () => ({ status: "ok", data: skill }),
    remove: async () => ({ status: "ok", data: null }),
    ...overrides,
  };
}

function jsonRequest(method: string, body: unknown) {
  return new Request("http://localhost/api/career-profile/skills", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("GET lists skills with a total", async () => {
  const response = await createSkillsHandlers(actions()).GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { skills: [skill], total: 1 } });
});

test("POST validates and creates a skill", async () => {
  let received: unknown;
  const handlers = createSkillsHandlers(actions({
    create: async (input) => {
      received = input;
      return { status: "ok", data: skill };
    },
  }));
  const response = await handlers.POST(jsonRequest("POST", {
    name: " TypeScript ", status: "active", level: " Menengah ",
  }));
  assert.equal(response.status, 201);
  assert.deepEqual(received, { name: "TypeScript", status: "active", level: "Menengah" });
});

test("PATCH supports focused skill changes", async () => {
  let received: unknown;
  const handlers = createSkillsHandlers(actions({
    update: async (_id, input) => {
      received = input;
      return { status: "ok", data: skill };
    },
  }));
  const response = await handlers.PATCH(jsonRequest("PATCH", { status: "learning" }), "skill-1");
  assert.equal(response.status, 200);
  assert.deepEqual(received, { status: "learning" });
});

test("DELETE returns no content", async () => {
  const response = await createSkillsHandlers(actions()).DELETE("skill-1");
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
});

test("skill handlers reject invalid and unauthenticated requests", async () => {
  const invalid = await createSkillsHandlers(actions()).POST(
    jsonRequest("POST", { name: "TypeScript", status: "proven", level: "Mahir" }),
  );
  const unauthenticated = await createSkillsHandlers(actions({
    list: async () => ({ status: "unauthenticated" }),
  })).GET();
  assert.equal(invalid.status, 400);
  assert.equal(unauthenticated.status, 401);
});

test("skill handlers expose conflict and not-found errors", async () => {
  const conflict = await createSkillsHandlers(actions({
    create: async () => { throw new SkillConflictError(); },
  })).POST(jsonRequest("POST", { name: "TypeScript", status: "active", level: null }));
  const missing = await createSkillsHandlers(actions({
    remove: async () => { throw new SkillNotFoundError(); },
  })).DELETE("missing-skill");
  assert.equal(conflict.status, 409);
  assert.equal(missing.status, 404);
});
