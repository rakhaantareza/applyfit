# ApplyFit

ApplyFit is an evidence-based career-readiness web application that helps job seekers understand how well their current skills and proof of work align with a specific role before they apply.

Instead of producing an opaque recommendation, ApplyFit turns a job description into reviewable requirements, connects those requirements to the user's skills and evidence, and calculates a transparent Fit Score. The score describes the current state of readiness; the decision to apply always remains with the user.

![ApplyFit core flow: Job Requirement to Skills to Evidence to Fit Score](docs/assets/applyfit-core-flow.png)

**Current release:** `v1.0.0` — **ApplyFit Phase 1 Core MVP**

## Core workflow

1. **Job Posting** — Save a role with its company, source, location, work arrangement, and full job description.
2. **Requirement Extraction** — Use AI to turn the description into structured requirement drafts.
3. **Requirement Review** — Review, edit, add, remove, merge, or split requirements before they affect the analysis.
4. **Skill & Evidence Mapping** — Match reviewed requirements to profile skills and the evidence linked to those skills.
5. **Explainable Fit Score** — Calculate a deterministic score with a requirement-by-requirement breakdown and clearly identified exclusions.

## Phase 1 Core MVP

- InsForge email/password authentication with registration, email verification, session refresh, sign-out, and password recovery.
- Account settings and a separate career profile for target role, career field, skills, skill status, and level.
- Evidence Library CRUD for projects, certifications, work, internships, GitHub, and portfolio evidence.
- Explicit Skill ↔ Evidence links so readiness is grounded in proof rather than self-reported claims alone.
- Saved Job CRUD with job context and a dedicated job-detail workflow.
- AI-assisted requirement extraction into structured `skill`, `tool`, `education`, and `experience` drafts.
- User-controlled requirement review, including editing, merging, splitting, and final review persistence.
- Exact-name automatic matching plus manual Requirement ↔ Skill mapping.
- Runtime-derived `Proven`, `Partial`, `Learning`, and `Missing` requirement states.
- Explainable Fit Score summaries, detailed requirement contributions, excluded-requirement visibility, and a transparent calculation example.
- Adaptive home onboarding, recent analysis states, responsive application navigation, and account-aware protected routes.

## Product principles

- **Evidence over claims.** A skill becomes `Proven` only when an active mapped skill has linked evidence.
- **Explainability over magic scores.** Every included requirement has a visible weight, readiness multiplier, and point contribution.
- **AI assists extraction; it does not own the score.** AI creates reviewable requirement drafts. Users confirm the data, and deterministic application code performs the calculation.
- **Users make the application decision.** ApplyFit explains readiness and gaps without telling users whether they should or should not apply.
- **Job-specific context matters.** A Fit Score describes readiness for one saved role, not a universal rating of the user.

## Deterministic Fit Score

Only `skill` and `tool` requirements contribute to the Core MVP score. `education` and `experience` requirements remain visible for context but are excluded from the calculation.

### Priority weights

| Priority | Weight |
| --- | ---: |
| Required | 3 |
| Preferred | 1 |

### Derived readiness multipliers

| Status | Runtime condition | Multiplier |
| --- | --- | ---: |
| Proven | Active mapped skill with at least one linked evidence item | 100% |
| Partial | Active mapped skill without linked evidence | 50% |
| Learning | Mapped skill is still marked as learning | 20% |
| Missing | No valid mapped skill | 0% |

For each included requirement:

```text
earned points = priority weight × status multiplier
Fit Score = total earned points ÷ total available points × 100
```

The final percentage is rounded to one decimal place. Requirement status is derived at runtime from mappings, skill state, and evidence links; it is not stored on `job_requirements`.

## Architecture

ApplyFit uses a server-backed React architecture with a single PostgreSQL data path:

```text
React UI
  → Vinext App Router pages and route handlers
    → domain-focused HTTP handlers and services
      → InsForge Auth + InsForge PostgreSQL

Job description
  → OpenRouter extraction service
    → user-reviewed requirement drafts
      → deterministic Fit Score service
```

