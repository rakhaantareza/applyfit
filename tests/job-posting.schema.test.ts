import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const bootstrapMigrationUrl = new URL(
  "../migrations/20260807214017_bootstrap-core-fit-score.sql",
  import.meta.url,
);
const contextMigrationUrl = new URL(
  "../migrations/20260808003719_derive-requirement-status.sql",
  import.meta.url,
);

test("job posting model persists ownership, job context, and raw description", async () => {
  const sql = await readFile(bootstrapMigrationUrl, "utf8");

  assert.match(
    sql,
    /CREATE TABLE public\.job_postings \([\s\S]*?id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)[\s\S]*?user_id UUID NOT NULL DEFAULT auth\.uid\(\)\s+REFERENCES auth\.users\(id\) ON DELETE CASCADE[\s\S]*?title TEXT NOT NULL[\s\S]*?company TEXT NOT NULL[\s\S]*?source TEXT[\s\S]*?source_url TEXT[\s\S]*?raw_description TEXT NOT NULL DEFAULT ''[\s\S]*?created_at TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)[\s\S]*?updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)[\s\S]*?\);/,
  );
});

test("job context migration persists location and work arrangement", async () => {
  const sql = await readFile(contextMigrationUrl, "utf8");

  assert.match(
    sql,
    /ALTER TABLE public\.job_postings\s+ADD COLUMN location TEXT,\s+ADD COLUMN work_arrangement TEXT/,
  );
  assert.match(
    sql,
    /GRANT INSERT \([\s\S]*?location,\s+work_arrangement,[\s\S]*?\) ON public\.job_postings TO authenticated/,
  );
  assert.match(
    sql,
    /GRANT UPDATE \([\s\S]*?location,\s+work_arrangement,[\s\S]*?\) ON public\.job_postings TO authenticated/,
  );
});

test("job postings are indexed and restricted to their authenticated owner", async () => {
  const sql = await readFile(bootstrapMigrationUrl, "utf8");

  assert.match(sql, /CREATE INDEX job_postings_user_id_idx\s+ON public\.job_postings \(user_id\)/);
  assert.match(
    sql,
    /CREATE INDEX job_postings_user_created_at_idx\s+ON public\.job_postings \(user_id, created_at DESC\)/,
  );
  assert.match(sql, /ALTER TABLE public\.job_postings ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /REVOKE ALL ON public\.job_postings FROM anon, authenticated/);

  for (const operation of ["select", "insert", "update", "delete"]) {
    assert.match(
      sql,
      new RegExp(`CREATE POLICY job_postings_${operation}_own\\s+ON public\\.job_postings`),
    );
  }
});
