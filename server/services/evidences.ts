import type { InsForgeClient } from "@insforge/sdk";
import { getCareerProfile } from "./career-profile.ts";
import { CareerProfileRequiredError } from "./skills.ts";

const EVIDENCE_COLUMNS =
  "id,profile_id,title,type,url,description,created_at,updated_at";

export type EvidenceType =
  | "project"
  | "cert"
  | "work"
  | "internship"
  | "github"
  | "portfolio";

export type Evidence = {
  id: string;
  profileId: string;
  title: string;
  type: EvidenceType;
  url: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateEvidenceInput = {
  title: string;
  type: EvidenceType;
  url: string | null;
  description: string;
};

export type UpdateEvidenceInput = Partial<CreateEvidenceInput>;

export type EvidenceFilters = {
  query?: string;
  type?: EvidenceType;
  skillId?: string;
};

export class EvidenceQueryError extends Error {
  constructor() {
    super("Data bukti tidak dapat dimuat atau diperbarui.");
    this.name = "EvidenceQueryError";
  }
}

export class EvidenceNotFoundError extends Error {
  constructor() {
    super("Bukti tidak ditemukan.");
    this.name = "EvidenceNotFoundError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEvidenceType(value: unknown): value is EvidenceType {
  return (
    value === "project" ||
    value === "cert" ||
    value === "work" ||
    value === "internship" ||
    value === "github" ||
    value === "portfolio"
  );
}

export function normalizeEvidence(value: unknown): Evidence {
  if (!isRecord(value)) throw new EvidenceQueryError();

  const {
    id,
    profile_id,
    title,
    type,
    url,
    description,
    created_at,
    updated_at,
  } = value;

  if (
    typeof id !== "string" ||
    typeof profile_id !== "string" ||
    typeof title !== "string" ||
    !isEvidenceType(type) ||
    (url !== null && typeof url !== "string") ||
    typeof description !== "string" ||
    typeof created_at !== "string" ||
    typeof updated_at !== "string"
  ) {
    throw new EvidenceQueryError();
  }

  return {
    id,
    profileId: profile_id,
    title,
    type,
    url,
    description,
    createdAt: created_at,
    updatedAt: updated_at,
  };
}

export function normalizeEvidences(value: unknown): Evidence[] {
  if (!Array.isArray(value)) throw new EvidenceQueryError();
  return value.map(normalizeEvidence);
}

export function filterEvidencesByQuery(
  evidences: Evidence[],
  query?: string,
): Evidence[] {
  const normalizedQuery = query?.trim().toLocaleLowerCase("id-ID");
  if (!normalizedQuery) return evidences;

  return evidences.filter((evidence) =>
    [evidence.title, evidence.description, evidence.url ?? "", evidence.type]
      .some((value) => value.toLocaleLowerCase("id-ID").includes(normalizedQuery)),
  );
}

async function requireProfile(client: InsForgeClient, userId: string) {
  const profile = await getCareerProfile(client, userId);
  if (!profile) throw new CareerProfileRequiredError();
  return profile;
}

export async function listEvidences(
  client: InsForgeClient,
  userId: string,
  filters: EvidenceFilters = {},
): Promise<Evidence[]> {
  const profile = await getCareerProfile(client, userId);
  if (!profile) return [];

  let evidenceIds: string[] | null = null;
  if (filters.skillId) {
    const linksResult = await client.database
      .from("skill_evidences")
      .select("evidence_id")
      .eq("skill_id", filters.skillId);

    if (linksResult.error || !Array.isArray(linksResult.data)) {
      throw new EvidenceQueryError();
    }
    evidenceIds = linksResult.data.flatMap((row) =>
      isRecord(row) && typeof row.evidence_id === "string"
        ? [row.evidence_id]
        : [],
    );
    if (!evidenceIds.length) return [];
  }

  let query = client.database
    .from("evidences")
    .select(EVIDENCE_COLUMNS)
    .eq("profile_id", profile.id);

  if (filters.type) query = query.eq("type", filters.type);
  if (evidenceIds) query = query.in("id", evidenceIds);

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) throw new EvidenceQueryError();
  const evidences = normalizeEvidences(data);
  return filterEvidencesByQuery(evidences, filters.query);
}

export async function createEvidence(
  client: InsForgeClient,
  userId: string,
  input: CreateEvidenceInput,
): Promise<Evidence> {
  const profile = await requireProfile(client, userId);
  const { data, error } = await client.database
    .from("evidences")
    .insert([{ profile_id: profile.id, ...input }])
    .select(EVIDENCE_COLUMNS)
    .single();

  if (error) throw new EvidenceQueryError();
  return normalizeEvidence(data);
}

export async function updateEvidence(
  client: InsForgeClient,
  userId: string,
  evidenceId: string,
  input: UpdateEvidenceInput,
): Promise<Evidence> {
  const profile = await requireProfile(client, userId);
  const { data, error } = await client.database
    .from("evidences")
    .update(input)
    .eq("id", evidenceId)
    .eq("profile_id", profile.id)
    .select(EVIDENCE_COLUMNS)
    .maybeSingle();

  if (error) throw new EvidenceQueryError();
  if (!data) throw new EvidenceNotFoundError();
  return normalizeEvidence(data);
}

export async function deleteEvidence(
  client: InsForgeClient,
  userId: string,
  evidenceId: string,
): Promise<void> {
  const profile = await requireProfile(client, userId);
  const { data, error } = await client.database
    .from("evidences")
    .delete()
    .eq("id", evidenceId)
    .eq("profile_id", profile.id)
    .select("id")
    .maybeSingle();

  if (error) throw new EvidenceQueryError();
  if (!data) throw new EvidenceNotFoundError();
}
