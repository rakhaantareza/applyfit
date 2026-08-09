import {
  JobRequirementNotFoundError,
  JobRequirementMergeError,
  JobRequirementSplitError,
  JobRequirementReviewError,
  JobRequirementsQueryError,
  type CreateJobRequirementInput,
  type JobRequirement,
  type JobRequirementPriority,
  type JobRequirementType,
  type MergeJobRequirementsInput,
  type SplitJobRequirementInput,
  type ReviewedJobRequirementInput,
  type UpdateJobRequirementInput,
} from "../services/job-requirements.ts";
import { JobNotFoundError, SavedJobsQueryError } from "../services/saved-jobs.ts";

type AuthResult<T> = { status: "unauthenticated" } | { status: "ok"; data: T };

export type JobRequirementActions = {
  list: (jobId: string) => Promise<AuthResult<JobRequirement[]>>;
  get: (jobId: string, requirementId: string) => Promise<AuthResult<JobRequirement>>;
  create: (jobId: string, input: CreateJobRequirementInput) => Promise<AuthResult<JobRequirement>>;
  update: (
    jobId: string,
    requirementId: string,
    input: UpdateJobRequirementInput,
  ) => Promise<AuthResult<JobRequirement>>;
  remove: (jobId: string, requirementId: string) => Promise<AuthResult<null>>;
  merge: (jobId: string, input: MergeJobRequirementsInput) => Promise<AuthResult<JobRequirement>>;
  split: (
    jobId: string,
    requirementId: string,
    input: SplitJobRequirementInput,
  ) => Promise<AuthResult<JobRequirement[]>>;
  saveReview: (
    jobId: string,
    requirements: ReviewedJobRequirementInput[],
  ) => Promise<AuthResult<JobRequirement[]>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRequirementType(value: unknown): value is JobRequirementType {
  return value === "skill" || value === "tool" || value === "education" || value === "experience";
}

function isRequirementPriority(value: unknown): value is JobRequirementPriority {
  return value === "required" || value === "preferred";
}

function parseCreateInput(value: unknown): CreateJobRequirementInput | null {
  if (!isRecord(value) || "status" in value) return null;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name || !isRequirementType(value.type) || !isRequirementPriority(value.priority)) {
    return null;
  }
  return { name, type: value.type, priority: value.priority };
}

function parseUpdateInput(value: unknown): UpdateJobRequirementInput | null {
  if (!isRecord(value) || "status" in value) return null;
  const input: UpdateJobRequirementInput = {};
  if ("name" in value) {
    if (typeof value.name !== "string" || !value.name.trim()) return null;
    input.name = value.name.trim();
  }
  if ("type" in value) {
    if (!isRequirementType(value.type)) return null;
    input.type = value.type;
  }
  if ("priority" in value) {
    if (!isRequirementPriority(value.priority)) return null;
    input.priority = value.priority;
  }
  return Object.keys(input).length ? input : null;
}

function parseMergeInput(value: unknown): MergeJobRequirementsInput | null {
  if (!isRecord(value) || !Array.isArray(value.requirementIds)) return null;
  const requirementIds = value.requirementIds.filter(
    (id): id is string => typeof id === "string" && Boolean(id.trim()),
  ).map((id) => id.trim());
  const uniqueIds = [...new Set(requirementIds)];
  if (uniqueIds.length < 2 || uniqueIds.length !== value.requirementIds.length) return null;
  if (value.name !== undefined && value.name !== null && typeof value.name !== "string") return null;
  const name = typeof value.name === "string" ? value.name.trim() || null : null;
  return { requirementIds: uniqueIds, name };
}

function parseSplitInput(value: unknown): SplitJobRequirementInput | null {
  if (!isRecord(value) || !Array.isArray(value.names)) return null;
  const names = value.names.map((name) => typeof name === "string" ? name.trim() : "");
  if (
    names.length < 2 ||
    names.length > 20 ||
    names.some((name) => !name) ||
    new Set(names.map((name) => name.toLocaleLowerCase("id-ID"))).size !== names.length
  ) return null;
  return { names };
}

function parseReviewedRequirements(value: unknown): ReviewedJobRequirementInput[] | null {
  if (!isRecord(value) || !Array.isArray(value.requirements) || value.requirements.length > 200) {
    return null;
  }
  const requirements: ReviewedJobRequirementInput[] = [];
  const ids = new Set<string>();
  for (const item of value.requirements) {
    const parsed = parseCreateInput(item);
    if (!parsed || !isRecord(item)) return null;
    if ("id" in item) {
      if (typeof item.id !== "string" || !item.id.trim() || ids.has(item.id.trim())) return null;
      const id = item.id.trim();
      ids.add(id);
      requirements.push({ id, ...parsed });
    } else {
      requirements.push(parsed);
    }
  }
  return requirements;
}

