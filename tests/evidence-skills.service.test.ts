import assert from "node:assert/strict";
import test from "node:test";
import {
  EvidenceSkillQueryError,
  normalizeEvidenceSkillLink,
} from "../server/services/evidence-skills.ts";

test("normalizeEvidenceSkillLink maps the join table contract", () => {
  assert.deepEqual(normalizeEvidenceSkillLink({
    evidence_id: "evidence-1",
    skill_id: "skill-1",
    created_at: "2026-08-09T10:00:00.000Z",
  }), {
    evidenceId: "evidence-1",
    skillId: "skill-1",
    createdAt: "2026-08-09T10:00:00.000Z",
  });
});

test("normalizeEvidenceSkillLink rejects malformed relation rows", () => {
  assert.throws(
    () => normalizeEvidenceSkillLink({ evidence_id: "evidence-1" }),
    EvidenceSkillQueryError,
  );
});
