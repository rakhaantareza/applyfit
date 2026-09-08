import { createInsForgeServerClient } from "../../lib/insforge/server.ts";
import type { EvidenceActions } from "../../../server/http/evidences-handler.ts";
import {
  createEvidence,
  deleteEvidence,
  listEvidences,
  updateEvidence,
} from "../../../server/services/evidences.ts";
import { listVisibleEvidenceSkillLinks } from "../../../server/services/evidence-skills.ts";

async function currentUserContext() {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) throw new Error("InsForge authentication unavailable");
  if (!data.user) return null;
  return { client, userId: data.user.id };
}

export const evidenceActions: EvidenceActions = {
  async list(filters, options) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    if (!options?.includeSkills) {
      return {
        status: "ok",
        data: await listEvidences(context.client, context.userId, filters),
      };
    }
    const [evidences, visibleLinks] = await Promise.all([
      listEvidences(context.client, context.userId, filters),
      listVisibleEvidenceSkillLinks(context.client),
    ]);
    const evidenceIds = new Set(evidences.map((evidence) => evidence.id));
    const links = visibleLinks.filter((link) => evidenceIds.has(link.evidenceId));
    const skillIdsByEvidence = new Map<string, string[]>();
    for (const link of links) {
      const skillIds = skillIdsByEvidence.get(link.evidenceId) ?? [];
      skillIds.push(link.skillId);
      skillIdsByEvidence.set(link.evidenceId, skillIds);
    }
    return {
      status: "ok",
      data: evidences.map((evidence) => ({
        ...evidence,
        skillIds: skillIdsByEvidence.get(evidence.id) ?? [],
      })),
    };
  },
  async create(input) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await createEvidence(context.client, context.userId, input) };
  },
  async update(evidenceId, input) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return { status: "ok", data: await updateEvidence(context.client, context.userId, evidenceId, input) };
  },
  async remove(evidenceId) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    await deleteEvidence(context.client, context.userId, evidenceId);
    return { status: "ok", data: null };
  },
};
