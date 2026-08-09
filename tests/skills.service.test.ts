import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeSkill,
  normalizeSkills,
  SkillQueryError,
} from "../server/services/skills.ts";

const databaseSkill = {
  id: "skill-1",
  profile_id: "profile-1",
  name: "TypeScript",
  status: "active",
  level: "Menengah",
  created_at: "2026-08-09T09:00:00.000Z",
  updated_at: "2026-08-09T10:00:00.000Z",
};

test("normalizeSkill maps the persisted skill model", () => {
  assert.deepEqual(normalizeSkill(databaseSkill), {
    id: "skill-1",
    profileId: "profile-1",
    name: "TypeScript",
    status: "active",
    level: "Menengah",
    createdAt: "2026-08-09T09:00:00.000Z",
    updatedAt: "2026-08-09T10:00:00.000Z",
  });
});

test("normalizeSkills accepts nullable levels", () => {
  const [skill] = normalizeSkills([{ ...databaseSkill, level: null }]);
  assert.equal(skill.level, null);
});

test("normalizeSkill rejects status values outside the PRD", () => {
  assert.throws(
    () => normalizeSkill({ ...databaseSkill, status: "proven" }),
    SkillQueryError,
  );
});
