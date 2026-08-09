import { createJobRequirementHandlers } from "../../../../../../server/http/job-requirements-handler.ts";
import { jobRequirementActions } from "../actions.ts";

const handlers = createJobRequirementHandlers(jobRequirementActions);
type RouteContext = { params: Promise<{ jobId: string; requirementId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { jobId, requirementId } = await context.params;
  return handlers.GET_ITEM(jobId, requirementId);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { jobId, requirementId } = await context.params;
  return handlers.PATCH(request, jobId, requirementId);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { jobId, requirementId } = await context.params;
  return handlers.DELETE(jobId, requirementId);
}
