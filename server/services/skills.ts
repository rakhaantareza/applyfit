import type { InsForgeClient } from "@insforge/sdk";
import { getCareerProfile } from "./career-profile.ts";

const SKILL_COLUMNS = "id,profile_id,name,status,level,created_at,updated_at";

export type SkillStatus = "active" | "learning";

export type Skill = {
  id: string;
  profileId: string;
  name: string;
  status: SkillStatus;
  level: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSkillInput = {
  name: string;
  status: SkillStatus;
  level: string | null;
};

export type UpdateSkillInput = Partial<CreateSkillInput>;

export class SkillQueryError extends Error {
  constructor() {
    super("Data skill tidak dapat dimuat atau diperbarui.");
    this.name = "SkillQueryError";
  }
}

export class SkillNotFoundError extends Error {
  constructor() {
    super("Skill tidak ditemukan.");
    this.name = "SkillNotFoundError";
  }
}

export class SkillConflictError extends Error {
  constructor() {
    super("Skill dengan nama tersebut sudah ada di profil.");
    this.name = "SkillConflictError";
  }
}

export class CareerProfileRequiredError extends Error {
  constructor() {
    super("Lengkapi target karier sebelum menambahkan skill.");
    this.name = "CareerProfileRequiredError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSkillStatus(value: unknown): value is SkillStatus {
  return value === "active" || value === "learning";
}

function isUniqueViolation(error: unknown): boolean {
  return isRecord(error) && error.code === "23505";
}

export function normalizeSkill(value: unknown): Skill {
  if (!isRecord(value)) throw new SkillQueryError();

  const {
    id,
    profile_id,
    name,
    status,
    level,
    created_at,
    updated_at,
  } = value;

  if (
    typeof id !== "string" ||
    typeof profile_id !== "string" ||
    typeof name !== "string" ||
    !isSkillStatus(status) ||
    (level !== null && typeof level !== "string") ||
    typeof created_at !== "string" ||
    typeof updated_at !== "string"
  ) {
    throw new SkillQueryError();
  }

  return {
    id,
    profileId: profile_id,
    name,
    status,
    level,
    createdAt: created_at,
    updatedAt: updated_at,
  };
}

export function normalizeSkills(value: unknown): Skill[] {
  if (!Array.isArray(value)) throw new SkillQueryError();
  return value.map(normalizeSkill);
}

async function requireProfile(client: InsForgeClient, userId: string) {
  const profile = await getCareerProfile(client, userId);
  if (!profile) throw new CareerProfileRequiredError();
  return profile;
}

export async function listSkills(
  client: InsForgeClient,
  userId: string,
): Promise<Skill[]> {
  const profile = await getCareerProfile(client, userId);
  if (!profile) return [];

  const { data, error } = await client.database
    .from("skills")
    .select(SKILL_COLUMNS)
    .eq("profile_id", profile.id)
    .order("name", { ascending: true });

  if (error) throw new SkillQueryError();
  return normalizeSkills(data);
}

export async function createSkill(
  client: InsForgeClient,
  userId: string,
  input: CreateSkillInput,
): Promise<Skill> {
  const profile = await requireProfile(client, userId);
  const { data, error } = await client.database
    .from("skills")
    .insert([
      {
        profile_id: profile.id,
        name: input.name,
        status: input.status,
        level: input.level,
      },
    ])
    .select(SKILL_COLUMNS)
    .single();

  if (error) {
    if (isUniqueViolation(error)) throw new SkillConflictError();
    throw new SkillQueryError();
  }

  return normalizeSkill(data);
}

export async function updateSkill(
  client: InsForgeClient,
  userId: string,
  skillId: string,
  input: UpdateSkillInput,
): Promise<Skill> {
  const profile = await requireProfile(client, userId);
  const values = {
    ...(input.name === undefined ? {} : { name: input.name }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.level === undefined ? {} : { level: input.level }),
  };
  const { data, error } = await client.database
    .from("skills")
    .update(values)
    .eq("id", skillId)
    .eq("profile_id", profile.id)
    .select(SKILL_COLUMNS)
    .maybeSingle();

  if (error) {
    if (isUniqueViolation(error)) throw new SkillConflictError();
    throw new SkillQueryError();
  }
  if (!data) throw new SkillNotFoundError();

  return normalizeSkill(data);
}

export async function deleteSkill(
  client: InsForgeClient,
  userId: string,
  skillId: string,
): Promise<void> {
  const profile = await requireProfile(client, userId);
  const { data, error } = await client.database
    .from("skills")
    .delete()
    .eq("id", skillId)
    .eq("profile_id", profile.id)
    .select("id")
    .maybeSingle();

  if (error) throw new SkillQueryError();
  if (!data) throw new SkillNotFoundError();
}
