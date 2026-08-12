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

test("parseExtractedRequirements classifies technical competencies by meaning", () => {
  const requirements = parseExtractedRequirements({ requirements: [
    { name: "Experience with React", type: "experience", priority: "required" },
    { name: "Experience using TypeScript", type: "experience", priority: "required" },
    { name: "Experience working with REST APIs", type: "experience", priority: "required" },
    { name: "Knowledge of PostgreSQL", type: "experience", priority: "required" },
    { name: "Familiar with Docker", type: "experience", priority: "preferred" },
  ] });

  assert.deepEqual(requirements.map(({ name, type }) => ({ name, type })), [
    { name: "Experience with React", type: "skill" },
    { name: "Experience using TypeScript", type: "skill" },
    { name: "Experience working with REST APIs", type: "skill" },
    { name: "Knowledge of PostgreSQL", type: "skill" },
    { name: "Familiar with Docker", type: "skill" },
  ]);
});

test("parseExtractedRequirements keeps tenure and domain experience as context", () => {
  const requirements = parseExtractedRequirements({ requirements: [
    { name: "3+ years of professional experience", type: "experience", priority: "required" },
    { name: "Experience in the fintech domain", type: "experience", priority: "required" },
    { name: "Experience working in the healthcare industry", type: "experience", priority: "preferred" },
  ] });

  assert.deepEqual(requirements.map(({ name, type }) => ({ name, type })), [
    { name: "3+ years of professional experience", type: "experience" },
    { name: "Experience in the fintech domain", type: "experience" },
    { name: "Experience working in the healthcare industry", type: "experience" },
  ]);
});

test("parseExtractedRequirements rejects invented status and unsupported types", () => {
  assert.throws(() => parseExtractedRequirements({ requirements: [
    { name: "Jakarta", type: "location", priority: "required", status: "proven" },
  ] }), RequirementExtractionError);
});
