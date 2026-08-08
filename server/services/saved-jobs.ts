import type { InsForgeClient } from "@insforge/sdk";

const SAVED_JOB_COLUMNS =
  "id,title,company,source,source_url,location,work_arrangement,created_at,updated_at";

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

export class SavedJobsQueryError extends Error {
  constructor() {
    super("Daftar lowongan tersimpan tidak dapat dimuat.");
    this.name = "SavedJobsQueryError";
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
