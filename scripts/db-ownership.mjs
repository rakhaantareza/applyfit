import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const OWNERSHIP_GUARD_SQL = `
SELECT
  CASE
    WHEN current_user = 'project_admin'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
          AND tableowner != 'project_admin'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_type AS t
        JOIN pg_catalog.pg_namespace AS n
          ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
          AND t.typtype = 'e'
          AND pg_get_userbyid(t.typowner) != 'project_admin'
      )
    THEN 1
    ELSE ('ownership_mismatch_' || current_user)::INTEGER
  END AS ownership_ok;
`.trim();

function insForgeInvocation(args) {
  return {
    command: "npx",
    args: ["-y", "@insforge/cli", ...args],
    env: process.env,
  };
}

function runInsForge(args, { capture = false } = {}) {
  const invocation = insForgeInvocation(args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: invocation.env,
    shell: false,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (capture && result.stderr) process.stderr.write(result.stderr);
    throw new Error(`InsForge CLI exited with status ${result.status}.`);
  }

  return undefined;
}

export function checkDatabaseOwnership() {
  if (process.platform === "win32") {
    runWindowsOwnershipCommand("check");
    return;
  }

  runInsForge(["db", "query", OWNERSHIP_GUARD_SQL, "--json"]);
  console.log("✓ Database application tables and enums are owned by project_admin.");
}

function migrate() {
  if (process.platform === "win32") {
    runWindowsOwnershipCommand("migrate");
    return;
  }

  checkDatabaseOwnership();
  runInsForge(["db", "migrations", "up", "--all"]);
  checkDatabaseOwnership();
}

function runWindowsOwnershipCommand(command) {
  const result = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      fileURLToPath(new URL("./db-ownership.ps1", import.meta.url)),
      "-Mode",
      command,
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        APPLYFIT_OWNERSHIP_GUARD_SQL: OWNERSHIP_GUARD_SQL,
      },
      stdio: "inherit",
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Database ownership ${command} failed.`);
  }
}

function main() {
  const command = process.argv[2];
  if (command === "check") {
    checkDatabaseOwnership();
    return;
  }
  if (command === "migrate") {
    migrate();
    return;
  }

  throw new Error("Usage: node scripts/db-ownership.mjs <check|migrate>");
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
