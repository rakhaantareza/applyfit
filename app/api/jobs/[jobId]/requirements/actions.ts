import { createInsForgeServerClient } from "../../../../lib/insforge/server.ts";
import type { JobRequirementActions } from "../../../../../server/http/job-requirements-handler.ts";
import {
  createJobRequirement,
  deleteJobRequirement,
  getJobRequirement,
  listJobRequirements,
  mergeJobRequirements,
  splitJobRequirement,
  saveReviewedJobRequirements,
  updateJobRequirement,
} from "../../../../../server/services/job-requirements.ts";

async function currentUserContext() {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) throw new Error("InsForge authentication unavailable");
  if (!data.user) return null;
  return { client, userId: data.user.id };
}

export const jobRequirementActions: JobRequirementActions = {
  async list(jobId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await listJobRequirements(context.client, context.userId, jobId) };
  },
  async get(jobId, requirementId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await getJobRequirement(context.client, context.userId, jobId, requirementId) };
  },
  async create(jobId, input) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await createJobRequirement(context.client, context.userId, jobId, input) };
  },
  async update(jobId, requirementId, input) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await updateJobRequirement(context.client, context.userId, jobId, requirementId, input) };
  },
  async remove(jobId, requirementId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    await deleteJobRequirement(context.client, context.userId, jobId, requirementId);
    return { status: "ok", data: null };
  },
  async merge(jobId, input) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await mergeJobRequirements(context.client, context.userId, jobId, input) };
  },
  async split(jobId, requirementId, input) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await splitJobRequirement(context.client, context.userId, jobId, requirementId, input) };
  },
  async saveReview(jobId, requirements) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await saveReviewedJobRequirements(context.client, context.userId, jobId, requirements) };
  },
};
