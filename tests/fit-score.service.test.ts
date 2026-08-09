import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateFitScore,
  deriveRequirementStatus,
  PRIORITY_WEIGHTS,
  STATUS_MULTIPLIERS,
  type FitRequirementInput,
} from "../server/services/fit-score.ts";

test("derives requirement status from mappings, skill state, and evidence", () => {
  assert.equal(deriveRequirementStatus([]), "missing");
  assert.equal(
    deriveRequirementStatus([{ skill: null, linkedEvidenceIds: [] }]),
    "missing",
  );
  assert.equal(
    deriveRequirementStatus([
      {
        skill: { id: "typescript", status: "learning" },
        linkedEvidenceIds: [],
      },
    ]),
    "learning",
  );
  assert.equal(
    deriveRequirementStatus([
      {
        skill: { id: "typescript", status: "active" },
        linkedEvidenceIds: [],
      },
    ]),
    "partial",
  );
  assert.equal(
    deriveRequirementStatus([
      {
        skill: { id: "typescript", status: "active" },
        linkedEvidenceIds: ["dashboard-project"],
      },
    ]),
    "proven",
  );
});

test("uses the strongest derived status when a requirement has multiple mappings", () => {
  assert.equal(
    deriveRequirementStatus([
      {
        skill: { id: "react", status: "learning" },
        linkedEvidenceIds: [],
      },
      {
        skill: { id: "nextjs", status: "active" },
        linkedEvidenceIds: ["inventory-project"],
      },
    ]),
    "proven",
  );
});

test("keeps learning skills in Learning even when evidence is already linked", () => {
  assert.equal(
    deriveRequirementStatus([
      {
        skill: { id: "typescript", status: "learning" },
        linkedEvidenceIds: ["course-project"],
      },
    ]),
    "learning",
  );
});

test("does not treat stale evidence without a linked skill as readiness", () => {
  assert.equal(
    deriveRequirementStatus([
      { skill: null, linkedEvidenceIds: ["stale-evidence"] },
    ]),
    "missing",
  );
});

test("Partial outranks Learning when multiple valid skills are mapped", () => {
  assert.equal(
    deriveRequirementStatus([
      {
        skill: { id: "react", status: "learning" },
        linkedEvidenceIds: ["learning-project"],
      },
      {
        skill: { id: "typescript", status: "active" },
        linkedEvidenceIds: [],
      },
    ]),
    "partial",
  );
});

test("calculates the PRD example as 87.5 percent", () => {
  const result = calculateFitScore([
    {
      id: "requirement-a",
      type: "skill",
      priority: "required",
      status: "proven",
    },
    {
      id: "requirement-b",
      type: "tool",
      priority: "preferred",
      status: "partial",
    },
  ]);

  assert.equal(result.currentPoints, 3.5);
  assert.equal(result.maximumPoints, 4);
  assert.equal(result.score, 87.5);
});

test("uses priority weights 3 and 1", () => {
  assert.deepEqual(PRIORITY_WEIGHTS, { required: 3, preferred: 1 });

  const result = calculateFitScore([
    {
      id: "required",
      type: "skill",
      priority: "required",
      status: "proven",
    },
    {
      id: "preferred",
      type: "skill",
      priority: "preferred",
      status: "proven",
    },
  ]);

  assert.equal(result.breakdown[0]?.maximum, 3);
  assert.equal(result.breakdown[1]?.maximum, 1);
});

test("applies every requirement status multiplier", () => {
  assert.deepEqual(STATUS_MULTIPLIERS, {
    proven: 100,
    partial: 50,
    learning: 20,
    missing: 0,
  });

  const statuses: FitRequirementInput["status"][] = [
    "proven",
    "partial",
    "learning",
    "missing",
  ];
  const result = calculateFitScore(
    statuses.map((status) => ({
      id: status,
      type: "skill",
      priority: "required",
      status,
    })),
  );

  assert.deepEqual(
    result.breakdown.map((requirement) => requirement.earned),
    [3, 1.5, 0.6, 0],
  );
  assert.equal(result.currentPoints, 5.1);
  assert.equal(result.maximumPoints, 12);
  assert.equal(result.score, 42.5);
});

test("excludes education and experience from the MVP score", () => {
  const result = calculateFitScore([
    {
      id: "skill",
      type: "skill",
      priority: "preferred",
      status: "proven",
    },
    {
      id: "education",
      type: "education",
      priority: "required",
      status: "proven",
    },
    {
      id: "experience",
      type: "experience",
      priority: "required",
      status: "proven",
    },
  ]);

  assert.equal(result.score, 100);
  assert.equal(result.maximumPoints, 1);
  assert.equal(result.includedRequirementCount, 1);
  assert.equal(result.excludedRequirementCount, 2);
  assert.equal(result.breakdown[1]?.includedInScore, false);
  assert.equal(result.breakdown[2]?.includedInScore, false);
});

test("keeps the score unchanged when non-skill requirements are added", () => {
  const scoreableRequirements: FitRequirementInput[] = [
    {
      id: "typescript",
      type: "skill",
      priority: "required",
      status: "proven",
    },
    {
      id: "figma",
      type: "tool",
      priority: "required",
      status: "learning",
    },
  ];
  const baseline = calculateFitScore(scoreableRequirements);
  const withInformationalRequirements = calculateFitScore([
    ...scoreableRequirements,
    {
      id: "degree",
      type: "education",
      priority: "required",
      status: "missing",
    },
    {
      id: "years-of-experience",
      type: "experience",
      priority: "required",
      status: "proven",
    },
  ]);

  assert.equal(withInformationalRequirements.score, baseline.score);
  assert.equal(
    withInformationalRequirements.currentPoints,
    baseline.currentPoints,
  );
  assert.equal(
    withInformationalRequirements.maximumPoints,
    baseline.maximumPoints,
  );
  assert.equal(withInformationalRequirements.excludedRequirementCount, 2);
});

test("returns a zero score when no scoreable requirements exist", () => {
  const result = calculateFitScore([
    {
      id: "education",
      type: "education",
      priority: "required",
      status: "missing",
    },
  ]);

  assert.equal(result.currentPoints, 0);
  assert.equal(result.maximumPoints, 0);
  assert.equal(result.score, 0);
});
