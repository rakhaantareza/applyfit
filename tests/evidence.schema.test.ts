import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const bootstrapMigrationUrl = new URL(
  "../migrations/20260807214017_bootstrap-core-fit-score.sql",
  import.meta.url,
);
const ownershipMigrationUrl = new URL(
  "../migrations/20260808003719_derive-requirement-status.sql",
  import.meta.url,
);
const hardenedRlsMigrationUrl = new URL(
  "../migrations/20260808004816_harden-derived-status-rls.sql",
  import.meta.url,
);

test("evidence model persists the PRD fields and supported evidence types", async () => {
  const sql = await readFile(bootstrapMigrationUrl, "utf8");

  assert.match(
    sql,
    /CREATE TYPE public\.evidence_type AS ENUM \(\s*'project',\s*'cert',\s*'work',\s*'internship',\s*'github',\s*'portfolio'\s*\)/,
  );
  assert.match(
    sql,
    /CREATE TABLE public\.evidences \([\s\S]*?id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)[\s\S]*?profile_id UUID NOT NULL[\s\S]*?title TEXT NOT NULL[\s\S]*?type public\.evidence_type NOT NULL[\s\S]*?url TEXT[\s\S]*?description TEXT NOT NULL DEFAULT ''[\s\S]*?created_at TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)[\s\S]*?updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)[\s\S]*?\);/,
  );
});

test("evidence model belongs to a profile and supports profile/type lookup", async () => {
  const [bootstrapSql, ownershipSql] = await Promise.all([
    readFile(bootstrapMigrationUrl, "utf8"),
    readFile(ownershipMigrationUrl, "utf8"),
  ]);

  assert.match(
    ownershipSql,
    /ALTER TABLE public\.evidences\s+ADD CONSTRAINT evidences_profile_id_profiles_id_fk\s+FOREIGN KEY \(profile_id\)\s+REFERENCES public\.profiles\(id\)\s+ON DELETE CASCADE/,
  );
  assert.match(
    bootstrapSql,
    /CREATE INDEX evidences_profile_id_idx\s+ON public\.evidences \(profile_id\)/,
  );
  assert.match(
    bootstrapSql,
    /CREATE INDEX evidences_profile_type_idx\s+ON public\.evidences \(profile_id, type\)/,
  );
  assert.match(
    bootstrapSql,
    /CREATE TRIGGER evidences_updated_at\s+BEFORE UPDATE ON public\.evidences\s+FOR EACH ROW\s+EXECUTE FUNCTION system\.update_updated_at\(\)/,
  );
});

test("evidence access is restricted to the authenticated profile owner", async () => {
  const [ownershipSql, hardenedRlsSql] = await Promise.all([
    readFile(ownershipMigrationUrl, "utf8"),
    readFile(hardenedRlsMigrationUrl, "utf8"),
  ]);

  assert.match(ownershipSql, /REVOKE ALL ON public\.evidences FROM anon, authenticated/);
  assert.match(ownershipSql, /GRANT SELECT, DELETE ON public\.evidences TO authenticated/);
  assert.match(
    ownershipSql,
    /GRANT INSERT \(profile_id, title, type, url, description\)\s+ON public\.evidences TO authenticated/,
  );
  assert.match(
    ownershipSql,
    /GRANT UPDATE \(title, type, url, description\)\s+ON public\.evidences TO authenticated/,
  );

  for (const operation of ["select", "insert", "update", "delete"]) {
    assert.match(
      hardenedRlsSql,
      new RegExp(`CREATE POLICY evidences_${operation}_own\\s+ON public\\.evidences`),
    );
  }

  assert.match(
    hardenedRlsSql,
    /FROM public\.profiles AS profile\s+WHERE profile\.id = evidences\.profile_id\s+AND profile\.user_id = \(SELECT auth\.uid\(\)\)/,
  );
});
