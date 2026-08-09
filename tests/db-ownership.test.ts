import assert from "node:assert/strict";
import test from "node:test";
import { OWNERSHIP_GUARD_SQL } from "../scripts/db-ownership.mjs";

test("ownership guard requires the InsForge migration role", () => {
  assert.match(OWNERSHIP_GUARD_SQL, /current_user = 'project_admin'/);
});

test("ownership guard covers public application tables and enums", () => {
  assert.match(OWNERSHIP_GUARD_SQL, /FROM pg_catalog\.pg_tables/);
  assert.match(OWNERSHIP_GUARD_SQL, /schemaname = 'public'/);
  assert.match(OWNERSHIP_GUARD_SQL, /FROM pg_catalog\.pg_type AS t/);
  assert.match(OWNERSHIP_GUARD_SQL, /t\.typtype = 'e'/);
});

test("ownership guard fails through a runtime-only mismatch branch", () => {
  assert.match(OWNERSHIP_GUARD_SQL, /ownership_mismatch_/);
  assert.match(OWNERSHIP_GUARD_SQL, /::INTEGER/);
});

test("ownership guard is read-only and does not touch access control", () => {
  assert.doesNotMatch(
    OWNERSHIP_GUARD_SQL,
    /ALTER\s|INSERT\s|UPDATE\s|DELETE\s|GRANT\s|REVOKE\s|POLICY/i,
  );
});