- **UI and routes:** React Server Components and client components organized under `app/`.
- **API layer:** Route handlers under `app/api/` delegate validation and business operations to `server/http/` and `server/services/`.
- **Authentication:** InsForge Auth is the identity source of truth. The InsForge SSR SDK manages browser/server clients, secure session cookies, refresh, and protected-route middleware.
- **Database:** InsForge PostgreSQL stores profiles, skills, evidence, saved jobs, reviewed requirements, and mappings. Owner-scoped Row Level Security uses the authenticated InsForge identity.
- **AI extraction:** The OpenAI-compatible client calls OpenRouter with a strict structured schema and temperature `0`. Extracted data remains a draft until reviewed by the user.
- **Scoring:** `server/services/fit-score.ts` contains the pure deterministic status derivation and scoring rules.
- **Migrations:** Versioned PostgreSQL migrations live in `migrations/`; the project migration wrapper verifies the `project_admin` ownership invariant before and after applying changes.

## Technology stack

| Area | Technology |
| --- | --- |
| Language | TypeScript |
| UI | React 19, React Server Components, custom CSS, Plus Jakarta Sans, Lucide icons |
| Application framework | Vinext with a Next.js-compatible App Router on Vite 8 |
| Runtime/build target | Cloudflare Worker-compatible ESM output |
| Authentication | InsForge Auth through `@insforge/sdk` SSR clients |
| Database | InsForge PostgreSQL with migrations, foreign keys, indexes, and RLS |
| AI extraction | OpenRouter through the OpenAI-compatible SDK |
| Quality | ESLint and the Node.js test runner |

## Local setup

### Requirements

- Node.js `>=22.13.0`
- npm
- An InsForge project for authentication and PostgreSQL
- An OpenRouter API key when testing AI requirement extraction

### Install

```bash
git clone https://github.com/rakhaantareza/applyfit.git
cd applyfit
npm install
```

Create an ignored `.env.local` and configure these variables with values from your own services:

- `NEXT_PUBLIC_INSFORGE_URL` — InsForge project API URL.
- `NEXT_PUBLIC_INSFORGE_ANON_KEY` — public anonymous key used by the InsForge SSR client.
- `OPENROUTER_API_KEY` — server-side key for requirement extraction.
- `OPENROUTER_CHAT_MODEL` — optional model override; the application has a default model.

Never commit local environment files or credentials.

### Development

```bash
npm run dev
```

### Lint and test

```bash
npm run lint
node --test "tests/*.test.ts"
npm test
```

The TypeScript test suite covers services, route contracts, authentication, schema invariants, RLS expectations, requirement mapping, and scoring rules. `npm test` also creates a production build and runs rendered HTML and routing checks.

### Production build

```bash
npm run build
npm start
```

### Database migrations

Link the repository to the intended InsForge project with the InsForge CLI before running database commands.

```bash
# List migration state
npm run db:migrations:list

# Verify that application-owned tables and enums use project_admin
npm run db:ownership:check

# Apply all pending migrations with ownership checks
npm run db:migrate

# Create a new migration
npx -y @insforge/cli db migrations new <migration_name>
```

Applied migrations are immutable history. See [`docs/DATABASE_MIGRATIONS.md`](docs/DATABASE_MIGRATIONS.md) for ownership and migration rules.

## Project structure

```text
app/                  Pages, UI components, route handlers, and InsForge clients
server/http/          HTTP validation and response adapters
server/services/      Persistence services, extraction, mapping, and Fit Score rules
migrations/           Versioned InsForge PostgreSQL migrations
scripts/              Migration ownership checks
tests/                Unit, API-contract, schema, and rendered-output tests
docs/assets/          Documentation visuals
```

## Future improvements

- Career role, industry, and skill autocomplete.
- A shared skill taxonomy with canonical skill normalization.
- Improved multilingual job requirement extraction.
- A tighter Skill ↔ Evidence workflow.
- Smarter structured job input.
- A consistent design system across forms, dropdowns, selectors, and UI states.
- Job posting import from a URL.

## Release

`v1.0.0` marks **ApplyFit Phase 1 — Core MVP**, the first stable portfolio release. Product phase names describe roadmap milestones and do not determine future semantic version numbers.
