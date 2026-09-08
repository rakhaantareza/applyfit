import type { InsForgeClient } from "@insforge/sdk";
import { resolveCareerDirection } from "./career-catalog.ts";

const CAREER_PROFILE_COLUMNS =
  "id,target_role,target_role_id,career_field,career_field_id,created_at,updated_at";

export type CareerProfile = {
  id: string;
  targetRole: string;
  targetRoleId: string | null;
  careerField: string;
  careerFieldId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CareerTargetInput = {
  targetRole: string;
  targetRoleId?: string | null;
  careerField: string;
  careerFieldId?: string | null;
};

export class CareerProfileQueryError extends Error {
  constructor() {
    super("Profil karier tidak dapat dimuat atau diperbarui.");
    this.name = "CareerProfileQueryError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeCareerProfile(value: unknown): CareerProfile | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new CareerProfileQueryError();

  const {
    id,
    target_role,
    target_role_id,
    career_field,
    career_field_id,
    created_at,
    updated_at,
  } = value;

  if (
    typeof id !== "string" ||
    typeof target_role !== "string" ||
    (target_role_id !== null && typeof target_role_id !== "string") ||
    typeof career_field !== "string" ||
    (career_field_id !== null && typeof career_field_id !== "string") ||
    typeof created_at !== "string" ||
    typeof updated_at !== "string"
  ) {
    throw new CareerProfileQueryError();
  }

  return {
    id,
    targetRole: target_role,
    targetRoleId: target_role_id,
    careerField: career_field,
    careerFieldId: career_field_id,
    createdAt: created_at,
    updatedAt: updated_at,
  };
}

export async function getCareerProfile(
  client: InsForgeClient,
  userId: string,
): Promise<CareerProfile | null> {
  const { data, error } = await client.database
    .from("profiles")
    .select(CAREER_PROFILE_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new CareerProfileQueryError();

  return normalizeCareerProfile(data);
}

export async function saveCareerTarget(
  client: InsForgeClient,
  userId: string,
  input: CareerTargetInput,
): Promise<CareerProfile> {
  let currentProfile: CareerProfile | null;
  try {
    currentProfile = await getCareerProfile(client, userId);
  } catch {
    throw new CareerProfileQueryError();
  }

  const resolved = await resolveCareerDirection(client, {
    targetRole: { id: input.targetRoleId, name: input.targetRole },
    careerField: { id: input.careerFieldId, name: input.careerField },
  });
  const values = {
    target_role: resolved.targetRole,
    target_role_id: resolved.targetRoleId,
    career_field: resolved.careerField,
    career_field_id: resolved.careerFieldId,
  };

  const result = currentProfile
    ? await client.database
        .from("profiles")
        .update(values)
        .eq("id", currentProfile.id)
        .eq("user_id", userId)
        .select(CAREER_PROFILE_COLUMNS)
        .single()
    : await client.database
        .from("profiles")
        .insert([values])
        .select(CAREER_PROFILE_COLUMNS)
        .single();

  if (result.error) throw new CareerProfileQueryError();

  const profile = normalizeCareerProfile(result.data);
  if (!profile) throw new CareerProfileQueryError();

  return profile;
}
