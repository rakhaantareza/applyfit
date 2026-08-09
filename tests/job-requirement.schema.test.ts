import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const bootstrapMigrationUrl = new URL(
  "../migrations/20260807214017_bootstrap-core-fit-score.sql",
  import.meta.url,
);
const derivedStatusMigrationUrl = new URL(
  "../migrations/20260808003719_derive-requirement-status.sql",
  import.meta.url,
);
const mergeMigrationUrl = new URL(
  "../migrations/20260809170000_merge-job-requirements.sql",
  import.meta.url,
);
const splitMigrationUrl = new URL(
  "../migrations/20260809172000_split-job-requirement.sql",
  import.meta.url,
);
const saveReviewMigrationUrl = new URL(
  "../migrations/20260809174000_save-reviewed-job-requirements.sql",
  import.meta.url,
);

test("job requirement model persists only reviewed requirement data", async () => {
  const bootstrapSql = await readFile(bootstrapMigrationUrl, "utf8");
  const derivedStatusSql = await readFile(derivedStatusMigrationUrl, "utf8");

  assert.match(
    bootstrapSql,
    /CREATE TABLE public\.job_requirements \([\s\S]*?id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)[\s\S]*?job_id UUID NOT NULL\s+REFERENCES public\.job_postings\(id\) ON DELETE CASCADE[\s\S]*?name TEXT NOT NULL[\s\S]*?type public\.requirement_type NOT NULL[\s\S]*?priority public\.requirement_priority NOT NULL[\s\S]*?created_at TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)[\s\S]*?updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)[\s\S]*?\);/,
  );
  assert.match(derivedStatusSql, /ALTER TABLE public\.job_requirements\s+DROP COLUMN status/);
  assert.doesNotMatch(
    derivedStatusSql,
    /GRANT (?:INSERT|UPDATE) \([^)]*status[^)]*\)\s+ON public\.job_requirements/,
  );
});

test("requirement enums reflect extraction and scoring priorities", async () => {
  const sql = await readFile(bootstrapMigrationUrl, "utf8");

  assert.match(
    sql,
    /CREATE TYPE public\.requirement_type AS ENUM \(\s*'skill',\s*'tool',\s*'education',\s*'experience'\s*\)/,
  );
  assert.match(
    sql,
    /CREATE TYPE public\.requirement_priority AS ENUM \(\s*'required',\s*'preferred'\s*\)/,
  );
});

test("job requirements are indexed and protected by owner-scoped RLS", async () => {
  const sql = await readFile(bootstrapMigrationUrl, "utf8");

  assert.match(sql, /CREATE INDEX job_requirements_job_id_idx\s+ON public\.job_requirements \(job_id\)/);
  assert.match(sql, /CREATE INDEX job_requirements_job_type_idx\s+ON public\.job_requirements \(job_id, type\)/);
  assert.match(sql, /ALTER TABLE public\.job_requirements ENABLE ROW LEVEL SECURITY/);

  for (const operation of ["select", "insert", "update", "delete"]) {
    assert.match(
      sql,
      new RegExp(`CREATE POLICY job_requirements_${operation}_own\\s+ON public\\.job_requirements`),
    );
  }
});

test("requirement merging is atomic, owner-scoped, and preserves mappings", async () => {
  const sql = await readFile(mergeMigrationUrl, "utf8");

  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.merge_job_requirements/);
  assert.match(sql, /LANGUAGE plpgsql\s+SECURITY INVOKER/);
  assert.match(sql, /job\.user_id = auth\.uid\(\)/);
  assert.match(sql, /COUNT\(DISTINCT \(requirement\.type, requirement\.priority\)\)/);
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /INSERT INTO public\.requirement_mappings \(requirement_id, skill_id\)/);
  assert.match(sql, /ON CONFLICT DO NOTHING/);
  assert.match(
    sql,
    /ALTER FUNCTION public\.merge_job_requirements\(UUID, UUID\[\], TEXT\)\s+OWNER TO project_admin/,
  );
  assert.doesNotMatch(sql, /SECURITY DEFINER/);
});

test("requirement splitting is atomic, owner-scoped, and preserves mappings", async () => {
  const sql = await readFile(splitMigrationUrl, "utf8");

  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.split_job_requirement/);
  assert.match(sql, /LANGUAGE plpgsql\s+SECURITY INVOKER/);
  assert.match(sql, /job\.user_id = auth\.uid\(\)/);
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /FOREACH split_name IN ARRAY normalized_names LOOP/);
  assert.match(sql, /source_requirement\.type/);
  assert.match(sql, /source_requirement\.priority/);
  assert.match(sql, /INSERT INTO public\.requirement_mappings \(requirement_id, skill_id\)/);
  assert.match(
    sql,
    /ALTER FUNCTION public\.split_job_requirement\(UUID, UUID, TEXT\[\]\)\s+OWNER TO project_admin/,
  );
  assert.doesNotMatch(sql, /SECURITY DEFINER/);
});

test("review persistence updates retained IDs and replaces only omitted requirements", async () => {
  const sql = await readFile(saveReviewMigrationUrl, "utf8");

  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.save_reviewed_job_requirements/);
  assert.match(sql, /LANGUAGE plpgsql\s+SECURITY INVOKER/);
  assert.match(sql, /job\.user_id = auth\.uid\(\)/);
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /provided_ids IS NULL\s+OR NOT \(requirement\.id = ANY\(provided_ids\)\)/);
  assert.match(sql, /UPDATE public\.job_requirements AS requirement/);
  assert.match(sql, /INSERT INTO public\.job_requirements \(job_id, name, type, priority\)/);
  assert.match(sql, /item \? 'status'/);
  assert.match(
    sql,
    /ALTER FUNCTION public\.save_reviewed_job_requirements\(UUID, JSONB\)\s+OWNER TO project_admin/,
  );
  assert.doesNotMatch(sql, /SECURITY DEFINER/);
});
