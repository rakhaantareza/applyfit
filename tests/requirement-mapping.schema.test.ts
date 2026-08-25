import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const modelMigrationUrl = new URL(
  "../migrations/20260808003719_derive-requirement-status.sql",
  import.meta.url,
);
const rlsMigrationUrl = new URL(
  "../migrations/20260808004816_harden-derived-status-rls.sql",
  import.meta.url,
);
const withoutEvidenceMigrationUrl = new URL(
  "../migrations/20260809180000_mark-requirement-without-evidence.sql",
  import.meta.url,
);
const prdAlignmentMigrationUrl = new URL(
  "../migrations/20260809180001_align-requirement-mappings-with-prd.sql",
  import.meta.url,
);
const persistedReviewMigrationUrl = new URL(
  "../migrations/20260825010000_persist-requirement-without-evidence.sql",
  import.meta.url,
);

test("mapping model persists a non-null Requirement to Skill to Evidence chain", async () => {
  const [sql, alignmentSql] = await Promise.all([
    readFile(modelMigrationUrl, "utf8"),
    readFile(prdAlignmentMigrationUrl, "utf8"),
  ]);

  assert.match(
    sql,
    /CREATE TABLE public\.skill_evidences \([\s\S]*?skill_id UUID NOT NULL\s+REFERENCES public\.skills\(id\) ON DELETE CASCADE[\s\S]*?evidence_id UUID NOT NULL\s+REFERENCES public\.evidences\(id\) ON DELETE CASCADE[\s\S]*?PRIMARY KEY \(skill_id, evidence_id\)[\s\S]*?\);/,
  );
  assert.match(
    sql,
    /CREATE TABLE public\.requirement_mappings \([\s\S]*?requirement_id UUID NOT NULL\s+REFERENCES public\.job_requirements\(id\) ON DELETE CASCADE[\s\S]*?skill_id UUID\s+REFERENCES public\.skills\(id\) ON DELETE SET NULL[\s\S]*?user_id UUID NOT NULL DEFAULT auth\.uid\(\)\s+REFERENCES auth\.users\(id\) ON DELETE CASCADE[\s\S]*?\);/,
  );
  assert.doesNotMatch(
    sql,
    /CREATE TABLE public\.requirement_mappings \([\s\S]*?evidence_id UUID[\s\S]*?\);/,
  );
  assert.match(alignmentSql, /ALTER COLUMN skill_id SET NOT NULL/);
  assert.match(
    alignmentSql,
    /FOREIGN KEY \(skill_id\)[\s\S]*?REFERENCES public\.skills\(id\)[\s\S]*?ON DELETE CASCADE/,
  );
});

test("mapping uniqueness and lookup indexes prevent duplicate links", async () => {
  const [sql, alignmentSql] = await Promise.all([
    readFile(modelMigrationUrl, "utf8"),
    readFile(prdAlignmentMigrationUrl, "utf8"),
  ]);

  assert.match(sql, /CREATE INDEX requirement_mappings_requirement_id_idx/);
  assert.match(sql, /CREATE INDEX requirement_mappings_skill_id_idx/);
  assert.match(sql, /CREATE UNIQUE INDEX requirement_mappings_requirement_skill_user_idx/);
  assert.match(alignmentSql, /DROP INDEX IF EXISTS public\.requirement_mappings_unmapped_user_idx/);
  assert.match(
    alignmentSql,
    /CREATE UNIQUE INDEX requirement_mappings_requirement_skill_user_idx\s+ON public\.requirement_mappings \(requirement_id, skill_id, user_id\);/,
  );
  assert.match(sql, /CREATE INDEX skill_evidences_evidence_id_idx/);
});

test("mapping tables use owner-scoped RLS across the complete relationship", async () => {
  const modelSql = await readFile(modelMigrationUrl, "utf8");
  const rlsSql = await readFile(rlsMigrationUrl, "utf8");

  assert.match(modelSql, /ALTER TABLE public\.skill_evidences ENABLE ROW LEVEL SECURITY/);
  assert.match(modelSql, /ALTER TABLE public\.requirement_mappings ENABLE ROW LEVEL SECURITY/);
  assert.match(rlsSql, /job\.user_id = \(SELECT auth\.uid\(\)\)/);
  assert.match(rlsSql, /profile\.user_id = \(SELECT auth\.uid\(\)\)/);
  for (const operation of ["select", "insert", "update", "delete"]) {
    assert.match(
      rlsSql,
      new RegExp(`CREATE POLICY requirement_mappings_${operation}_own\\s+ON public\\.requirement_mappings`),
    );
  }
});

test("latest alignment removes the obsolete null-skill marker model", async () => {
  const [historicalSql, alignmentSql] = await Promise.all([
    readFile(withoutEvidenceMigrationUrl, "utf8"),
    readFile(prdAlignmentMigrationUrl, "utf8"),
  ]);

  assert.match(historicalSql, /CREATE OR REPLACE FUNCTION public\.mark_requirement_without_evidence/);
  assert.match(
    historicalSql,
    /INSERT INTO public\.requirement_mappings \(requirement_id, skill_id\)\s+VALUES \(target_requirement_id, NULL\)/,
  );
  assert.match(alignmentSql, /DELETE FROM public\.requirement_mappings\s+WHERE skill_id IS NULL/);
  assert.match(
    alignmentSql,
    /DROP FUNCTION IF EXISTS public\.mark_requirement_without_evidence\(UUID, UUID\)/,
  );
  assert.doesNotMatch(alignmentSql, /VALUES \([^)]*, NULL\)/);
});

test("without-evidence review is persisted separately from skill mappings", async () => {
  const sql = await readFile(persistedReviewMigrationUrl, "utf8");

  assert.match(
    sql,
    /ADD COLUMN reviewed_without_evidence BOOLEAN NOT NULL DEFAULT FALSE/,
  );
  assert.match(
    sql,
    /CREATE FUNCTION public\.set_requirement_without_evidence\([\s\S]*?reviewed_without_evidence_value BOOLEAN[\s\S]*?DELETE FROM public\.requirement_mappings[\s\S]*?SET reviewed_without_evidence = reviewed_without_evidence_value/,
  );
  assert.match(
    sql,
    /CREATE TRIGGER requirement_mappings_clear_reviewed_without_evidence[\s\S]*?BEFORE INSERT ON public\.requirement_mappings/,
  );
  assert.doesNotMatch(sql, /INSERT INTO public\.requirement_mappings[\s\S]*?NULL/);
});
