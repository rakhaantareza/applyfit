import type { InsForgeClient } from "@insforge/sdk";
import { getJobPosting } from "./saved-jobs.ts";

const REQUIREMENT_COLUMNS =
  "id,job_id,name,type,priority,created_at,updated_at";

export type JobRequirementType = "skill" | "tool" | "education" | "experience";
export type JobRequirementPriority = "required" | "preferred";

export type JobRequirement = {
  id: string;
  jobId: string;
  name: string;
  type: JobRequirementType;
  priority: JobRequirementPriority;
  createdAt: string;
  updatedAt: string;
};

export type CreateJobRequirementInput = {
  name: string;
  type: JobRequirementType;
  priority: JobRequirementPriority;
};

export type UpdateJobRequirementInput = Partial<CreateJobRequirementInput>;

export type MergeJobRequirementsInput = {
  requirementIds: string[];
  name: string | null;
};

export type SplitJobRequirementInput = {
  names: string[];
};

export type ReviewedJobRequirementInput = CreateJobRequirementInput & {
  id?: string;
};

export class JobRequirementsQueryError extends Error {
  constructor() {
    super("Syarat lowongan tidak dapat dimuat atau diperbarui.");
    this.name = "JobRequirementsQueryError";
  }
}

export class JobRequirementNotFoundError extends Error {
  constructor() {
    super("Syarat lowongan tidak ditemukan.");
    this.name = "JobRequirementNotFoundError";
  }
}

export class JobRequirementMergeError extends Error {
  constructor() {
    super("Requirement hanya dapat digabung jika tipe dan prioritasnya sama.");
    this.name = "JobRequirementMergeError";
  }
}

export class JobRequirementSplitError extends Error {
  constructor() {
    super("Requirement belum dapat dipisah menjadi bagian yang diminta.");
    this.name = "JobRequirementSplitError";
  }
}

export class JobRequirementReviewError extends Error {
  constructor() {
    super("Hasil review syarat belum dapat disimpan.");
    this.name = "JobRequirementReviewError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRequirementType(value: unknown): value is JobRequirementType {
  return value === "skill" || value === "tool" || value === "education" || value === "experience";
}

function isRequirementPriority(value: unknown): value is JobRequirementPriority {
  return value === "required" || value === "preferred";
}

export function normalizeJobRequirement(value: unknown): JobRequirement {
  if (!isRecord(value)) throw new JobRequirementsQueryError();
  const { id, job_id, name, type, priority, created_at, updated_at } = value;
  if (
    typeof id !== "string" ||
    typeof job_id !== "string" ||
    typeof name !== "string" ||
    !isRequirementType(type) ||
    !isRequirementPriority(priority) ||
    typeof created_at !== "string" ||
    typeof updated_at !== "string"
  ) {
    throw new JobRequirementsQueryError();
  }
  return {
    id,
    jobId: job_id,
    name,
    type,
    priority,
    createdAt: created_at,
    updatedAt: updated_at,
  };
}

export function normalizeJobRequirements(value: unknown): JobRequirement[] {
  if (!Array.isArray(value)) throw new JobRequirementsQueryError();
  return value.map(normalizeJobRequirement);
}

async function requireOwnedJob(
  client: InsForgeClient,
  userId: string,
  jobId: string,
) {
  await getJobPosting(client, userId, jobId);
}

export async function listJobRequirements(
  client: InsForgeClient,
  userId: string,
  jobId: string,
): Promise<JobRequirement[]> {
  await requireOwnedJob(client, userId, jobId);
  const { data, error } = await client.database
    .from("job_requirements")
    .select(REQUIREMENT_COLUMNS)
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });
  if (error) throw new JobRequirementsQueryError();
  return normalizeJobRequirements(data);
}

export async function getJobRequirement(
  client: InsForgeClient,
  userId: string,
  jobId: string,
  requirementId: string,
): Promise<JobRequirement> {
  await requireOwnedJob(client, userId, jobId);
  const { data, error } = await client.database
    .from("job_requirements")
    .select(REQUIREMENT_COLUMNS)
    .eq("id", requirementId)
    .eq("job_id", jobId)
    .maybeSingle();
  if (error) throw new JobRequirementsQueryError();
  if (!data) throw new JobRequirementNotFoundError();
  return normalizeJobRequirement(data);
}

export async function createJobRequirement(
  client: InsForgeClient,
  userId: string,
  jobId: string,
  input: CreateJobRequirementInput,
): Promise<JobRequirement> {
  await requireOwnedJob(client, userId, jobId);
  const { data, error } = await client.database
    .from("job_requirements")
    .insert([{ job_id: jobId, ...input }])
    .select(REQUIREMENT_COLUMNS)
    .single();
  if (error) throw new JobRequirementsQueryError();
  return normalizeJobRequirement(data);
}

export async function updateJobRequirement(
  client: InsForgeClient,
  userId: string,
  jobId: string,
  requirementId: string,
  input: UpdateJobRequirementInput,
): Promise<JobRequirement> {
  await requireOwnedJob(client, userId, jobId);
  const { data, error } = await client.database
    .from("job_requirements")
    .update(input)
    .eq("id", requirementId)
    .eq("job_id", jobId)
    .select(REQUIREMENT_COLUMNS)
    .maybeSingle();
  if (error) throw new JobRequirementsQueryError();
  if (!data) throw new JobRequirementNotFoundError();
  return normalizeJobRequirement(data);
}

export async function deleteJobRequirement(
  client: InsForgeClient,
  userId: string,
  jobId: string,
  requirementId: string,
): Promise<void> {
  await requireOwnedJob(client, userId, jobId);
  const { data, error } = await client.database
    .from("job_requirements")
    .delete()
    .eq("id", requirementId)
    .eq("job_id", jobId)
    .select("id")
    .maybeSingle();
  if (error) throw new JobRequirementsQueryError();
  if (!data) throw new JobRequirementNotFoundError();
}

export async function mergeJobRequirements(
  client: InsForgeClient,
  userId: string,
  jobId: string,
  input: MergeJobRequirementsInput,
): Promise<JobRequirement> {
  await requireOwnedJob(client, userId, jobId);
  const { data, error } = await client.database.rpc("merge_job_requirements", {
    target_job_id: jobId,
    source_requirement_ids: input.requirementIds,
    merged_name: input.name,
  });
  if (error) throw new JobRequirementMergeError();
  const requirements = normalizeJobRequirements(data);
  if (requirements.length !== 1) throw new JobRequirementsQueryError();
  return requirements[0];
}

export async function splitJobRequirement(
  client: InsForgeClient,
  userId: string,
  jobId: string,
  requirementId: string,
  input: SplitJobRequirementInput,
): Promise<JobRequirement[]> {
  await requireOwnedJob(client, userId, jobId);
  const { data, error } = await client.database.rpc("split_job_requirement", {
    target_job_id: jobId,
    source_requirement_id: requirementId,
    split_names: input.names,
  });
  if (error) throw new JobRequirementSplitError();
  const requirements = normalizeJobRequirements(data);
  if (requirements.length !== input.names.length) throw new JobRequirementsQueryError();
  return requirements;
}

export async function saveReviewedJobRequirements(
  client: InsForgeClient,
  userId: string,
  jobId: string,
  requirements: ReviewedJobRequirementInput[],
): Promise<JobRequirement[]> {
  await requireOwnedJob(client, userId, jobId);
  const { data, error } = await client.database.rpc("save_reviewed_job_requirements", {
    target_job_id: jobId,
    reviewed_requirements: requirements,
  });
  if (error) throw new JobRequirementReviewError();
  return normalizeJobRequirements(data);
}
