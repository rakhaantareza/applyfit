import { createInsForgeServerClient } from "../../lib/insforge/server.ts";
import type { EvidenceActions } from "../../../server/http/evidences-handler.ts";
import {
  createEvidence,
  deleteEvidence,
  listEvidences,
  updateEvidence,
} from "../../../server/services/evidences.ts";

async function currentUserContext() {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) throw new Error("InsForge authentication unavailable");
  if (!data.user) return null;
  return { client, userId: data.user.id };
}

export const evidenceActions: EvidenceActions = {
  async list(filters) {
    const context = await currentUserContext();
    if (!context) return { status: "unauthenticated" };
    return {
      status: "ok",
      data: await listEvidences(context.client, context.userId, filters),
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
