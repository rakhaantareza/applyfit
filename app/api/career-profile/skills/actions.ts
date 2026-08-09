import { createInsForgeServerClient } from "../../../lib/insforge/server.ts";
import type { SkillsActions } from "../../../../server/http/skills-handler.ts";
import {
  createSkill,
  deleteSkill,
  listSkills,
  updateSkill,
} from "../../../../server/services/skills.ts";

async function currentUserContext() {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) throw new Error("InsForge authentication unavailable");
  if (!data.user) return null;
  return { client, userId: data.user.id };
}

export const skillsActions: SkillsActions = {
  async list() {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await listSkills(context.client, context.userId) };
  },
  async create(input) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await createSkill(context.client, context.userId, input) };
  },
  async update(skillId, input) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await updateSkill(context.client, context.userId, skillId, input) };
  },
  async remove(skillId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    await deleteSkill(context.client, context.userId, skillId);
    return { status: "ok", data: null };
  },
};
