import { createSkillsHandlers } from "../../../server/http/skills-handler.ts";
import { protectDemoMutation } from "../../lib/insforge/demo-read-only.ts";
import { skillsActions } from "./actions.ts";

const handlers = createSkillsHandlers(skillsActions);

export const GET = handlers.GET;
export const POST = protectDemoMutation(handlers.POST);
