import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const skillMigrationUrl = new URL(
  "../migrations/20260808003719_derive-requirement-status.sql",
  import.meta.url,
);
const hardenedRlsMigrationUrl = new URL(
  "../migrations/20260808004816_harden-derived-status-rls.sql",
  import.meta.url,
);

test("skill model persists the PRD fields and profile relationship", async () => {
  const sql = await readFile(skillMigrationUrl, "utf8");

  assert.match(
    sql,
    /CREATE TYPE public\.skill_status AS ENUM \(\s*'active',\s*'learning'\s*\)/,
  );
  assert.match(
    sql,
    /CREATE TABLE public\.skills \([\s\S]*?id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)[\s\S]*?profile_id UUID NOT NULL\s+REFERENCES public\.profiles\(id\) ON DELETE CASCADE[\s\S]*?name TEXT NOT NULL[\s\S]*?status public\.skill_status NOT NULL DEFAULT 'active'[\s\S]*?level TEXT[\s\S]*?created_at TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)[\s\S]*?updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)[\s\S]*?\);/,
  );
});

test("skill model prevents duplicate names within one profile and tracks updates", async () => {
  const sql = await readFile(skillMigrationUrl, "utf8");

  assert.match(
    sql,
    /CREATE INDEX skills_profile_id_idx\s+ON public\.skills \(profile_id\)/,
  );
  assert.match(
    sql,
    /CREATE UNIQUE INDEX skills_profile_name_unique_idx\s+ON public\.skills \(profile_id, LOWER\(name\)\)/,
  );
  assert.match(
    sql,
    /CREATE TRIGGER skills_updated_at\s+BEFORE UPDATE ON public\.skills\s+FOR EACH ROW\s+EXECUTE FUNCTION system\.update_updated_at\(\)/,
  );
});

test("skill access stays scoped to the authenticated profile owner", async () => {
  const [skillSql, hardenedRlsSql] = await Promise.all([
    readFile(skillMigrationUrl, "utf8"),
    readFile(hardenedRlsMigrationUrl, "utf8"),
  ]);

  assert.match(skillSql, /ALTER TABLE public\.skills ENABLE ROW LEVEL SECURITY/);
  assert.match(skillSql, /REVOKE ALL ON public\.skills FROM anon, authenticated/);
  assert.match(skillSql, /GRANT SELECT, DELETE ON public\.skills TO authenticated/);
  assert.match(
    skillSql,
    /GRANT INSERT \(profile_id, name, status, level\)\s+ON public\.skills TO authenticated/,
  );
  assert.match(
    skillSql,
    /GRANT UPDATE \(name, status, level\)\s+ON public\.skills TO authenticated/,
  );

  for (const operation of ["select", "insert", "update", "delete"]) {
    assert.match(
      hardenedRlsSql,
      new RegExp(`CREATE POLICY skills_${operation}_own\\s+ON public\\.skills`),
    );
  }

  assert.match(
    hardenedRlsSql,
    /FROM public\.profiles AS profile\s+WHERE profile\.id = skills\.profile_id\s+AND profile\.user_id = \(SELECT auth\.uid\(\)\)/,
  );
});
