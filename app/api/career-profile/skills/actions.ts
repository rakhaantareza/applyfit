import { createInsForgeServerClient } from "../../../lib/insforge/server.ts";
import type { SkillsActions } from "../../../../server/http/skills-handler.ts";
import {
  createSkill,
  deleteSkill,
  listSkills,
  updateSkill,
} from "../../../../server/services/skills.ts";
import { listVisibleEvidenceSkillLinks } from "../../../../server/services/evidence-skills.ts";

async function currentUserContext() {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) throw new Error("InsForge authentication unavailable");
  if (!data.user) return null;
  return { client, userId: data.user.id };
}

export const skillsActions: SkillsActions = {
  async list(options) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    if (!options?.includeEvidenceCount) {
      return {
        status: "ok",
        data: await listSkills(context.client, context.userId),
      };
    }
    const [skills, visibleLinks] = await Promise.all([
      listSkills(context.client, context.userId),
      listVisibleEvidenceSkillLinks(context.client),
    ]);
    const skillIds = new Set(skills.map((skill) => skill.id));
    const links = visibleLinks.filter((link) => skillIds.has(link.skillId));
    const evidenceCountBySkill = new Map<string, number>();
    for (const link of links) {
      evidenceCountBySkill.set(
        link.skillId,
        (evidenceCountBySkill.get(link.skillId) ?? 0) + 1,
      );
    }
    return {
      status: "ok",
      data: skills.map((skill) => ({
        ...skill,
        evidenceCount: evidenceCountBySkill.get(skill.id) ?? 0,
      })),
    };
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
