import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const migrationsDirectory = new URL("../migrations/", import.meta.url);
const careerSchemaMigration = new URL(
  "../migrations/20260808003719_derive-requirement-status.sql",
  import.meta.url,
);

test("InsForge Auth remains the only source of truth for user identity", async () => {
  const migrationNames = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"));
  const migrationSql = await Promise.all(
    migrationNames.map((name) => readFile(new URL(name, migrationsDirectory), "utf8")),
  );

  assert.doesNotMatch(
    migrationSql.join("\n"),
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.users\b/i,
  );
});

test("career profile stores only app data linked to the authenticated identity", async () => {
  const sql = await readFile(careerSchemaMigration, "utf8");

  assert.match(
    sql,
    /CREATE TABLE public\.profiles \([\s\S]*?user_id UUID NOT NULL DEFAULT auth\.uid\(\)\s+REFERENCES auth\.users\(id\) ON DELETE CASCADE/,
  );
  assert.doesNotMatch(
    sql,
    /CREATE TABLE public\.profiles \([\s\S]*?(?:password|password_hash|email)\b/i,
  );
});

test("profile ownership continues to be enforced through authenticated RLS", async () => {
  const sql = await readFile(careerSchemaMigration, "utf8");

  assert.match(sql, /ALTER TABLE public\.profiles ENABLE ROW LEVEL SECURITY/);
  assert.match(
    sql,
    /CREATE POLICY profiles_insert_own[\s\S]*?FOR INSERT TO authenticated[\s\S]*?WITH CHECK \(user_id = \(SELECT auth\.uid\(\)\)\)/,
  );
  assert.match(
    sql,
    /CREATE POLICY profiles_update_own[\s\S]*?USING \(user_id = \(SELECT auth\.uid\(\)\)\)[\s\S]*?WITH CHECK \(user_id = \(SELECT auth\.uid\(\)\)\)/,
  );
});
