import type { InsForgeClient } from "@insforge/sdk";

export type CareerCatalogField = {
  id: string;
  slug: string;
  name: string;
};

export type CareerCatalogRole = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  fieldIds: string[];
  commonSkillIds: string[];
};

export type CareerCatalogSkill = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
};

export type CareerCatalog = {
  fields: CareerCatalogField[];
  roles: CareerCatalogRole[];
  skills: CareerCatalogSkill[];
};

export class CareerCatalogQueryError extends Error {
  constructor() {
    super("Katalog karier belum dapat dimuat.");
    this.name = "CareerCatalogQueryError";
  }
}

type CatalogIdentityInput = {
  id?: string | null;
  name: string;
};

export type ResolvedCareerDirection = {
  careerField: string;
  careerFieldId: string | null;
  targetRole: string;
  targetRoleId: string | null;
};

export type ResolvedCatalogSkill = {
  name: string;
  catalogSkillId: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string") throw new CareerCatalogQueryError();
  return value;
}

function normalizeRows(value: unknown) {
  if (!Array.isArray(value)) throw new CareerCatalogQueryError();
  return value.map((row) => {
    if (!isRecord(row)) throw new CareerCatalogQueryError();
    return row;
  });
}

export function normalizeCatalogSearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("id-ID")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export async function getCareerCatalog(client: InsForgeClient): Promise<CareerCatalog> {
  const [
    fieldsResult,
    rolesResult,
    roleAliasesResult,
    skillsResult,
    skillAliasesResult,
    fieldRolesResult,
    roleSkillsResult,
  ] = await Promise.all([
    client.database.from("career_fields").select("id,slug,name,sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
    client.database.from("career_roles").select("id,slug,name").eq("is_active", true).order("name", { ascending: true }),
    client.database.from("career_role_aliases").select("role_id,alias").order("alias", { ascending: true }),
    client.database.from("catalog_skills").select("id,slug,name").eq("is_active", true).order("name", { ascending: true }),
    client.database.from("catalog_skill_aliases").select("skill_id,alias").order("alias", { ascending: true }),
    client.database.from("career_field_roles").select("field_id,role_id,sort_order").order("sort_order", { ascending: true }),
    client.database.from("career_role_skills").select("role_id,skill_id,sort_order").order("sort_order", { ascending: true }),
  ]);

  if (
    fieldsResult.error || rolesResult.error || roleAliasesResult.error ||
    skillsResult.error || skillAliasesResult.error || fieldRolesResult.error ||
    roleSkillsResult.error
  ) {
    throw new CareerCatalogQueryError();
  }

  const roleAliases = new Map<string, string[]>();
  for (const row of normalizeRows(roleAliasesResult.data)) {
    const roleId = requiredString(row, "role_id");
    const aliases = roleAliases.get(roleId) ?? [];
    aliases.push(requiredString(row, "alias"));
    roleAliases.set(roleId, aliases);
  }

  const skillAliases = new Map<string, string[]>();
  for (const row of normalizeRows(skillAliasesResult.data)) {
    const skillId = requiredString(row, "skill_id");
    const aliases = skillAliases.get(skillId) ?? [];
    aliases.push(requiredString(row, "alias"));
    skillAliases.set(skillId, aliases);
  }

  const roleFields = new Map<string, string[]>();
  for (const row of normalizeRows(fieldRolesResult.data)) {
    const roleId = requiredString(row, "role_id");
    const fieldIds = roleFields.get(roleId) ?? [];
    fieldIds.push(requiredString(row, "field_id"));
    roleFields.set(roleId, fieldIds);
  }

  const roleSkills = new Map<string, string[]>();
  for (const row of normalizeRows(roleSkillsResult.data)) {
    const roleId = requiredString(row, "role_id");
    const skillIds = roleSkills.get(roleId) ?? [];
    skillIds.push(requiredString(row, "skill_id"));
    roleSkills.set(roleId, skillIds);
  }

  return {
    fields: normalizeRows(fieldsResult.data).map((row) => ({
      id: requiredString(row, "id"),
      slug: requiredString(row, "slug"),
      name: requiredString(row, "name"),
    })),
    roles: normalizeRows(rolesResult.data).map((row) => {
      const id = requiredString(row, "id");
      return {
        id,
        slug: requiredString(row, "slug"),
        name: requiredString(row, "name"),
        aliases: roleAliases.get(id) ?? [],
        fieldIds: roleFields.get(id) ?? [],
        commonSkillIds: roleSkills.get(id) ?? [],
      };
    }),
    skills: normalizeRows(skillsResult.data).map((row) => {
      const id = requiredString(row, "id");
      return {
        id,
        slug: requiredString(row, "slug"),
        name: requiredString(row, "name"),
        aliases: skillAliases.get(id) ?? [],
      };
    }),
  };
}

const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedCatalog: { data: CareerCatalog; expiresAt: number } | null = null;
let catalogRequest: Promise<CareerCatalog> | null = null;

export async function getCachedCareerCatalog(client: InsForgeClient) {
  if (cachedCatalog && cachedCatalog.expiresAt > Date.now()) {
    return cachedCatalog.data;
  }

  catalogRequest ??= getCareerCatalog(client)
    .then((catalog) => {
      cachedCatalog = {
        data: catalog,
        expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
      };
      return catalog;
    })
    .finally(() => {
      catalogRequest = null;
    });

  return catalogRequest;
}

export function resolveCatalogItem<T extends { id: string; name: string; aliases?: string[] }>(
  items: T[],
  input: CatalogIdentityInput,
) {
  const selected = input.id ? items.find((item) => item.id === input.id) : undefined;
  if (selected) return selected;

  const key = normalizeCatalogSearch(input.name);
  return items.find((item) =>
    normalizeCatalogSearch(item.name) === key ||
    item.aliases?.some((alias) => normalizeCatalogSearch(alias) === key),
  );
}

export function resolveCatalogSkillFromCatalog(
  catalog: CareerCatalog,
  input: CatalogIdentityInput,
): ResolvedCatalogSkill {
  const skill = resolveCatalogItem(catalog.skills, input);
  return {
    name: skill?.name ?? input.name.trim(),
    catalogSkillId: skill?.id ?? null,
  };
}

export async function resolveCareerDirection(
  client: InsForgeClient,
  input: { careerField: CatalogIdentityInput; targetRole: CatalogIdentityInput },
): Promise<ResolvedCareerDirection> {
  const catalog = await getCareerCatalog(client);
  const field = resolveCatalogItem(catalog.fields, input.careerField);
  const role = resolveCatalogItem(catalog.roles, input.targetRole);

  return {
    careerField: field?.name ?? input.careerField.name.trim(),
    careerFieldId: field?.id ?? null,
    targetRole: role?.name ?? input.targetRole.name.trim(),
    targetRoleId: role?.id ?? null,
  };
}

export async function resolveCatalogSkill(
  client: InsForgeClient,
  input: CatalogIdentityInput,
): Promise<ResolvedCatalogSkill> {
  const catalog = await getCareerCatalog(client);
  return resolveCatalogSkillFromCatalog(catalog, input);
}
