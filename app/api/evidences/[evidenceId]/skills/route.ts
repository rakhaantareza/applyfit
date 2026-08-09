import { createEvidenceSkillHandlers } from "../../../../../server/http/evidence-skills-handler.ts";
import { evidenceSkillActions } from "./actions.ts";

const handlers = createEvidenceSkillHandlers(evidenceSkillActions);
type RouteContext = { params: Promise<{ evidenceId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { evidenceId } = await context.params;
  return handlers.GET(evidenceId);
}

export async function POST(request: Request, context: RouteContext) {
  const { evidenceId } = await context.params;
  return handlers.POST(request, evidenceId);
}
