import {
  JobNotFoundError,
  SavedJobsQueryError,
  type CreateJobInput,
  type JobPosting,
  type SavedJob,
  type UpdateJobInput,
} from "../services/saved-jobs.ts";

type AuthResult<T> = { status: "unauthenticated" } | { status: "ok"; data: T };

export type JobActions = {
  list: () => Promise<AuthResult<SavedJob[]>>;
  get: (jobId: string) => Promise<AuthResult<JobPosting>>;
  create: (input: CreateJobInput) => Promise<AuthResult<JobPosting>>;
  update: (jobId: string, input: UpdateJobInput) => Promise<AuthResult<JobPosting>>;
  remove: (jobId: string) => Promise<AuthResult<null>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

function parseCreateInput(value: unknown): CreateJobInput | null {
  if (!isRecord(value)) return null;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const company = typeof value.company === "string" ? value.company.trim() : "";
  const source = optionalString(value.source);
  const sourceUrl = optionalString(value.sourceUrl);
  const location = optionalString(value.location);
  const workArrangement = optionalString(value.workArrangement);
  const rawDescription =
    typeof value.rawDescription === "string" ? value.rawDescription.trim() : "";
  if (
    !title || !company || source === undefined || sourceUrl === undefined ||
    location === undefined || workArrangement === undefined
  ) return null;
  return { title, company, source, sourceUrl, location, workArrangement, rawDescription };
}

function parseUpdateInput(value: unknown): UpdateJobInput | null {
  if (!isRecord(value)) return null;
  const input: UpdateJobInput = {};
  for (const field of ["title", "company"] as const) {
    if (field in value) {
      if (typeof value[field] !== "string" || !value[field].trim()) return null;
      input[field] = value[field].trim();
    }
  }
  for (const field of ["source", "sourceUrl", "location", "workArrangement"] as const) {
    if (field in value) {
      const parsed = optionalString(value[field]);
      if (parsed === undefined) return null;
      input[field] = parsed;
    }
  }
  if ("rawDescription" in value) {
    if (typeof value.rawDescription !== "string") return null;
    input.rawDescription = value.rawDescription.trim();
  }
  return Object.keys(input).length ? input : null;
}

function unauthenticatedResponse() {
  return Response.json(
    { error: { code: "UNAUTHENTICATED", message: "Silakan masuk untuk mengelola lowongan." } },
    { status: 401 },
  );
}

function errorResponse(error: unknown) {
  if (error instanceof JobNotFoundError) {
    return Response.json(
      { error: { code: "JOB_NOT_FOUND", message: error.message } },
      { status: 404 },
    );
  }
  if (error instanceof SavedJobsQueryError) {
    return Response.json(
      { error: { code: "JOBS_UNAVAILABLE", message: error.message } },
      { status: 502 },
    );
  }
  return Response.json(
    { error: { code: "INSFORGE_UNAVAILABLE", message: "Layanan lowongan belum tersedia." } },
    { status: 503 },
  );
}

async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { return null; }
}

export function createJobHandlers(actions: JobActions) {
  async function GET_LIST() {
    try {
      const result = await actions.list();
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { jobs: result.data, total: result.data.length } });
    } catch (error) { return errorResponse(error); }
  }

  async function GET_ITEM(jobId: string) {
    if (!jobId) return Response.json({ error: { code: "INVALID_JOB", message: "ID lowongan tidak valid." } }, { status: 400 });
    try {
      const result = await actions.get(jobId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { job: result.data } });
    } catch (error) { return errorResponse(error); }
  }

  async function POST(request: Request) {
    const input = parseCreateInput(await readJson(request));
    if (!input) return Response.json({ error: { code: "INVALID_JOB", message: "Judul dan perusahaan perlu diisi dengan konteks lowongan yang valid." } }, { status: 400 });
    try {
      const result = await actions.create(input);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { job: result.data } }, { status: 201 });
    } catch (error) { return errorResponse(error); }
  }

  async function PATCH(request: Request, jobId: string) {
    const input = parseUpdateInput(await readJson(request));
    if (!jobId || !input) return Response.json({ error: { code: "INVALID_JOB", message: "Perubahan lowongan tidak valid." } }, { status: 400 });
    try {
      const result = await actions.update(jobId, input);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { job: result.data } });
    } catch (error) { return errorResponse(error); }
  }

  async function DELETE(jobId: string) {
    if (!jobId) return Response.json({ error: { code: "INVALID_JOB", message: "ID lowongan tidak valid." } }, { status: 400 });
    try {
      const result = await actions.remove(jobId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return new Response(null, { status: 204 });
    } catch (error) { return errorResponse(error); }
  }

  return { GET_LIST, GET_ITEM, POST, PATCH, DELETE };
}
