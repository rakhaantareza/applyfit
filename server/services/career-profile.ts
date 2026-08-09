import type { InsForgeClient } from "@insforge/sdk";

const CAREER_PROFILE_COLUMNS =
  "id,target_role,career_field,created_at,updated_at";

export type CareerProfile = {
  id: string;
  targetRole: string;
  careerField: string;
  createdAt: string;
  updatedAt: string;
};

export type CareerTargetInput = {
  targetRole: string;
  careerField: string;
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
    career_field,
    created_at,
    updated_at,
  } = value;

  if (
    typeof id !== "string" ||
    typeof target_role !== "string" ||
    typeof career_field !== "string" ||
    typeof created_at !== "string" ||
    typeof updated_at !== "string"
  ) {
    throw new CareerProfileQueryError();
  }

  return {
    id,
    targetRole: target_role,
    careerField: career_field,
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

  const values = {
    target_role: input.targetRole,
    career_field: input.careerField,
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
