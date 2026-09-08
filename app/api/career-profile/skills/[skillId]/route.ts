import { createSkillsHandlers } from "../../../../../server/http/skills-handler.ts";
import { rejectDemoMutation } from "../../../../lib/insforge/demo-read-only.ts";
import { skillsActions } from "../actions.ts";

const handlers = createSkillsHandlers(skillsActions);

type RouteContext = { params: Promise<{ skillId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const rejection = await rejectDemoMutation();
  if (rejection) return rejection;
  const { skillId } = await context.params;
  return handlers.PATCH(request, skillId);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const rejection = await rejectDemoMutation();
  if (rejection) return rejection;
  const { skillId } = await context.params;
  return handlers.DELETE(skillId);
}
