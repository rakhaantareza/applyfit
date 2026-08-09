import { createSkillsHandlers } from "../../../../../server/http/skills-handler.ts";
import { skillsActions } from "../actions.ts";

const handlers = createSkillsHandlers(skillsActions);

type RouteContext = { params: Promise<{ skillId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { skillId } = await context.params;
  return handlers.PATCH(request, skillId);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { skillId } = await context.params;
  return handlers.DELETE(skillId);
}
