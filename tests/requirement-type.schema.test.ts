import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../migrations/20260808003719_derive-requirement-status.sql",
  import.meta.url,
);

test("migration removes persisted requirement status", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /ALTER TABLE public\.job_requirements\s+DROP COLUMN status/);
  assert.match(sql, /DROP TYPE public\.requirement_status/);
  assert.doesNotMatch(
    sql,
    /GRANT (?:INSERT|UPDATE) \([^)]*status[^)]*\)\s+ON public\.job_requirements/,
  );
});

test("migration adds the runtime status source relationships", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /CREATE TABLE public\.profiles/);
  assert.match(sql, /CREATE TABLE public\.skills/);
  assert.match(sql, /CREATE TABLE public\.skill_evidences/);
  assert.match(sql, /CREATE TABLE public\.requirement_mappings/);
});

test("migration persists job location and work arrangement", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /ADD COLUMN location TEXT/);
  assert.match(sql, /ADD COLUMN work_arrangement TEXT/);
});
