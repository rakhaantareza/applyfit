# ApplyFit database migrations

ApplyFit keeps one hosted migration history under `migrations/` and applies it
with the InsForge CLI. Application-owned objects in `public` must be owned by
`project_admin`, which is the role used by InsForge migrations.

Use:

```text
npm run db:migrate
```

This command checks ownership before and after `db migrations up --all`. It
stops if an application table or enum in `public` is owned by another role.
Other PostgreSQL extension objects keep their platform owner.

Rules for future migrations:

- Create migration files with `npx -y @insforge/cli db migrations new <name>`.
- Apply them through `npm run db:migrate`; do not run schema DDL through an
  owner-level connection.
- Keep `migrations/` limited to valid migration `.sql` files; project guidance
  belongs under `docs/`.
- Do not add `SET ROLE`, `RESET ROLE`, or ownership escalation to migration SQL.
- Ownership repair is administrative metadata work. It must not change RLS,
  grants, policies, application columns, or data.
- Treat applied migration files as immutable history.
