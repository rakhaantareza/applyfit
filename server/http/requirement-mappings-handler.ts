import { JobRequirementNotFoundError, JobRequirementsQueryError } from "../services/job-requirements.ts";
import {
  RequirementMappingConflictError,
  RequirementMappingNotFoundError,
  RequirementMappingsQueryError,
  RequirementMappingTargetNotFoundError,
  type RequirementMapping,
  type MappingReviewSummary,
} from "../services/requirement-mappings.ts";
import { JobNotFoundError, SavedJobsQueryError } from "../services/saved-jobs.ts";
import { SkillQueryError } from "../services/skills.ts";
import { EvidenceQueryError } from "../services/evidences.ts";

type AuthResult<T> = { status: "unauthenticated" } | { status: "ok"; data: T };

type WithoutEvidenceReview = {
  requirementId: string;
  reviewedWithoutEvidence: boolean;
  status: "missing";
};

export type RequirementMappingActions = {
  create: (
    jobId: string,
    requirementId: string,
    skillId: string,
  ) => Promise<AuthResult<RequirementMapping>>;
  remove: (
    jobId: string,
    requirementId: string,
    skillId: string,
  ) => Promise<AuthResult<null>>;
  markWithoutEvidence: (
    jobId: string,
    requirementId: string,
  ) => Promise<AuthResult<WithoutEvidenceReview>>;
  clearWithoutEvidence: (
    jobId: string,
    requirementId: string,
  ) => Promise<AuthResult<WithoutEvidenceReview>>;
  summary: (jobId: string) => Promise<AuthResult<MappingReviewSummary>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readSkillId(request: Request): Promise<string | null> {
  try {
    const value: unknown = await request.json();
    if (!isRecord(value) || typeof value.skillId !== "string") return null;
    return value.skillId.trim() || null;
  } catch { return null; }
}

function invalidResponse() {
  return Response.json(
    { error: { code: "INVALID_REQUIREMENT_MAPPING", message: "ID lowongan, requirement, dan skill perlu diisi." } },
    { status: 400 },
  );
}

function unauthenticatedResponse() {
  return Response.json(
    { error: { code: "UNAUTHENTICATED", message: "Silakan masuk untuk mengelola pemetaan requirement." } },
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
  if (error instanceof RequirementMappingTargetNotFoundError) {
    return Response.json({ error: { code: "MAPPING_TARGET_NOT_FOUND", message: error.message } }, { status: 404 });
  }
  if (error instanceof RequirementMappingNotFoundError) {
    return Response.json({ error: { code: "MAPPING_NOT_FOUND", message: error.message } }, { status: 404 });
  }
  if (error instanceof RequirementMappingConflictError) {
    return Response.json({ error: { code: "MAPPING_ALREADY_EXISTS", message: error.message } }, { status: 409 });
  }
  if (
    error instanceof RequirementMappingsQueryError ||
    error instanceof JobRequirementsQueryError ||
    error instanceof SavedJobsQueryError ||
    error instanceof SkillQueryError ||
    error instanceof EvidenceQueryError
  ) {
    return Response.json(
      { error: { code: "MAPPINGS_UNAVAILABLE", message: "Pemetaan requirement belum dapat diperbarui." } },
      { status: 502 },
    );
  }
  return Response.json(
    { error: { code: "INSFORGE_UNAVAILABLE", message: "Layanan pemetaan belum tersedia." } },
    { status: 503 },
  );
}

export function createRequirementMappingHandlers(actions: RequirementMappingActions) {
  async function POST(request: Request, jobId: string, requirementId: string) {
    const skillId = await readSkillId(request);
    if (!jobId || !requirementId || !skillId) return invalidResponse();
    try {
      const result = await actions.create(jobId, requirementId, skillId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { mapping: result.data } }, { status: 201 });
    } catch (error) { return errorResponse(error); }
  }

  async function DELETE(jobId: string, requirementId: string, skillId: string) {
    if (!jobId || !requirementId || !skillId) return invalidResponse();
    try {
      const result = await actions.remove(jobId, requirementId, skillId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return new Response(null, { status: 204 });
    } catch (error) { return errorResponse(error); }
  }

  async function MARK_WITHOUT_EVIDENCE(jobId: string, requirementId: string) {
    if (!jobId || !requirementId) return invalidResponse();
    try {
      const result = await actions.markWithoutEvidence(jobId, requirementId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: result.data });
    } catch (error) { return errorResponse(error); }
  }

  async function CLEAR_WITHOUT_EVIDENCE(jobId: string, requirementId: string) {
    if (!jobId || !requirementId) return invalidResponse();
    try {
      const result = await actions.clearWithoutEvidence(jobId, requirementId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: result.data });
    } catch (error) { return errorResponse(error); }
  }

  async function GET_SUMMARY(jobId: string) {
    if (!jobId) return invalidResponse();
    try {
      const result = await actions.summary(jobId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: result.data });
    } catch (error) { return errorResponse(error); }
  }

  return {
    POST,
    DELETE,
    MARK_WITHOUT_EVIDENCE,
    CLEAR_WITHOUT_EVIDENCE,
    GET_SUMMARY,
  };
}