async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { return null; }
}

function unauthenticatedResponse() {
  return Response.json(
    { error: { code: "UNAUTHENTICATED", message: "Silakan masuk untuk mengelola syarat lowongan." } },
    { status: 401 },
  );
}

function errorResponse(error: unknown) {
  if (error instanceof JobNotFoundError) {
    return Response.json({ error: { code: "JOB_NOT_FOUND", message: error.message } }, { status: 404 });
  }
  if (error instanceof JobRequirementNotFoundError) {
    return Response.json({ error: { code: "REQUIREMENT_NOT_FOUND", message: error.message } }, { status: 404 });
  }
  if (error instanceof JobRequirementMergeError) {
    return Response.json(
      { error: { code: "REQUIREMENTS_CANNOT_BE_MERGED", message: error.message } },
      { status: 409 },
    );
  }
  if (error instanceof JobRequirementSplitError) {
    return Response.json(
      { error: { code: "REQUIREMENT_CANNOT_BE_SPLIT", message: error.message } },
      { status: 409 },
    );
  }
  if (error instanceof JobRequirementReviewError) {
    return Response.json(
      { error: { code: "REQUIREMENT_REVIEW_NOT_SAVED", message: error.message } },
      { status: 409 },
    );
  }
  if (error instanceof JobRequirementsQueryError || error instanceof SavedJobsQueryError) {
    return Response.json(
      { error: { code: "REQUIREMENTS_UNAVAILABLE", message: "Syarat lowongan belum dapat dimuat atau diperbarui." } },
      { status: 502 },
    );
  }
  return Response.json(
    { error: { code: "INSFORGE_UNAVAILABLE", message: "Layanan syarat lowongan belum tersedia." } },
    { status: 503 },
  );
}

function invalidResponse() {
  return Response.json(
    { error: { code: "INVALID_REQUIREMENT", message: "Data syarat lowongan tidak valid." } },
    { status: 400 },
  );
}

export function createJobRequirementHandlers(actions: JobRequirementActions) {
  async function GET_LIST(jobId: string) {
    if (!jobId) return invalidResponse();
    try {
      const result = await actions.list(jobId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { requirements: result.data, total: result.data.length } });
    } catch (error) { return errorResponse(error); }
  }

  async function GET_ITEM(jobId: string, requirementId: string) {
    if (!jobId || !requirementId) return invalidResponse();
    try {
      const result = await actions.get(jobId, requirementId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { requirement: result.data } });
    } catch (error) { return errorResponse(error); }
  }

  async function POST(request: Request, jobId: string) {
    const input = parseCreateInput(await readJson(request));
    if (!jobId || !input) return invalidResponse();
    try {
      const result = await actions.create(jobId, input);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { requirement: result.data } }, { status: 201 });
    } catch (error) { return errorResponse(error); }
  }

  async function PATCH(request: Request, jobId: string, requirementId: string) {
    const input = parseUpdateInput(await readJson(request));
    if (!jobId || !requirementId || !input) return invalidResponse();
    try {
      const result = await actions.update(jobId, requirementId, input);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { requirement: result.data } });
    } catch (error) { return errorResponse(error); }
  }

  async function DELETE(jobId: string, requirementId: string) {
    if (!jobId || !requirementId) return invalidResponse();
    try {
      const result = await actions.remove(jobId, requirementId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return new Response(null, { status: 204 });
    } catch (error) { return errorResponse(error); }
  }

  async function MERGE(request: Request, jobId: string) {
    const input = parseMergeInput(await readJson(request));
    if (!jobId || !input) return invalidResponse();
    try {
      const result = await actions.merge(jobId, input);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { requirement: result.data } });
    } catch (error) { return errorResponse(error); }
  }

  async function SPLIT(request: Request, jobId: string, requirementId: string) {
    const input = parseSplitInput(await readJson(request));
    if (!jobId || !requirementId || !input) return invalidResponse();
    try {
      const result = await actions.split(jobId, requirementId, input);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({
        data: { requirements: result.data, total: result.data.length },
      });
    } catch (error) { return errorResponse(error); }
  }

  async function SAVE_REVIEW(request: Request, jobId: string) {
    const requirements = parseReviewedRequirements(await readJson(request));
    if (!jobId || !requirements) return invalidResponse();
    try {
      const result = await actions.saveReview(jobId, requirements);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({
        data: { requirements: result.data, total: result.data.length },
      });
    } catch (error) { return errorResponse(error); }
  }

  return { GET_LIST, GET_ITEM, POST, PATCH, DELETE, MERGE, SPLIT, SAVE_REVIEW };
}
