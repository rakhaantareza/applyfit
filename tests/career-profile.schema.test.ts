import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseMigrationUrl = new URL(
  "../migrations/20260808003719_derive-requirement-status.sql",
  import.meta.url,
);
const profileMigrationUrl = new URL(
  "../migrations/20260809084033_complete-career-profile-model.sql",
  import.meta.url,
);

test("career profile model keeps profiles and skills as separate related tables", async () => {
  const sql = await readFile(baseMigrationUrl, "utf8");

  assert.match(sql, /CREATE TABLE public\.profiles/);
  assert.match(sql, /user_id UUID NOT NULL DEFAULT auth\.uid\(\)/);
  assert.match(sql, /target_role TEXT NOT NULL/);
  assert.match(sql, /CREATE TABLE public\.skills/);
  assert.match(
    sql,
    /profile_id UUID NOT NULL\s+REFERENCES public\.profiles\(id\) ON DELETE CASCADE/,
  );
  assert.match(sql, /status public\.skill_status NOT NULL DEFAULT 'active'/);
  assert.match(sql, /level TEXT/);
});

test("career profile migration persists career field with authenticated write access", async () => {
  const sql = await readFile(profileMigrationUrl, "utf8");

  assert.match(
    sql,
    /ALTER TABLE public\.profiles\s+ADD COLUMN career_field TEXT NOT NULL DEFAULT ''/,
  );
  assert.match(
    sql,
    /GRANT INSERT \(career_field\)\s+ON public\.profiles TO authenticated/,
  );
  assert.match(
    sql,
    /GRANT UPDATE \(career_field\)\s+ON public\.profiles TO authenticated/,
  );
});
