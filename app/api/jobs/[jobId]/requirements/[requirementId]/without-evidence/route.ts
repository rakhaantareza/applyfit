import { createRequirementMappingHandlers } from "../../../../../../../server/http/requirement-mappings-handler.ts";
import { rejectDemoMutation } from "../../../../../../lib/insforge/demo-read-only.ts";
import { requirementMappingActions } from "../../mapping-actions.ts";

const handlers = createRequirementMappingHandlers(requirementMappingActions);
type RouteContext = { params: Promise<{ jobId: string; requirementId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const rejection = await rejectDemoMutation();
  if (rejection) return rejection;
  const { jobId, requirementId } = await context.params;
  return handlers.MARK_WITHOUT_EVIDENCE(jobId, requirementId);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const rejection = await rejectDemoMutation();
  if (rejection) return rejection;
  const { jobId, requirementId } = await context.params;
  return handlers.CLEAR_WITHOUT_EVIDENCE(jobId, requirementId);
}
