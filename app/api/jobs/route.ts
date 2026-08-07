import { createInsForgeServerClient } from "../../lib/insforge/server.ts";
import { createSavedJobsHandler } from "../../../server/http/saved-jobs-handler.ts";
import { listSavedJobs } from "../../../server/services/saved-jobs.ts";
import type { SavedJobsLoadResult } from "../../../server/http/saved-jobs-handler.ts";

class SavedJobsServiceError extends Error {
  constructor() {
    super("Layanan lowongan tersimpan belum tersedia.");
    this.name = "SavedJobsServiceError";
  }
}

async function loadSavedJobsForCurrentUser(): Promise<SavedJobsLoadResult> {
  let client;
  try {
    client = await createInsForgeServerClient();
  } catch {
    throw new SavedJobsServiceError();
  }

  const { data, error } = await client.auth.getCurrentUser();
  if (error) throw new SavedJobsServiceError();
  if (!data.user) return { status: "unauthenticated" };

  return {
    status: "ok",
    jobs: await listSavedJobs(client, data.user.id),
  };
}

export const GET = createSavedJobsHandler(loadSavedJobsForCurrentUser);
