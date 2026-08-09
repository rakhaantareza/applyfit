import { createSkillsHandlers } from "../../../../server/http/skills-handler.ts";
import { skillsActions } from "./actions.ts";

const handlers = createSkillsHandlers(skillsActions);

export const GET = handlers.GET;
export const POST = handlers.POST;
