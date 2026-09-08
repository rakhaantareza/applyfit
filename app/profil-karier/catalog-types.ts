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

export const EMPTY_CAREER_CATALOG: CareerCatalog = {
  fields: [],
  roles: [],
  skills: [],
};
