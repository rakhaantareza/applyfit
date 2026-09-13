# ApplyFit

**Understand your fit before you apply.**

ApplyFit is an evidence-based career-readiness app for fresh graduates, early-career jobseekers, and career switchers. It turns a job description into reviewable requirements, connects them with the user's skills and portfolio or experience, then presents an explainable Fit Score.

ApplyFit helps users see what is already supported and what is still missing. It does not decide whether they should apply.

## How it works

**Job Requirement -> Skill -> Portfolio & Experience -> Fit Analysis**

1. Build a reusable career profile with target roles and skills.
2. Add projects, work experience, certificates, GitHub, or other supporting evidence.
3. Save a job and extract its requirements with AI assistance.
4. Review the requirements and resolve any ambiguous skill connections.
5. Explore a deterministic Fit Score with requirement-level explanations and visible gaps.

## Highlights

- AI-assisted requirement extraction with user review before analysis.
- Safe, obvious skill matches are connected automatically; manual linking remains available for unresolved cases.
- Portfolio and experience connected to a skill can be reused across multiple jobs.
- Explainable readiness states and deterministic scoring instead of an opaque recommendation.
- Focused job workspace: **Detail -> Persyaratan -> Cocokkan Profil -> Analisis**.
- Responsive Indonesian and English interface for desktop, tablet, and mobile.
- Secure authentication, email verification, password recovery, and account settings.

## Interface

The current interface is designed as a calm working space: warm-paper surfaces, cobalt accents, restrained typography, and fewer dashboard-style elements. Global career information stays separate from the focused workflow for each saved job.

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vinext, Vite, custom CSS |
| Backend | Server-side route handlers and domain services |
| Authentication & database | InsForge Auth and PostgreSQL |
| AI extraction | OpenRouter through an OpenAI-compatible client |
| Quality | ESLint, TypeScript, Node.js tests, Playwright UI checks |

## Local development

### Requirements

- Node.js `>=22.13.0`
- npm
- Access to the required InsForge and AI services

### Setup

```bash
git clone https://github.com/rakhaantareza/applyfit.git
cd applyfit
npm install
npm run dev
```

Configure the required credentials in `.env.local`. Never commit credentials or local environment values.

### Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

For responsive visual checks, see the commands and viewport coverage in [docs/visual-system.md](docs/visual-system.md).

## Documentation

- [Product specification](docs/product-spec.md) - approved behavior, navigation, and terminology.
- [Visual system](docs/visual-system.md) - current interface, responsive rules, and UI checks.
- [Release notes](docs/releases.md) - version and deployment history.
- [Roadmap](docs/roadmap.md) - possible future enhancements, not current scope.
- [Repository conventions](AGENTS.md) - contribution and validation rules.

## Release

Current release: `v1.1.0`. Versioning follows semantic versioning; product phases are documented separately from release numbers.

## Usage notice

Copyright (c) 2026 Rakha Antareza. All rights reserved.

This source code is publicly available for portfolio and evaluation purposes only. No permission is granted to copy, modify, distribute, sublicense, or use this project commercially without explicit permission from the copyright holder.
