import { createJobRequirementHandlers } from "../../../../../../server/http/job-requirements-handler.ts";
import { jobRequirementActions } from "../actions.ts";

const handlers = createJobRequirementHandlers(jobRequirementActions);
type RouteContext = { params: Promise<{ jobId: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  return handlers.SAVE_REVIEW(request, jobId);
}
