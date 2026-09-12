# ApplyFit releases and deployment

## v1.1.0 — 2026-09-12

Backward-compatible improvements since v1.0.0:

- Responsive warm-paper and cobalt visual system with DM Sans, desktop top navigation, tablet rail, and mobile navigation.
- Consistent readiness checkpoints and contextual empty states for Skill, Portfolio, and Lowongan, with one relevant primary action.
- Shared button interactions, readable deletion confirmations, compact requirement review, and refined account identity forms.
- Canonical career catalog, reusable skill support, and review-first matching improvements.
- Current product and design guidance consolidated; the v1.0 PRD remains historical context only.

Fit Score remains deterministic and explainable. This release does not require a database migration as part of the UI deployment.

## Deployment procedure

Production uses the existing InsForge project ApplyFit, which deploys the frontend through Vercel:
[ApplyFit](https://gyj29qyz.insforge.site).
The Sites configuration is retained for the repository's alternate local build adapter; it is not the production deployment target for this release.

1. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run format:ui:check`. The test command includes a production build.
2. Run the relevant browser checks documented in [visual-system.md](visual-system.md), including readiness and deletion states when affected.
3. Commit reviewed changes and push the working branch without rewriting history.
4. From the repository root, run `npx -y @insforge/cli deployments deploy .`. Keep existing hosted environment variables; never upload local credentials or browser authentication state. The CLI reads `.vercelignore` in addition to its built-in exclusions.
5. Check `npx -y @insforge/cli deployments status <deployment-id>` and verify production routes after the deployment is READY.
6. Create an annotated semver tag on the deployed commit and push that tag. Do not move an existing release tag.

Record the final deployment ID and commit in the annotated tag/release report. Deployment status alone does not verify page behavior.

## v1.0.0

ApplyFit Phase 1 — Core MVP. Historical baseline: commit `30940d6`. See [the archived PRD](prd-v1.0.md). Historical tags and commits are preserved.
