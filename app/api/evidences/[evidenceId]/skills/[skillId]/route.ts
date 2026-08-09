import { createEvidenceSkillHandlers } from "../../../../../../server/http/evidence-skills-handler.ts";
import { evidenceSkillActions } from "../actions.ts";

const handlers = createEvidenceSkillHandlers(evidenceSkillActions);
type RouteContext = { params: Promise<{ evidenceId: string; skillId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { evidenceId, skillId } = await context.params;
  return handlers.DELETE(evidenceId, skillId);
}
