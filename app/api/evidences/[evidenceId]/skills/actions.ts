import { createInsForgeServerClient } from "../../../../lib/insforge/server.ts";
import type { EvidenceSkillActions } from "../../../../../server/http/evidence-skills-handler.ts";
import {
  linkEvidenceToSkill,
  listEvidenceSkillLinks,
  unlinkEvidenceFromSkill,
} from "../../../../../server/services/evidence-skills.ts";

async function currentUserContext() {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) throw new Error("InsForge authentication unavailable");
  if (!data.user) return null;
  return { client, userId: data.user.id };
}

export const evidenceSkillActions: EvidenceSkillActions = {
  async list(evidenceId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await listEvidenceSkillLinks(context.client, context.userId, evidenceId) };
  },
  async link(evidenceId, skillId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await linkEvidenceToSkill(context.client, context.userId, evidenceId, skillId) };
  },
  async unlink(evidenceId, skillId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    await unlinkEvidenceFromSkill(context.client, context.userId, evidenceId, skillId);
    return { status: "ok", data: null };
  },
};
