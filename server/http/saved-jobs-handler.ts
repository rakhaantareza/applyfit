import {
  SavedJobsQueryError,
  type SavedJob,
} from "../services/saved-jobs.ts";

export type SavedJobsLoadResult =
  | { status: "unauthenticated" }
  | { status: "ok"; jobs: SavedJob[] };

export type SavedJobsLoader = () => Promise<SavedJobsLoadResult>;

export function createSavedJobsHandler(loadSavedJobs: SavedJobsLoader) {
  return async function GET() {
    try {
      const result = await loadSavedJobs();
      if (result.status === "unauthenticated") {
        return Response.json(
          {
            error: {
              code: "UNAUTHENTICATED",
              message: "Silakan masuk untuk melihat lowongan tersimpan.",
            },
          },
          { status: 401 },
        );
      }

      return Response.json({
        data: {
          jobs: result.jobs,
          total: result.jobs.length,
        },
      });
    } catch (error) {
      if (error instanceof SavedJobsQueryError) {
        return Response.json(
          {
            error: {
              code: "SAVED_JOBS_UNAVAILABLE",
              message: error.message,
            },
          },
          { status: 502 },
        );
      }

      return Response.json(
        {
          error: {
            code: "INSFORGE_UNAVAILABLE",
            message: "Layanan lowongan tersimpan belum tersedia.",
          },
        },
        { status: 503 },
      );
    }
  };
}
