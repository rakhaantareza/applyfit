import assert from "node:assert/strict";
import test from "node:test";
import {
  createEvidenceSkillHandlers,
  type EvidenceSkillActions,
} from "../server/http/evidence-skills-handler.ts";
import {
  EvidenceSkillConflictError,
  EvidenceSkillLinkNotFoundError,
} from "../server/services/evidence-skills.ts";

const link = {
  evidenceId: "evidence-1",
  skillId: "skill-1",
  createdAt: "2026-08-09T10:00:00.000Z",
};

function actions(overrides: Partial<EvidenceSkillActions> = {}): EvidenceSkillActions {
  return {
    list: async () => ({ status: "ok", data: [link] }),
    link: async () => ({ status: "ok", data: link }),
    unlink: async () => ({ status: "ok", data: null }),
    ...overrides,
  };
}

test("GET lists links for one evidence", async () => {
  const response = await createEvidenceSkillHandlers(actions()).GET("evidence-1");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { links: [link], total: 1 } });
});

test("POST links evidence to a skill", async () => {
  let received: unknown;
  const handlers = createEvidenceSkillHandlers(actions({
    link: async (evidenceId, skillId) => {
      received = { evidenceId, skillId };
      return { status: "ok", data: link };
    },
  }));
  const response = await handlers.POST(new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ skillId: " skill-1 " }),
  }), "evidence-1");
  assert.equal(response.status, 201);
  assert.deepEqual(received, { evidenceId: "evidence-1", skillId: "skill-1" });
});

test("DELETE unlinks evidence and skill", async () => {
  const response = await createEvidenceSkillHandlers(actions()).DELETE("evidence-1", "skill-1");
  assert.equal(response.status, 204);
});

test("handlers reject invalid and unauthenticated requests", async () => {
  const invalid = await createEvidenceSkillHandlers(actions()).POST(
    new Request("http://localhost", { method: "POST", body: "{}" }),
    "evidence-1",
  );
  const unauthenticated = await createEvidenceSkillHandlers(actions({
    list: async () => ({ status: "unauthenticated" }),
  })).GET("evidence-1");
  assert.equal(invalid.status, 400);
  assert.equal(unauthenticated.status, 401);
});

test("handlers expose duplicate and missing-link errors", async () => {
  const duplicate = await createEvidenceSkillHandlers(actions({
    link: async () => { throw new EvidenceSkillConflictError(); },
  })).POST(new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ skillId: "skill-1" }),
  }), "evidence-1");
  const missing = await createEvidenceSkillHandlers(actions({
    unlink: async () => { throw new EvidenceSkillLinkNotFoundError(); },
  })).DELETE("evidence-1", "skill-1");
  assert.equal(duplicate.status, 409);
  assert.equal(missing.status, 404);
});
