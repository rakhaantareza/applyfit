import type { InsForgeClient } from "@insforge/sdk";

const SAVED_JOB_COLUMNS =
  "id,title,company,source,source_url,location,work_arrangement,created_at,updated_at";
const JOB_POSTING_COLUMNS =
  "id,title,company,source,source_url,location,work_arrangement,raw_description,created_at,updated_at";

export type SavedJob = {
  id: string;
  title: string;
  company: string;
  source: string | null;
  sourceUrl: string | null;
  location: string | null;
  workArrangement: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobPosting = SavedJob & {
  rawDescription: string;
};

export type CreateJobInput = {
  title: string;
  company: string;
  source: string | null;
  sourceUrl: string | null;
  location: string | null;
  workArrangement: string | null;
  rawDescription: string;
};

export type UpdateJobInput = Partial<CreateJobInput>;

export class SavedJobsQueryError extends Error {
  constructor() {
    super("Daftar lowongan tersimpan tidak dapat dimuat.");
    this.name = "SavedJobsQueryError";
  }
}

export class JobNotFoundError extends Error {
  constructor() {
    super("Lowongan tidak ditemukan.");
    this.name = "JobNotFoundError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : null;
}

export function normalizeSavedJobs(value: unknown): SavedJob[] {
  if (!Array.isArray(value)) throw new SavedJobsQueryError();

  return value.map((row) => {
    if (!isRecord(row)) throw new SavedJobsQueryError();

    const {
      id,
      title,
      company,
      source,
      source_url,
      location,
      work_arrangement,
      created_at,
      updated_at,
    } = row;
    if (
      typeof id !== "string" ||
      typeof title !== "string" ||
      typeof company !== "string" ||
      typeof created_at !== "string" ||
      typeof updated_at !== "string"
    ) {
      throw new SavedJobsQueryError();
    }

    return {
      id,
      title,
      company,
      source: nullableString(source),
      sourceUrl: nullableString(source_url),
      location: nullableString(location),
      workArrangement: nullableString(work_arrangement),
      createdAt: created_at,
      updatedAt: updated_at,
    };
  });
}

export function normalizeJobPosting(value: unknown): JobPosting {
  if (!isRecord(value)) throw new SavedJobsQueryError();
  const jobs = normalizeSavedJobs([value]);
  if (typeof value.raw_description !== "string") throw new SavedJobsQueryError();
  return { ...jobs[0], rawDescription: value.raw_description };
}

export async function listSavedJobs(
  client: InsForgeClient,
  userId: string,
): Promise<SavedJob[]> {
  const { data, error } = await client.database
    .from("job_postings")
    .select(SAVED_JOB_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new SavedJobsQueryError();

  return normalizeSavedJobs(data);
}

export async function getJobPosting(
  client: InsForgeClient,
  userId: string,
  jobId: string,
): Promise<JobPosting> {
  const { data, error } = await client.database
    .from("job_postings")
    .select(JOB_POSTING_COLUMNS)
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new SavedJobsQueryError();
  if (!data) throw new JobNotFoundError();
  return normalizeJobPosting(data);
}

function toDatabaseValues(input: UpdateJobInput) {
  return {
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.company === undefined ? {} : { company: input.company }),
    ...(input.source === undefined ? {} : { source: input.source }),
    ...(input.sourceUrl === undefined ? {} : { source_url: input.sourceUrl }),
    ...(input.location === undefined ? {} : { location: input.location }),
    ...(input.workArrangement === undefined
      ? {}
      : { work_arrangement: input.workArrangement }),
    ...(input.rawDescription === undefined
      ? {}
      : { raw_description: input.rawDescription }),
  };
}

export async function createJobPosting(
  client: InsForgeClient,
  input: CreateJobInput,
): Promise<JobPosting> {
  const { data, error } = await client.database
    .from("job_postings")
    .insert([toDatabaseValues(input)])
    .select(JOB_POSTING_COLUMNS)
    .single();
  if (error) throw new SavedJobsQueryError();
  return normalizeJobPosting(data);
}

export async function updateJobPosting(
  client: InsForgeClient,
  userId: string,
  jobId: string,
  input: UpdateJobInput,
): Promise<JobPosting> {
  const { data, error } = await client.database
    .from("job_postings")
    .update(toDatabaseValues(input))
    .eq("id", jobId)
    .eq("user_id", userId)
    .select(JOB_POSTING_COLUMNS)
    .maybeSingle();
  if (error) throw new SavedJobsQueryError();
  if (!data) throw new JobNotFoundError();
  return normalizeJobPosting(data);
}

export async function deleteJobPosting(
  client: InsForgeClient,
  userId: string,
  jobId: string,
): Promise<void> {
  const { data, error } = await client.database
    .from("job_postings")
    .delete()
    .eq("id", jobId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) throw new SavedJobsQueryError();
  if (!data) throw new JobNotFoundError();
}
