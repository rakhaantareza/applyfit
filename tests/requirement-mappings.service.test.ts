import assert from "node:assert/strict";
import test from "node:test";
import {
  findExactRequirementSkillMatches,
  normalizeRequirementMapping,
  RequirementMappingsQueryError,
  buildRequirementMappingReviewSummary,
} from "../server/services/requirement-mappings.ts";
import type { JobRequirement } from "../server/services/job-requirements.ts";
import type { Skill } from "../server/services/skills.ts";

const baseRequirement = {
  jobId: "job-1",
  priority: "required" as const,
  reviewedWithoutEvidence: false,
  createdAt: "2026-08-09T09:00:00.000Z",
  updatedAt: "2026-08-09T09:00:00.000Z",
};
const baseSkill = {
  profileId: "profile-1",
  status: "active" as const,
  level: null,
  createdAt: "2026-08-09T09:00:00.000Z",
  updatedAt: "2026-08-09T09:00:00.000Z",
};

test("exact matching ignores only casing, Unicode form, and whitespace", () => {
  const requirements: JobRequirement[] = [
    { ...baseRequirement, id: "req-1", name: "  TypeScript  ", type: "skill" },
    { ...baseRequirement, id: "req-2", name: "FIGMA", type: "tool" },
  ];
  const skills: Skill[] = [
    { ...baseSkill, id: "skill-1", name: "typescript" },
    { ...baseSkill, id: "skill-2", name: "Figma" },
  ];

  assert.deepEqual(findExactRequirementSkillMatches(requirements, skills), [
    { requirementId: "req-1", requirementName: "  TypeScript  ", skillId: "skill-1", skillName: "typescript" },
    { requirementId: "req-2", requirementName: "FIGMA", skillId: "skill-2", skillName: "Figma" },
  ]);
});

test("exact matching does not infer related or compound skills", () => {
  const requirements: JobRequirement[] = [
    { ...baseRequirement, id: "req-1", name: "React dan TypeScript", type: "skill" },
    { ...baseRequirement, id: "req-2", name: "Pengalaman frontend", type: "experience" },
  ];
  const skills: Skill[] = [
    { ...baseSkill, id: "skill-1", name: "React" },
    { ...baseSkill, id: "skill-2", name: "TypeScript" },
    { ...baseSkill, id: "skill-3", name: "Pengalaman frontend" },
  ];

  assert.deepEqual(findExactRequirementSkillMatches(requirements, skills), []);
});

test("normalizeRequirementMapping exposes the persisted manual link", () => {
  assert.deepEqual(normalizeRequirementMapping({
    id: "mapping-1",
    requirement_id: "requirement-1",
    skill_id: "skill-1",
    user_id: "user-1",
    created_at: "2026-08-09T09:00:00.000Z",
    updated_at: "2026-08-09T09:00:00.000Z",
  }), {
    id: "mapping-1",
    requirementId: "requirement-1",
    skillId: "skill-1",
    userId: "user-1",
    createdAt: "2026-08-09T09:00:00.000Z",
    updatedAt: "2026-08-09T09:00:00.000Z",
  });
  assert.throws(
    () => normalizeRequirementMapping({ requirement_id: "requirement-1" }),
    RequirementMappingsQueryError,
  );
  assert.throws(
    () => normalizeRequirementMapping({
      id: "mapping-1",
      requirement_id: "requirement-1",
      skill_id: null,
      user_id: "user-1",
      created_at: "2026-08-09T09:00:00.000Z",
      updated_at: "2026-08-09T09:00:00.000Z",
    }),
    RequirementMappingsQueryError,
  );
});

test("review summary derives all statuses and separates informational requirements", () => {
  const requirements: JobRequirement[] = [
    { ...baseRequirement, id: "req-proven", name: "React", type: "skill" },
    { ...baseRequirement, id: "req-partial", name: "TypeScript", type: "skill" },
    { ...baseRequirement, id: "req-learning", name: "Testing", type: "tool" },
    { ...baseRequirement, id: "req-missing-graphql", name: "GraphQL", type: "skill" },
    {
      ...baseRequirement,
      id: "req-missing-accessibility",
      name: "Accessibility",
      type: "skill",
      reviewedWithoutEvidence: true,
    },
    { ...baseRequirement, id: "req-education", name: "Sarjana", type: "education" },
  ];
  const skills: Skill[] = [
    { ...baseSkill, id: "skill-react", name: "React" },
    { ...baseSkill, id: "skill-typescript", name: "TypeScript" },
    { ...baseSkill, id: "skill-testing", name: "Testing", status: "learning" },
  ];
  const mappingBase = {
    userId: "user-1",
    createdAt: "2026-08-09T09:00:00.000Z",
    updatedAt: "2026-08-09T09:00:00.000Z",
  };
  const summary = buildRequirementMappingReviewSummary(
    requirements,
    [
      { ...mappingBase, id: "map-1", requirementId: "req-proven", skillId: "skill-react" },
      { ...mappingBase, id: "map-2", requirementId: "req-partial", skillId: "skill-typescript" },
      { ...mappingBase, id: "map-3", requirementId: "req-learning", skillId: "skill-testing" },
    ],
    skills,
    [{
      id: "evidence-1",
      profileId: "profile-1",
      title: "Frontend Project",
      type: "project",
      url: null,
      description: "",
      createdAt: "2026-08-09T09:00:00.000Z",
      updatedAt: "2026-08-09T09:00:00.000Z",
    }],
    [
      { skillId: "skill-react", evidenceId: "evidence-1" },
      { skillId: "skill-testing", evidenceId: "evidence-1" },
    ],
  );

  assert.deepEqual(summary.requirements.map(({ status }) => status), [
    "proven", "partial", "learning", "missing", "missing",
  ]);
  assert.equal(summary.requirements[0]?.reviewedWithoutEvidence, false);
  assert.equal(summary.requirements[4]?.reviewedWithoutEvidence, true);
  assert.deepEqual(summary.statusCounts, {
    proven: 1, partial: 1, learning: 1, missing: 2,
  });
  assert.equal(summary.mappedCount, 4);
  assert.equal(summary.unmappedCount, 1);
  assert.equal(summary.totalMappableRequirements, 5);
  assert.deepEqual(summary.informationalRequirements, [{
    id: "req-education",
    name: "Sarjana",
    type: "education",
    priority: "required",
  }]);
});
