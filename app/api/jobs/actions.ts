import { createInsForgeServerClient } from "../../lib/insforge/server.ts";
import type { JobActions } from "../../../server/http/jobs-handler.ts";
import {
  createJobPosting,
  deleteJobPosting,
  getJobPosting,
  listSavedJobs,
  updateJobPosting,
} from "../../../server/services/saved-jobs.ts";

async function currentUserContext() {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) throw new Error("InsForge authentication unavailable");
  if (!data.user) return null;
  return { client, userId: data.user.id };
}

export const jobActions: JobActions = {
  async list() {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await listSavedJobs(context.client, context.userId) };
  },
  async get(jobId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await getJobPosting(context.client, context.userId, jobId) };
  },
  async create(input) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await createJobPosting(context.client, input) };
  },
  async update(jobId, input) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await updateJobPosting(context.client, context.userId, jobId, input) };
  },
  async remove(jobId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    await deleteJobPosting(context.client, context.userId, jobId);
    return { status: "ok", data: null };
  },
};
