import { createRequirementMappingHandlers } from "../../../../../../../../server/http/requirement-mappings-handler.ts";
import { rejectDemoMutation } from "../../../../../../../lib/insforge/demo-read-only.ts";
import { requirementMappingActions } from "../../../mapping-actions.ts";

const handlers = createRequirementMappingHandlers(requirementMappingActions);
type RouteContext = {
  params: Promise<{ jobId: string; requirementId: string; skillId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const rejection = await rejectDemoMutation();
  if (rejection) return rejection;
  const { jobId, requirementId, skillId } = await context.params;
  return handlers.DELETE(jobId, requirementId, skillId);
}
