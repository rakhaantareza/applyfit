import { JobRequirementsQueryError } from "../services/job-requirements.ts";
import {
  RequirementMappingsQueryError,
  type AutoMatchResult,
} from "../services/requirement-mappings.ts";
import { JobNotFoundError, SavedJobsQueryError } from "../services/saved-jobs.ts";
import { SkillQueryError } from "../services/skills.ts";

type AutoMatchActionResult =
  | { status: "unauthenticated" }
  | { status: "ok"; data: AutoMatchResult };

export type RequirementAutoMatchAction = (
  jobId: string,
) => Promise<AutoMatchActionResult>;

export function createRequirementAutoMatchHandler(autoMatch: RequirementAutoMatchAction) {
  return async function POST(jobId: string) {
    if (!jobId) {
      return Response.json(
        { error: { code: "INVALID_JOB", message: "ID lowongan tidak valid." } },
        { status: 400 },
      );
    }
    try {
      const result = await autoMatch(jobId);
      if (result.status === "unauthenticated") {
        return Response.json(
          { error: { code: "UNAUTHENTICATED", message: "Silakan masuk untuk mencocokkan requirement." } },
          { status: 401 },
        );
      }
      return Response.json({
        data: {
          matches: result.data.matches,
          total: result.data.matches.length,
          created: result.data.createdCount,
          strategy: "exact_name",
        },
      });
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        return Response.json({ error: { code: "JOB_NOT_FOUND", message: error.message } }, { status: 404 });
      }
      if (
        error instanceof RequirementMappingsQueryError ||
        error instanceof JobRequirementsQueryError ||
        error instanceof SavedJobsQueryError ||
        error instanceof SkillQueryError
      ) {
        return Response.json(
          { error: { code: "MAPPINGS_UNAVAILABLE", message: "Pemetaan otomatis belum dapat dijalankan." } },
          { status: 502 },
        );
      }
      return Response.json(
        { error: { code: "INSFORGE_UNAVAILABLE", message: "Layanan pemetaan belum tersedia." } },
        { status: 503 },
      );
    }
  };
}
