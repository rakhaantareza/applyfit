import { createRequirementMappingHandlers } from "../../../../../../server/http/requirement-mappings-handler.ts";
import { requirementMappingActions } from "../mapping-actions.ts";

const handlers = createRequirementMappingHandlers(requirementMappingActions);
type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  return handlers.GET_SUMMARY(jobId);
}
