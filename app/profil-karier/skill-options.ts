import type { SearchableComboboxOption } from "../components/searchable-combobox-ranking.ts";
import { normalizeComboboxSearch } from "../components/searchable-combobox-ranking.ts";
import type { CareerCatalog } from "./catalog-types.ts";

type ExistingSkill = {
  id: string;
  name: string;
  catalogSkillId: string | null;
};

type BuildSkillOptionsInput = {
  catalog: CareerCatalog;
  skills: ExistingSkill[];
  editingSkillId: string | null;
  careerFieldId: string | null;
  targetRoleId: string | null;
};

export function buildSkillComboboxOptions({
  catalog,
  skills,
  editingSkillId,
  careerFieldId,
  targetRoleId,
}: BuildSkillOptionsInput): SearchableComboboxOption[] {
  return buildOptions({
    catalog,
    skills,
    editingSkillId,
    careerFieldId,
    targetRoleId,
  });
}

export function buildDefaultSkillComboboxOptions({
  catalog,
  skills,
  editingSkillId,
  careerFieldId,
  targetRoleId,
}: BuildSkillOptionsInput): SearchableComboboxOption[] {
  return buildOptions({
    catalog,
    skills,
    editingSkillId,
    careerFieldId,
    targetRoleId,
  });
}

function buildOptions({
  catalog,
  skills,
  editingSkillId,
  careerFieldId,
  targetRoleId,
}: BuildSkillOptionsInput) {
  const role = catalog.roles.find((item) => item.id === targetRoleId);
  const field = catalog.fields.find((item) => item.id === careerFieldId);
  const contextPriority = new Map<string, number>();

  role?.commonSkillIds.forEach((skillId, index) => {
    contextPriority.set(skillId, index);
  });

  let fieldSkillIndex = 0;
  for (const fieldRole of catalog.roles.filter((item) =>
    careerFieldId ? item.fieldIds.includes(careerFieldId) : false)) {
    for (const skillId of fieldRole.commonSkillIds) {
      if (!contextPriority.has(skillId)) {
        contextPriority.set(skillId, 100 + fieldSkillIndex);
        fieldSkillIndex += 1;
      }
    }
  }

  return catalog.skills
    .filter((catalogSkill) => {
      const catalogNames = [catalogSkill.name, ...catalogSkill.aliases]
        .map(normalizeComboboxSearch);
      return skills.every((skill) =>
        skill.id === editingSkillId ||
        (
          skill.catalogSkillId !== catalogSkill.id &&
          !catalogNames.includes(normalizeComboboxSearch(skill.name))
        ),
      );
    })
    .map((catalogSkill) => ({
      id: catalogSkill.id,
      value: catalogSkill.name,
      aliases: catalogSkill.aliases,
      meta: role?.commonSkillIds.includes(catalogSkill.id)
        ? `Umum untuk ${role.name}`
        : contextPriority.has(catalogSkill.id) && field
          ? `Relevan untuk ${field.name}`
          : undefined,
      priority: contextPriority.get(catalogSkill.id) ?? 1_000,
    }));
}
