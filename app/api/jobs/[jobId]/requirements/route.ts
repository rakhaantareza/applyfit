import { createJobRequirementHandlers } from "../../../../../server/http/job-requirements-handler.ts";
import { jobRequirementActions } from "./actions.ts";

const handlers = createJobRequirementHandlers(jobRequirementActions);
type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  return handlers.GET_LIST(jobId);
}

export async function POST(request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  return handlers.POST(request, jobId);
}
