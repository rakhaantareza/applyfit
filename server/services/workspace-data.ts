import type { InsForgeClient } from "@insforge/sdk";
import { getCachedCareerCatalog } from "./career-catalog.ts";
import { getCareerProfile } from "./career-profile.ts";
import { listEvidencesForProfile } from "./evidences.ts";
import { listVisibleEvidenceSkillLinks } from "./evidence-skills.ts";
import { calculateFitScore } from "./fit-score.ts";
import {
  listRequirementsForOwnedJobs,
  type JobRequirement,
} from "./job-requirements.ts";
import {
  buildRequirementMappingReviewSummary,
  normalizeRequirementMappings,
  type MappingReviewSummary,
  type RequirementMapping,
} from "./requirement-mappings.ts";
import { listSavedJobs, type SavedJob } from "./saved-jobs.ts";
import { listSkillsForProfile } from "./skills.ts";

const MAPPING_COLUMNS = "id,requirement_id,skill_id,user_id,created_at,updated_at";

export type JobOverview = SavedJob & { requirementCount: number };

export async function loadProfileWorkspace(client: InsForgeClient, userId: string) {
  const profile = await getCareerProfile(client, userId);
  const [skills, links, catalog] = await Promise.all([
    profile ? listSkillsForProfile(client, profile.id) : Promise.resolve([]),
    profile ? listVisibleEvidenceSkillLinks(client) : Promise.resolve([]),
    getCachedCareerCatalog(client),
  ]);
  const evidenceCountBySkill = new Map<string, number>();
  const skillIds = new Set(skills.map((skill) => skill.id));
  for (const link of links) {
    if (!skillIds.has(link.skillId)) continue;
    evidenceCountBySkill.set(link.skillId, (evidenceCountBySkill.get(link.skillId) ?? 0) + 1);
  }
  return {
    profile,
    skills: skills.map((skill) => ({
      ...skill,
      evidenceCount: evidenceCountBySkill.get(skill.id) ?? 0,
    })),
    catalog,
  };
}

export async function loadPortfolioWorkspace(client: InsForgeClient, userId: string) {
  const profile = await getCareerProfile(client, userId);
  if (!profile) return { evidences: [], skills: [] };

  const [evidences, skills, links] = await Promise.all([
    listEvidencesForProfile(client, profile.id),
    listSkillsForProfile(client, profile.id),
    listVisibleEvidenceSkillLinks(client),
  ]);
  const evidenceIds = new Set(evidences.map((evidence) => evidence.id));
  const skillIds = new Set(skills.map((skill) => skill.id));
  const skillIdsByEvidence = new Map<string, string[]>();
  for (const link of links) {
    if (!evidenceIds.has(link.evidenceId) || !skillIds.has(link.skillId)) continue;
    const linkedSkills = skillIdsByEvidence.get(link.evidenceId) ?? [];
    linkedSkills.push(link.skillId);
    skillIdsByEvidence.set(link.evidenceId, linkedSkills);
  }
  return {
    evidences: evidences.map((evidence) => ({
      ...evidence,
      skillIds: skillIdsByEvidence.get(evidence.id) ?? [],
    })),
    skills,
  };
}

export async function loadJobsWorkspace(client: InsForgeClient, userId: string) {
  const jobs = await listSavedJobs(client, userId);
  const requirements = await listRequirementsForOwnedJobs(client, jobs.map((job) => job.id));
  return { jobs: attachRequirementCounts(jobs, requirements) };
}

export async function loadDashboardWorkspace(client: InsForgeClient, userId: string) {
  const [profile, jobs] = await Promise.all([
    getCareerProfile(client, userId),
    listSavedJobs(client, userId),
  ]);
  const [skills, evidences, evidenceLinks, requirements] = await Promise.all([
    profile ? listSkillsForProfile(client, profile.id) : Promise.resolve([]),
    profile ? listEvidencesForProfile(client, profile.id) : Promise.resolve([]),
    profile ? listVisibleEvidenceSkillLinks(client) : Promise.resolve([]),
    listRequirementsForOwnedJobs(client, jobs.map((job) => job.id)),
  ]);
  const mappings = await listMappings(client, userId, requirements);
  const jobContexts = jobs.map((job) => {
    const jobRequirements = requirements.filter((requirement) => requirement.jobId === job.id);
    return {
      jobId: job.id,
      requirements: jobRequirements,
      mapping: buildRequirementMappingReviewSummary(
        jobRequirements,
        mappings,
        skills,
        evidences,
        evidenceLinks,
      ),
    };
  });
  const recentAnalyses = jobContexts
    .filter(({ mapping }) => hasCompletedRequirementReview(mapping))
    .slice(0, 2)
    .map(({ jobId, mapping }) => buildRecentAnalysis(jobId, mapping));

  return { profile, skills, evidences, jobs, jobContexts, recentAnalyses };
}

export function attachRequirementCounts(
  jobs: readonly SavedJob[],
  requirements: readonly JobRequirement[],
): JobOverview[] {
  const countByJob = new Map<string, number>();
  for (const requirement of requirements) {
    countByJob.set(requirement.jobId, (countByJob.get(requirement.jobId) ?? 0) + 1);
  }
  return jobs.map((job) => ({
    ...job,
    requirementCount: countByJob.get(job.id) ?? 0,
  }));
}

async function listMappings(
  client: InsForgeClient,
  userId: string,
  requirements: readonly JobRequirement[],
): Promise<RequirementMapping[]> {
  const requirementIds = requirements.flatMap((requirement) =>
    requirement.type === "skill" || requirement.type === "tool" ? [requirement.id] : [],
  );
  if (!requirementIds.length) return [];
  const { data, error } = await client.database
    .from("requirement_mappings")
    .select(MAPPING_COLUMNS)
    .eq("user_id", userId)
    .in("requirement_id", requirementIds);
  if (error) throw new Error("Ringkasan kecocokan belum dapat dimuat.");
  return normalizeRequirementMappings(data);
}

function hasCompletedRequirementReview(mapping: MappingReviewSummary) {
  return mapping.totalMappableRequirements > 0 && mapping.requirements.every(
    (requirement) => requirement.skills.length > 0 || requirement.reviewedWithoutEvidence,
  );
}

function buildRecentAnalysis(jobId: string, mapping: MappingReviewSummary) {
  const result = calculateFitScore(mapping.requirements.map((requirement) => ({
    id: requirement.id,
    type: requirement.type,
    priority: requirement.priority,
    status: requirement.status,
  })));
  const counts = mapping.statusCounts;
  const needsAttention = counts.partial + counts.learning + counts.missing;
  return {
    jobId,
    score: result.score,
    summary: needsAttention > 0
      ? `${counts.proven} persyaratan sudah terbukti · ${needsAttention} lainnya belum sepenuhnya terbukti`
      : `${counts.proven} persyaratan sudah terbukti.`,
  };
}
