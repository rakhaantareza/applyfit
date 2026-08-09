import { JobNotFoundError, SavedJobsQueryError } from "../services/saved-jobs.ts";
import {
  EmptyJobDescriptionError,
  RequirementExtractionError,
  type RequirementExtractionResult,
} from "../services/requirement-extraction.ts";

type ExtractionActionResult =
  | { status: "unauthenticated" }
  | { status: "ok"; data: RequirementExtractionResult };

export type RequirementExtractionAction = (
  jobId: string,
) => Promise<ExtractionActionResult>;

export function createRequirementExtractionHandler(
  extract: RequirementExtractionAction,
) {
  return async function POST(jobId: string) {
    if (!jobId) {
      return Response.json(
        { error: { code: "INVALID_JOB", message: "ID lowongan tidak valid." } },
        { status: 400 },
      );
    }

    try {
      const result = await extract(jobId);
      if (result.status === "unauthenticated") {
        return Response.json(
          { error: { code: "UNAUTHENTICATED", message: "Silakan masuk untuk mengekstrak syarat." } },
          { status: 401 },
        );
      }
      return Response.json({
        data: {
          requirements: result.data.requirements,
          model: result.data.model,
          reviewRequired: true,
        },
      });
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        return Response.json(
          { error: { code: "JOB_NOT_FOUND", message: error.message } },
          { status: 404 },
        );
      }
      if (error instanceof EmptyJobDescriptionError) {
        return Response.json(
          { error: { code: "JOB_DESCRIPTION_REQUIRED", message: error.message } },
          { status: 422 },
        );
      }
      if (error instanceof SavedJobsQueryError) {
        return Response.json(
          { error: { code: "JOBS_UNAVAILABLE", message: error.message } },
          { status: 502 },
        );
      }
      if (error instanceof RequirementExtractionError) {
        return Response.json(
          { error: { code: "EXTRACTION_UNAVAILABLE", message: error.message } },
          { status: 502 },
        );
      }
      return Response.json(
        { error: { code: "INSFORGE_UNAVAILABLE", message: "Layanan ekstraksi belum tersedia." } },
        { status: 503 },
      );
    }
  };
}
