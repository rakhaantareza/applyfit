# ApplyFit repository conventions

## Git, versioning, and releases

- All work through and including commit `30940d6` belongs to **ApplyFit Phase 1 — Core MVP**, regardless of product-phase terminology used in older implementation commit messages.
- Do not rewrite, rename, rebase, or force-push historical commits merely to align their messages with the current product-phase naming.
- Use concise conventional-style prefixes for normal commits from this point forward, such as `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, and `test:`. Do not include product phase numbers in normal commit messages.
- Product phase names and numbers belong only in PRDs, roadmap or milestone documentation, and release notes.
- A product milestone such as **Product Phase 2** does not automatically imply a `v2.0.0` release.
- Follow semantic versioning: patch releases contain fixes, minor releases contain backward-compatible enhancements, and major releases are reserved for meaningful breaking changes.
- Future ApplyFit development must be driven by the current product specification, explicit user direction, and the current codebase; do not revive retired task plans or stale planning artifacts.
- Never rewrite Git history or force-push any branch unless the user gives explicit approval for that specific operation.

## Product documentation and source-of-truth order

Use the repository documentation with this priority:

1. `docs/product-spec.md`
   - Primary source of truth for approved ApplyFit product behavior, UX, information architecture, user flow, and user-facing terminology.
   - During an active refinement milestone, the current implementation may temporarily lag behind this document.

2. `docs/prd-v1.0.md`
   - Archived historical reference for the v1.0.0 Core MVP.
   - Use it for historical context only.
   - Never use it to override current decisions in `docs/product-spec.md`.

3. `docs/roadmap.md`
   - Future ideas and possible enhancements.
   - Roadmap items are not implementation scope unless the user explicitly promotes or requests them.

When product documents conflict, follow `docs/product-spec.md`.

An explicit instruction from the user for the current task takes precedence over repository documentation. If that instruction changes an approved product decision, update `docs/product-spec.md` as part of the same work when appropriate so the repository does not retain stale product guidance.

For technical implementation details such as schema, migrations, API structure, database ownership, or existing runtime behavior, inspect the current codebase and tests. Do not copy stale technical details from historical product documents into implementation.

## ApplyFit product guardrails

Preserve these product invariants unless the user explicitly changes them:

- Core model: **Job Requirement → Skill → Evidence → Fit Analysis**.
- AI may assist requirement extraction, but Fit Score must remain deterministic and explainable.
- ApplyFit helps users understand readiness and gaps; it must not decide whether they should or should not apply for a job.
- Global navigation and job-specific navigation must follow `docs/product-spec.md`.
- User-facing copy should use concise, natural Indonesian for fresh graduates and early-career jobseekers. English product terms such as `role`, `skill`, `Fit Score`, `GitHub`, and `portfolio` are acceptable when they are more natural.
- Avoid generic SaaS/HR-system language, motivational copy, redundant helper text, and database-like labels.
- Do not expose internal implementation or planning terms such as `requirement_mappings`, `exact match`, `manual mapping`, `InsForge Auth`, or `MVP` in user-facing UI when a natural product term exists.
- Prefer removing redundant cards, badges, labels, copy, and motion over adding decoration to solve hierarchy.
- Do not implement items from `docs/roadmap.md` opportunistically.

## Working-tree and validation discipline

- Preserve unrelated user changes already present in the working tree. Do not revert, overwrite, stage, or reformat unrelated files just to complete the current task.
- Keep changes scoped to the requested work; avoid opportunistic refactors unless they are required for correctness.
- Before reporting implementation work complete, run the most relevant available checks for the affected area (for example targeted tests, lint, typecheck, or build) and report any check that could not be run.
- Do not weaken existing tests, RLS policies, ownership checks, or deterministic scoring rules merely to make a change pass.
- Do not commit, push, tag, publish, or deploy unless the user explicitly asks for that operation.

## Matching behavior

The approved product direction is **review-first**, not manual-first.

- Safe, obvious deterministic skill matches should be linked automatically.
- Existing Skill ↔ Portfolio & Pengalaman relationships should be reusable across jobs.
- Users should primarily review unresolved or ambiguous requirements instead of remapping obvious matches for every job.
- Manual linking remains a fallback.
- A requirement with no skill mapping is `Missing`.
- A requirement mapped to an active skill with no linked Portfolio & Pengalaman item is `Partial`.
- Advanced semantic matching, transferable-skill inference, AI-assisted relevance ranking, and similar higher-ambiguity behavior remain roadmap work unless explicitly requested.

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **applyfit** (API base `https://gyj29qyz.ap-southeast.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->

## ApplyFit database ownership invariant

- All application-owned tables and enums in `public` must be owned by
  `project_admin`.
- Create migrations with `npx -y @insforge/cli db migrations new <name>` and
  apply them with `npm run db:migrate`. The wrapper checks ownership before and
  after the official InsForge migration command.
- Keep `migrations/` limited to valid migration `.sql` files; detailed project
  guidance lives in `docs/database-migrations.md`.
- Never add `SET ROLE`, `RESET ROLE`, or owner-level connection workarounds to
  ordinary migration files.
- An ownership repair must not change RLS, grants, policies, application data,
  or schema design.
