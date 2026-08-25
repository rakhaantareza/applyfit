import { createInsForgeServerClient } from "../../../../lib/insforge/server.ts";
import type { RequirementMappingActions } from "../../../../../server/http/requirement-mappings-handler.ts";
import {
  createManualRequirementMapping,
  clearRequirementWithoutEvidence,
  deleteManualRequirementMapping,
  markRequirementWithoutEvidence,
  getRequirementMappingReviewSummary,
} from "../../../../../server/services/requirement-mappings.ts";

async function currentUserContext() {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) throw new Error("InsForge authentication unavailable");
  if (!data.user) return null;
  return { client, userId: data.user.id };
}

export const requirementMappingActions: RequirementMappingActions = {
  async create(jobId, requirementId, skillId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return {
      status: "ok",
      data: await createManualRequirementMapping(
        context.client,
        context.userId,
        jobId,
        requirementId,
        skillId,
      ),
    };
  },
  async remove(jobId, requirementId, skillId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    await deleteManualRequirementMapping(
      context.client,
      context.userId,
      jobId,
      requirementId,
      skillId,
    );
    return { status: "ok", data: null };
  },
  async markWithoutEvidence(jobId, requirementId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return {
      status: "ok",
      data: await markRequirementWithoutEvidence(
        context.client,
        context.userId,
        jobId,
        requirementId,
      ),
    };
  },
  async clearWithoutEvidence(jobId, requirementId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return {
      status: "ok",
      data: await clearRequirementWithoutEvidence(
        context.client,
        context.userId,
        jobId,
        requirementId,
      ),
    };
  },
  async summary(jobId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return {
      status: "ok",
      data: await getRequirementMappingReviewSummary(
        context.client,
        context.userId,
        jobId,
      ),
    };
  },
};
