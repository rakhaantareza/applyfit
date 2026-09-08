import assert from "node:assert/strict";
import test from "node:test";
import {
  CareerProfileQueryError,
  normalizeCareerProfile,
} from "../server/services/career-profile.ts";

test("normalizeCareerProfile maps database columns to the API contract", () => {
  assert.deepEqual(
    normalizeCareerProfile({
      id: "profile-1",
      target_role: "Frontend Developer",
      target_role_id: null,
      career_field: "Software Engineering",
      career_field_id: null,
      created_at: "2026-08-09T09:00:00.000Z",
      updated_at: "2026-08-09T10:00:00.000Z",
    }),
    {
      id: "profile-1",
      targetRole: "Frontend Developer",
      targetRoleId: null,
      careerField: "Software Engineering",
      careerFieldId: null,
      createdAt: "2026-08-09T09:00:00.000Z",
      updatedAt: "2026-08-09T10:00:00.000Z",
    },
  );
});

test("normalizeCareerProfile keeps an absent profile distinct from a query error", () => {
  assert.equal(normalizeCareerProfile(null), null);
});

test("normalizeCareerProfile rejects malformed database results", () => {
  assert.throws(
    () => normalizeCareerProfile({ id: "profile-without-required-fields" }),
    CareerProfileQueryError,
  );
});
