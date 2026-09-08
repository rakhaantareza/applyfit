import { createJobRequirementHandlers } from "../../../../../../../server/http/job-requirements-handler.ts";
import { rejectDemoMutation } from "../../../../../../lib/insforge/demo-read-only.ts";
import { jobRequirementActions } from "../../actions.ts";

const handlers = createJobRequirementHandlers(jobRequirementActions);
type RouteContext = { params: Promise<{ jobId: string; requirementId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const rejection = await rejectDemoMutation();
  if (rejection) return rejection;
  const { jobId, requirementId } = await context.params;
  return handlers.SPLIT(request, jobId, requirementId);
}
