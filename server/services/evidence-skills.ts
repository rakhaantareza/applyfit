import type { InsForgeClient } from "@insforge/sdk";
import { getCareerProfile } from "./career-profile.ts";
import { CareerProfileRequiredError } from "./skills.ts";

const LINK_COLUMNS = "evidence_id,skill_id,created_at";

export type EvidenceSkillLink = {
  evidenceId: string;
  skillId: string;
  createdAt: string;
};

export class EvidenceSkillQueryError extends Error {
  constructor() {
    super("Relasi bukti dan skill tidak dapat dimuat atau diperbarui.");
    this.name = "EvidenceSkillQueryError";
  }
}

export class EvidenceSkillTargetNotFoundError extends Error {
  constructor() {
    super("Bukti atau skill tidak ditemukan pada profil ini.");
    this.name = "EvidenceSkillTargetNotFoundError";
  }
}

export class EvidenceSkillLinkNotFoundError extends Error {
  constructor() {
    super("Relasi bukti dan skill tidak ditemukan.");
    this.name = "EvidenceSkillLinkNotFoundError";
  }
}

export class EvidenceSkillConflictError extends Error {
  constructor() {
    super("Bukti sudah terhubung ke skill tersebut.");
    this.name = "EvidenceSkillConflictError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUniqueViolation(error: unknown): boolean {
  return isRecord(error) && error.code === "23505";
}

export function normalizeEvidenceSkillLink(value: unknown): EvidenceSkillLink {
  if (!isRecord(value)) throw new EvidenceSkillQueryError();
  const { evidence_id, skill_id, created_at } = value;
  if (
    typeof evidence_id !== "string" ||
    typeof skill_id !== "string" ||
    typeof created_at !== "string"
  ) {
    throw new EvidenceSkillQueryError();
  }
  return { evidenceId: evidence_id, skillId: skill_id, createdAt: created_at };
}

function normalizeEvidenceSkillLinks(value: unknown): EvidenceSkillLink[] {
  if (!Array.isArray(value)) throw new EvidenceSkillQueryError();
  return value.map(normalizeEvidenceSkillLink);
}

async function requireProfile(client: InsForgeClient, userId: string) {
  const profile = await getCareerProfile(client, userId);
  if (!profile) throw new CareerProfileRequiredError();
  return profile;
}

async function requireOwnedTargets(
  client: InsForgeClient,
  userId: string,
  evidenceId: string,
  skillId?: string,
) {
  const profile = await requireProfile(client, userId);
  const evidenceResult = await client.database
    .from("evidences")
    .select("id")
    .eq("id", evidenceId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (evidenceResult.error) throw new EvidenceSkillQueryError();
  if (!evidenceResult.data) throw new EvidenceSkillTargetNotFoundError();

  if (skillId) {
    const skillResult = await client.database
      .from("skills")
      .select("id")
      .eq("id", skillId)
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (skillResult.error) throw new EvidenceSkillQueryError();
    if (!skillResult.data) throw new EvidenceSkillTargetNotFoundError();
  }
}

export async function listEvidenceSkillLinks(
  client: InsForgeClient,
  userId: string,
  evidenceId: string,
): Promise<EvidenceSkillLink[]> {
  await requireOwnedTargets(client, userId, evidenceId);
  const { data, error } = await client.database
    .from("skill_evidences")
    .select(LINK_COLUMNS)
    .eq("evidence_id", evidenceId)
    .order("created_at", { ascending: true });

  if (error) throw new EvidenceSkillQueryError();
  return normalizeEvidenceSkillLinks(data);
}

export async function linkEvidenceToSkill(
  client: InsForgeClient,
  userId: string,
  evidenceId: string,
  skillId: string,
): Promise<EvidenceSkillLink> {
  await requireOwnedTargets(client, userId, evidenceId, skillId);
  const { data, error } = await client.database
    .from("skill_evidences")
    .insert([{ evidence_id: evidenceId, skill_id: skillId }])
    .select(LINK_COLUMNS)
    .single();

  if (error) {
    if (isUniqueViolation(error)) throw new EvidenceSkillConflictError();
    throw new EvidenceSkillQueryError();
  }
  return normalizeEvidenceSkillLink(data);
}

export async function unlinkEvidenceFromSkill(
  client: InsForgeClient,
  userId: string,
  evidenceId: string,
  skillId: string,
): Promise<void> {
  await requireOwnedTargets(client, userId, evidenceId, skillId);
  const { data, error } = await client.database
    .from("skill_evidences")
    .delete()
    .eq("evidence_id", evidenceId)
    .eq("skill_id", skillId)
    .select("evidence_id,skill_id")
    .maybeSingle();

  if (error) throw new EvidenceSkillQueryError();
  if (!data) throw new EvidenceSkillLinkNotFoundError();
}
