import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../migrations/20260830043613_add-career-catalog.sql",
  import.meta.url,
);
const expansionMigrationUrl = new URL(
  "../migrations/20260830203626_expand-career-skill-catalog.sql",
  import.meta.url,
);

test("career catalog uses canonical entities and many-to-many relationships", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  for (const table of [
    "career_fields",
    "career_roles",
    "career_role_aliases",
    "catalog_skills",
    "catalog_skill_aliases",
    "career_field_roles",
    "career_role_skills",
  ]) {
    assert.match(sql, new RegExp(`CREATE TABLE public\\.${table}`));
    assert.match(sql, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`));
    assert.match(sql, new RegExp(`GRANT SELECT ON public\\.${table} TO authenticated`));
  }

  assert.match(sql, /PRIMARY KEY \(field_id, role_id\)/);
  assert.match(sql, /PRIMARY KEY \(role_id, skill_id\)/);
  assert.match(sql, /ADD COLUMN career_field_id UUID REFERENCES public\.career_fields/);
  assert.match(sql, /ADD COLUMN target_role_id UUID REFERENCES public\.career_roles/);
  assert.match(sql, /ADD COLUMN catalog_skill_id UUID REFERENCES public\.catalog_skills/);
});

test("catalog seeds representative fields and deterministic aliases", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /'Software & IT'/);
  assert.match(sql, /'Design & Creative'/);
  assert.match(sql, /'Marketing'/);
  assert.match(sql, /'Frontend Engineer'/);
  assert.match(sql, /'Graphic Designer'/);
  assert.match(sql, /'Digital Marketing Specialist'/);
  assert.match(sql, /\('javascript', 'JS', 'js'\)/);
  assert.match(sql, /\('react', 'ReactJS', 'reactjs'\)/);
  assert.match(sql, /\('typescript', 'TS', 'ts'\)/);
});

test("catalog correction covers common skills and every career-field family", async () => {
  const sql = await readFile(expansionMigrationUrl, "utf8");

  for (const canonicalSkill of [
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Git",
    "Cybersecurity",
    "Design Systems",
    "Marketing Analytics",
    "Statistics",
    "Product Roadmapping",
    "Financial Analysis",
    "Inventory Management",
    "Employee Relations",
  ]) {
    assert.match(sql, new RegExp(`'${canonicalSkill.replace(".", "\\.")}'`));
  }

  assert.match(sql, /\('javascript', 'JS', 'js'\)/);
  assert.match(sql, /\('react', 'ReactJS', 'reactjs'\)/);
  assert.match(sql, /\('react', 'React\.js', 'react\.js'\)/);
  assert.match(sql, /\('nodejs', 'NodeJS', 'nodejs'\)/);
  assert.match(sql, /\('content-marketing-specialist', 'content-strategy', 10\)/);
  assert.match(sql, /\('cybersecurity-analyst', 'cybersecurity', 10\)/);
  assert.match(sql, /\('customer-success-specialist', 'customer-success', 10\)/);
  assert.match(sql, /ON CONFLICT \(role_id, skill_id\) DO UPDATE/);
});
