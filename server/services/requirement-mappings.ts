import type { InsForgeClient } from "@insforge/sdk";
import {
  getJobRequirement,
  listJobRequirements,
  type JobRequirement,
} from "./job-requirements.ts";
import { listSkills, type Skill } from "./skills.ts";
import { listEvidences, type Evidence } from "./evidences.ts";
import {
  deriveRequirementStatus,
  type RequirementStatus,
} from "./fit-score.ts";

export type ExactRequirementSkillMatch = {
  requirementId: string;
  requirementName: string;
  skillId: string;
  skillName: string;
};

export type AutoMatchResult = {
  matches: ExactRequirementSkillMatch[];
  createdCount: number;
};

const MAPPING_COLUMNS =
  "id,requirement_id,skill_id,user_id,created_at,updated_at";

export type RequirementMapping = {
  id: string;
  requirementId: string;
  skillId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type MappingReviewSkill = Pick<Skill, "id" | "name" | "status" | "level"> & {
  evidences: Evidence[];
};

export type MappingReviewRequirement = Pick<
  JobRequirement,
  "id" | "name" | "type" | "priority"
> & {
  status: RequirementStatus;
  skills: MappingReviewSkill[];
};

export type MappingReviewSummary = {
  requirements: MappingReviewRequirement[];
  informationalRequirements: Array<Pick<
    JobRequirement,
    "id" | "name" | "type" | "priority"
  >>;
  mappedCount: number;
  unmappedCount: number;
  totalMappableRequirements: number;
  statusCounts: Record<RequirementStatus, number>;
};

export type SkillEvidenceLink = {
  skillId: string;
  evidenceId: string;
};

export class RequirementMappingsQueryError extends Error {
  constructor() {
    super("Pemetaan requirement belum dapat dimuat atau diperbarui.");
    this.name = "RequirementMappingsQueryError";
  }
}

export class RequirementMappingTargetNotFoundError extends Error {
  constructor() {
    super("Requirement atau skill tidak ditemukan pada data pengguna ini.");
    this.name = "RequirementMappingTargetNotFoundError";
  }
}

export class RequirementMappingNotFoundError extends Error {
  constructor() {
    super("Hubungan requirement dan skill tidak ditemukan.");
    this.name = "RequirementMappingNotFoundError";
  }
}

export class RequirementMappingConflictError extends Error {
  constructor() {
    super("Skill sudah terhubung ke requirement tersebut.");
    this.name = "RequirementMappingConflictError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUniqueViolation(error: unknown) {
  return isRecord(error) && error.code === "23505";
}

export function normalizeRequirementMapping(value: unknown): RequirementMapping {
  if (!isRecord(value)) throw new RequirementMappingsQueryError();
  const { id, requirement_id, skill_id, user_id, created_at, updated_at } = value;
  if (
    typeof id !== "string" ||
    typeof requirement_id !== "string" ||
    typeof skill_id !== "string" ||
    typeof user_id !== "string" ||
    typeof created_at !== "string" ||
    typeof updated_at !== "string"
  ) throw new RequirementMappingsQueryError();
  return {
    id,
    requirementId: requirement_id,
    skillId: skill_id,
    userId: user_id,
    createdAt: created_at,
    updatedAt: updated_at,
  };
}

function normalizeRequirementMappings(value: unknown): RequirementMapping[] {
  if (!Array.isArray(value)) throw new RequirementMappingsQueryError();
  return value.map(normalizeRequirementMapping);
}

function normalizeSkillEvidenceLinks(value: unknown): SkillEvidenceLink[] {
  if (!Array.isArray(value)) throw new RequirementMappingsQueryError();
  return value.map((row) => {
    if (
      !isRecord(row) ||
      typeof row.skill_id !== "string" ||
      typeof row.evidence_id !== "string"
    ) throw new RequirementMappingsQueryError();
    return { skillId: row.skill_id, evidenceId: row.evidence_id };
  });
}

export function buildRequirementMappingReviewSummary(
  requirements: readonly JobRequirement[],
  mappings: readonly RequirementMapping[],
  skills: readonly Skill[],
  evidences: readonly Evidence[],
  evidenceLinks: readonly SkillEvidenceLink[],
): MappingReviewSummary {
  const skillsById = new Map(skills.map((skill) => [skill.id, skill]));
  const evidenceById = new Map(evidences.map((evidence) => [evidence.id, evidence]));
  const evidenceIdsBySkill = new Map<string, string[]>();
  for (const link of evidenceLinks) {
    const ids = evidenceIdsBySkill.get(link.skillId) ?? [];
    ids.push(link.evidenceId);
    evidenceIdsBySkill.set(link.skillId, ids);
  }
  const mappingsByRequirement = new Map<string, RequirementMapping[]>();
  for (const mapping of mappings) {
    const current = mappingsByRequirement.get(mapping.requirementId) ?? [];
    current.push(mapping);
    mappingsByRequirement.set(mapping.requirementId, current);
  }

  const mappableRequirements = requirements.filter(
    (requirement) => requirement.type === "skill" || requirement.type === "tool",
  );
  const reviewRequirements = mappableRequirements.map<MappingReviewRequirement>((requirement) => {
    const requirementMappings = mappingsByRequirement.get(requirement.id) ?? [];
    const mappedSkills = requirementMappings.flatMap((mapping) => {
      const skill = skillsById.get(mapping.skillId);
      if (!skill) return [];
      const linkedEvidences = (evidenceIdsBySkill.get(skill.id) ?? [])
        .flatMap((evidenceId) => {
          const evidence = evidenceById.get(evidenceId);
          return evidence ? [evidence] : [];
        });
      return [{
        id: skill.id,
        name: skill.name,
        status: skill.status,
        level: skill.level,
        evidences: linkedEvidences,
      }];
    });
    const status = deriveRequirementStatus(mappedSkills.map((skill) => ({
      skill: { id: skill.id, status: skill.status },
      linkedEvidenceIds: skill.evidences.map(({ id }) => id),
    })));
    return {
      id: requirement.id,
      name: requirement.name,
      type: requirement.type,
      priority: requirement.priority,
      status,
      skills: mappedSkills,
    };
  });
  const mappedCount = mappableRequirements.filter(
    (requirement) => (mappingsByRequirement.get(requirement.id)?.length ?? 0) > 0,
  ).length;
  const statusCounts: Record<RequirementStatus, number> = {
    proven: 0,
    partial: 0,
    learning: 0,
    missing: 0,
  };
  for (const requirement of reviewRequirements) statusCounts[requirement.status] += 1;

  return {
    requirements: reviewRequirements,
    informationalRequirements: requirements.filter(
      (requirement) => requirement.type === "education" || requirement.type === "experience",
    ).map(({ id, name, type, priority }) => ({ id, name, type, priority })),
    mappedCount,
    unmappedCount: mappableRequirements.length - mappedCount,
    totalMappableRequirements: mappableRequirements.length,
    statusCounts,
  };
}

async function requireOwnedMappingTargets(
  client: InsForgeClient,
  userId: string,
  jobId: string,
  requirementId: string,
  skillId: string,
) {
  await getJobRequirement(client, userId, jobId, requirementId);
  const skills = await listSkills(client, userId);
  if (!skills.some((skill) => skill.id === skillId)) {
    throw new RequirementMappingTargetNotFoundError();
  }
}

function normalizeExactName(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
}

export function findExactRequirementSkillMatches(
  requirements: readonly JobRequirement[],
  skills: readonly Skill[],
): ExactRequirementSkillMatch[] {
  const skillsByName = new Map(
    skills.map((skill) => [normalizeExactName(skill.name), skill] as const),
  );

  return requirements.flatMap((requirement) => {
    if (requirement.type !== "skill" && requirement.type !== "tool") return [];
    const skill = skillsByName.get(normalizeExactName(requirement.name));
    if (!skill) return [];
    return [{
      requirementId: requirement.id,
      requirementName: requirement.name,
      skillId: skill.id,
      skillName: skill.name,
    }];
  });
}

export async function autoMatchJobRequirements(
  client: InsForgeClient,
  userId: string,
  jobId: string,
): Promise<AutoMatchResult> {
  const [requirements, skills] = await Promise.all([
    listJobRequirements(client, userId, jobId),
    listSkills(client, userId),
  ]);
  const matches = findExactRequirementSkillMatches(requirements, skills);
  if (!matches.length) return { matches: [], createdCount: 0 };

  const requirementIds = [...new Set(matches.map(({ requirementId }) => requirementId))];
  const { data: existingData, error: existingError } = await client.database
    .from("requirement_mappings")
    .select("requirement_id,skill_id")
    .eq("user_id", userId)
    .in("requirement_id", requirementIds);
  if (existingError || !Array.isArray(existingData)) throw new RequirementMappingsQueryError();

  const existingPairs = new Set(existingData.flatMap((row) => {
    if (
      typeof row === "object" && row !== null &&
      typeof row.requirement_id === "string" && typeof row.skill_id === "string"
    ) return [`${row.requirement_id}:${row.skill_id}`];
    return [];
  }));
  const newMappings = matches.filter(
    (match) => !existingPairs.has(`${match.requirementId}:${match.skillId}`),
  ).map((match) => ({
    requirement_id: match.requirementId,
    skill_id: match.skillId,
  }));

  if (newMappings.length) {
    const { error } = await client.database
      .from("requirement_mappings")
      .insert(newMappings);
    if (error) throw new RequirementMappingsQueryError();
  }

  return { matches, createdCount: newMappings.length };
}

export async function createManualRequirementMapping(
  client: InsForgeClient,
  userId: string,
  jobId: string,
  requirementId: string,
  skillId: string,
): Promise<RequirementMapping> {
  await requireOwnedMappingTargets(client, userId, jobId, requirementId, skillId);
  const { data, error } = await client.database
    .from("requirement_mappings")
    .insert([{ requirement_id: requirementId, skill_id: skillId }])
    .select(MAPPING_COLUMNS)
    .single();
  if (error) {
    if (isUniqueViolation(error)) throw new RequirementMappingConflictError();
    throw new RequirementMappingsQueryError();
  }
  return normalizeRequirementMapping(data);
}

export async function deleteManualRequirementMapping(
  client: InsForgeClient,
  userId: string,
  jobId: string,
  requirementId: string,
  skillId: string,
): Promise<void> {
  await requireOwnedMappingTargets(client, userId, jobId, requirementId, skillId);
  const { data, error } = await client.database
    .from("requirement_mappings")
    .delete()
    .eq("requirement_id", requirementId)
    .eq("skill_id", skillId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) throw new RequirementMappingsQueryError();
  if (!data) throw new RequirementMappingNotFoundError();
}

export async function markRequirementWithoutEvidence(
  client: InsForgeClient,
  userId: string,
  jobId: string,
  requirementId: string,
): Promise<{ requirementId: string; status: "missing" }> {
  await getJobRequirement(client, userId, jobId, requirementId);
  const { error } = await client.database
    .from("requirement_mappings")
    .delete()
    .eq("requirement_id", requirementId)
    .eq("user_id", userId);
  if (error) throw new RequirementMappingsQueryError();
  return { requirementId, status: "missing" };
}

export async function getRequirementMappingReviewSummary(
  client: InsForgeClient,
  userId: string,
  jobId: string,
): Promise<MappingReviewSummary> {
  const [requirements, skills] = await Promise.all([
    listJobRequirements(client, userId, jobId),
    listSkills(client, userId),
  ]);
  const mappableRequirementIds = requirements.flatMap((requirement) =>
    requirement.type === "skill" || requirement.type === "tool" ? [requirement.id] : [],
  );
  if (!mappableRequirementIds.length) {
    return buildRequirementMappingReviewSummary(requirements, [], skills, [], []);
  }

  const { data: mappingData, error: mappingError } = await client.database
    .from("requirement_mappings")
    .select(MAPPING_COLUMNS)
    .eq("user_id", userId)
    .in("requirement_id", mappableRequirementIds);
  if (mappingError) throw new RequirementMappingsQueryError();
  const mappings = normalizeRequirementMappings(mappingData);
  const mappedSkillIds = [...new Set(mappings.map(({ skillId }) => skillId))];
  if (!mappedSkillIds.length) {
    return buildRequirementMappingReviewSummary(requirements, mappings, skills, [], []);
  }

  const [linkResult, evidences] = await Promise.all([
    client.database
      .from("skill_evidences")
      .select("skill_id,evidence_id")
      .in("skill_id", mappedSkillIds),
    listEvidences(client, userId),
  ]);
  if (linkResult.error) throw new RequirementMappingsQueryError();
  const evidenceLinks = normalizeSkillEvidenceLinks(linkResult.data);
  return buildRequirementMappingReviewSummary(
    requirements,
    mappings,
    skills,
    evidences,
    evidenceLinks,
  );
}
