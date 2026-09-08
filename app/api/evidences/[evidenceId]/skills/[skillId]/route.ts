import { createEvidenceSkillHandlers } from "../../../../../../server/http/evidence-skills-handler.ts";
import { rejectDemoMutation } from "../../../../../lib/insforge/demo-read-only.ts";
import { evidenceSkillActions } from "../actions.ts";

const handlers = createEvidenceSkillHandlers(evidenceSkillActions);
type RouteContext = { params: Promise<{ evidenceId: string; skillId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const rejection = await rejectDemoMutation();
  if (rejection) return rejection;
  const { evidenceId, skillId } = await context.params;
  return handlers.DELETE(evidenceId, skillId);
}
