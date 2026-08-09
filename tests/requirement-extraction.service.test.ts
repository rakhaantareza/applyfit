import assert from "node:assert/strict";
import test from "node:test";
import {
  parseExtractedRequirements,
  RequirementExtractionError,
} from "../server/services/requirement-extraction.ts";

test("parseExtractedRequirements validates and normalizes the AI draft", () => {
  assert.deepEqual(parseExtractedRequirements({ requirements: [
    { name: " TypeScript ", type: "skill", priority: "required" },
    { name: "Figma", type: "tool", priority: "preferred" },
  ] }), [
    { name: "TypeScript", type: "skill", priority: "required" },
    { name: "Figma", type: "tool", priority: "preferred" },
  ]);
});

test("parseExtractedRequirements removes exact duplicate drafts", () => {
  const requirements = parseExtractedRequirements({ requirements: [
    { name: "TypeScript", type: "skill", priority: "required" },
    { name: "typescript", type: "skill", priority: "required" },
  ] });
  assert.equal(requirements.length, 1);
});

test("parseExtractedRequirements rejects invented status and unsupported types", () => {
  assert.throws(() => parseExtractedRequirements({ requirements: [
    { name: "Jakarta", type: "location", priority: "required", status: "proven" },
  ] }), RequirementExtractionError);
});
