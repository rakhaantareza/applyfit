import assert from "node:assert/strict";
import test from "node:test";
import {
  jobRequirements,
  requirementPriorityEnum,
  requirementStatusEnum,
  requirementTypeEnum,
} from "../db/schema.ts";

test("requirement type enum covers the complete MVP scoring scope", () => {
  assert.deepEqual(requirementTypeEnum.enumValues, [
    "skill",
    "tool",
    "education",
    "experience",
  ]);
});

test("job requirements store a required requirement type", () => {
  assert.equal(jobRequirements.type.notNull, true);
  assert.equal(jobRequirements.type.enumValues, requirementTypeEnum.enumValues);
});

test("job requirements persist priority and status for the score formula", () => {
  assert.deepEqual(requirementPriorityEnum.enumValues, ["required", "preferred"]);
  assert.deepEqual(requirementStatusEnum.enumValues, [
    "proven",
    "partial",
    "learning",
    "missing",
  ]);
  assert.equal(jobRequirements.priority.notNull, true);
  assert.equal(jobRequirements.status.notNull, true);
  assert.equal(jobRequirements.status.default, "missing");
});
