# ApplyFit Product Specification

**Status:** Active  
**Role:** Primary source of truth for approved product behavior, UX, information architecture, and user-facing terminology.  
**Historical baseline:** `docs/prd-v1.0.md`  
**Future work:** `docs/roadmap.md`

When this document conflicts with the historical v1.0 PRD, this document takes precedence. Items in the roadmap are not implementation scope unless explicitly requested.

During an active refinement milestone, implementation may temporarily lag behind this specification. For product behavior, UX, IA, and terminology, this document defines the approved target. For technical implementation details such as schema, migrations, API structure, and ownership, the codebase and tests remain authoritative.

---

## 1. Product Summary

ApplyFit is a career-readiness application for fresh graduates, early-career jobseekers, and career switchers who want to understand how well their current profile matches a job before applying.

The product exists to reduce blind applying by making the relationship between a job's requirements, the user's skills, and the user's real supporting experience visible and explainable.

Core model:

**Job Requirement → Skill → Portfolio / Experience → Fit Analysis**

ApplyFit should help users understand their current fit. It must not decide whether they should apply.

### Product principles

- Evidence over claims.
- Explainability over opaque scoring.
- AI assists extraction; it does not decide the Fit Score.
- Scoring remains deterministic.
- Reusable career information should not need to be rebuilt for every job.
- The product should minimize repetitive manual mapping.
- The UI should communicate state and next action without excessive explanation.
- ApplyFit should feel like a focused product, not a CRUD dashboard or HR admin system.

### Experience north star

ApplyFit should feel like a **calm tool/workspace**, not a feature-heavy career dashboard.

The interface should get out of the way of the user's actual task: understanding a job, connecting it to their existing profile, and seeing what is already supported or still missing.

Use these principles when making visual or structural decisions:

- **Calm workspace over dashboard.** Do not fill available space merely because it exists.
- **One primary focus per screen.** The user should immediately understand what they are doing and what comes next.
- **Typography and spacing carry hierarchy.** Do not solve every hierarchy problem with another card, badge, or colored container.
- **Persistent navigation only when useful.** Focused workflows may use a different shell from general app navigation.
- **Fewer surfaces.** Prefer whitespace, dividers, and natural grouping over stacks of rounded cards.
- **Brand through restraint.** Forest green establishes identity; lime is punctuation, not a highlighter applied everywhere.
- **Progressive disclosure.** Show detail when it becomes useful instead of front-loading everything.
- **No decorative productivity metrics.** A metric should exist only if it helps orientation or the next decision.
- **The UI should disappear behind the task.** Users should spend their attention on requirements, skills, portfolio items, and gaps rather than the interface itself.

---

## 2. Target Users

Primary users:

- Fresh graduates.
- Early-career jobseekers.
- Career switchers.

The default product voice should assume users understand common job-search terms but should not require knowledge of recruitment systems, databases, or internal ApplyFit implementation concepts.

---

## 3. Information Architecture and Layout Families

ApplyFit separates reusable career information from job-specific work.

Navigation structure and page shell are related but not identical. Not every screen needs the full application sidebar.

### Layout families

ApplyFit uses three layout families:

#### App shell

Use the global app shell for reusable career areas and top-level navigation:

- Ringkasan
- Profil
- Portfolio & Pengalaman
- Lowongan

The shell uses a slim application top bar, a compact persistent sidebar on desktop, and the existing responsive navigation mechanics at smaller breakpoints.

The top bar is the application-level chrome and contains:

- the ApplyFit mark and wordmark,
- the sidebar collapse or mobile navigation control,
- a compact account/avatar trigger.

The sidebar is primarily navigation, with the compact Fit Score guide as its only explanatory module. This shell should feel like a quiet tool frame, not a dashboard frame.

#### Job focus shell

Once the user opens a specific job, the interface enters a focused job workspace.

The job workspace does **not** require the full global sidebar. Prefer a focused shell with:

- an obvious way back to Lowongan,
- the selected role and company as context,
- job-level actions when necessary,
- contextual navigation: Detail → Persyaratan → Cocokkan Profil → Analisis.

The purpose is to give the job workflow more horizontal space and reduce navigation noise while the user is working through one job.

Do not duplicate the same navigation in both a full sidebar and a large job-level navigation treatment unless there is a clear usability reason.

#### Standalone shell

Authentication, password recovery, and similar entry/account-access flows do not use the app dashboard shell.

They should remain focused and self-contained.

Pengaturan may use a simplified account layout or the app shell when useful for orientation, but it must not introduce dashboard widgets or unrelated product status.


### Global navigation

- **Ringkasan**
- **Karier**
  - **Profil**
  - **Portfolio & Pengalaman**
  - **Lowongan**

Account identity and actions live in the top bar account menu, not persistently in the sidebar. The menu provides access to Pengaturan, appearance selection, and Keluar without keeping the email permanently visible in the shell.

`Karier` is a subtle grouping label, not a heavy accordion or enterprise-style navigation tree.

`Lowongan` is visually grouped under `Karier` while remaining a direct navigation item. Do not add a redundant `Semua Lowongan` submenu when there is no second global job destination.

The desktop sidebar should be compact and visually quiet:

- narrow enough to feel like navigation rather than a content column,
- neutral application chrome rather than a large dark-green block,
- no profile-completeness card or dashboard widget inside the sidebar,
- no account profile block, email, or account actions,
- a compact `Cara Fit Score dihitung` guide near the bottom, followed by a quiet Pengaturan utility separated by one subtle divider,
- restrained active state,
- muted default items,
- minimal section styling,
- approximately 13px navigation type with compact 17–18px line icons,
- consistent icon rhythm in expanded and collapsed states,
- Profil, Portfolio & Pengalaman, and Lowongan aligned with the other navigation rows; grouping is communicated by the Karier label rather than indentation,
- no divider or expanded group gap before Lowongan,
- no decorative use of lime across text + icon + indicator simultaneously.

### Job workspace navigation

Once a job is selected, job-specific work is contained inside that job workspace:

**Detail → Persyaratan → Cocokkan Profil → Analisis**

`Analisis` / Fit Score is not a global navigation item.

A job switcher, when present inside the workspace, changes the active job context only. It is not a side-by-side comparison feature. The workspace should make it easy to return to the global Lowongan list.

---

## 4. Core Product Flow

1. User creates or signs in to an account.
2. User defines their career profile and skills.
3. User adds projects, experience, certificates, or other portfolio items and connects them to relevant skills.
4. User saves a job and pastes its job description.
5. ApplyFit extracts structured requirements with AI.
6. User reviews and corrects the extracted requirements.
7. ApplyFit automatically links obvious requirements to existing profile skills where safe.
8. Existing Portfolio & Pengalaman already connected to those skills is reused automatically.
9. User reviews only unresolved or ambiguous requirements and manually connects them when needed.
10. ApplyFit calculates and explains the deterministic Fit Score.

The intended experience is **review-first**, not **manual-mapping-first**.

If a job has 12 scoreable requirements and 10 already match established profile skills, the user should not be required to manually remap those 10 requirements.

---

## 5. Career Foundation

Career information is reusable across jobs.

### Profil

The profile contains:

- Target role.
- Career field / area.
- Skills.
- Skill status such as active or learning when required by product logic.

The profile should represent the user's career model, not their authentication identity.

Account name, avatar, email, and password belong in Pengaturan.

Skill proficiency labels such as beginner/intermediate/advanced should not be visually prominent unless they have a clear product purpose. They must not imply scoring significance if they do not affect Fit Score or requirement matching.

Avoid redundant system labels such as `Profil aktif` or repeating `Skill profil` on every row. Prefer meaningful coverage summaries over database-like counts; for example, communicate how many skills are supported by Portfolio & Pengalaman rather than raw relation counts.

Destructive actions should not be permanently dominant on every skill row. Prefer edit/detail or overflow actions unless immediate deletion is genuinely important.

### Portfolio & Pengalaman

This area stores reusable support for the user's skills, including:

- Projects.
- Work or internship experience.
- Certificates.
- Portfolio or GitHub links when relevant.

One item may support multiple skills. One skill may be supported by multiple items.

The page should feel like a career portfolio, not a database record manager.

Avoid marketing-style hero copy, category-count dashboards, repeated hierarchy labels, internal-note placeholders, and `Diperbarui...` metadata unless freshness is actually useful. On mobile, favor compact items with progressive detail rather than verbose stacked records.

Where it reads naturally, relationship copy may describe what an item **mendukung** instead of exposing a database-style `Skill terkait` relationship.

User-facing copy should avoid terms such as `evidence library`, `pustaka bukti`, `mapping`, or other implementation vocabulary when a natural user-facing term exists.

---

## 6. Lowongan

The Lowongan page represents jobs the user is actively evaluating.

Each job should show enough metadata to identify it, such as:

- Role.
- Company.
- Source.
- Location.
- Work arrangement when available.

Status should describe useful progress or the next action, for example:

- Persyaratan siap diperiksa.
- 2 persyaratan masih perlu kamu cek.
- Analisis selesai · 82%.

Avoid turning the page into a generic saved-jobs dashboard with redundant summary cards. Do not repeat the list with labels such as `Ruang kerja lowongan` or `X lowongan dalam pantauanmu` when the list itself already communicates that information.

---

## 7. Job Workspace

### 7.1 Detail

Purpose: provide the job context and one clear next action.

Show:

- Job metadata.
- Original job description under a simple `Deskripsi lowongan` heading.
- Edit / delete controls where appropriate.
- One state-aware primary action.

Avoid duplicating progress through multiple badges, step cards, counts, and CTAs at the same time. The contextual job header and workspace navigation should carry orientation.

Examples:

- Before extraction: **Ambil persyaratan**.
- After extraction: **Periksa persyaratan**.

Re-extraction is secondary once requirements already exist.

Preferred extraction explanation:

> Ambil persyaratan dari lowongan ini. ApplyFit akan menyusunnya agar kamu bisa periksa sebelum lanjut.

### 7.2 Persyaratan

AI extraction produces a draft. The user must be able to review and correct it before analysis.

Requirements may include:

- Skill.
- Tool.
- Education.
- Experience.
- Other non-scoreable job context where supported by the implementation.

User can:

- Edit requirements.
- Add or remove requirements.
- Mark Required or Preferred.
- Merge or split requirements when needed.

The review screen should be direct and compact. Avoid repeated system labels such as “draft requirement”, “review context”, or internal status badges that do not help the decision.

Preferred heading and explanation:

> **Periksa persyaratan lowongan**  
> Hasil ekstraksi bisa saja meleset. Edit yang perlu sebelum lanjut.

Use one clear progression action such as **Simpan & lanjut** rather than a save action plus a second oversized “continue” card.

Experience, education, and other non-scoreable context may remain visible but must be clearly distinguished from requirements that affect Fit Score. Never expose internal planning labels such as `MVP` in user-facing copy.

A natural explanation is:

> Pengalaman dan pendidikan tetap disimpan sebagai konteks, tapi belum memengaruhi Fit Score.

### 7.3 Cocokkan Profil

This stage connects scoreable job requirements to the user's reusable career foundation.

#### Matching behavior

ApplyFit should automatically connect safe, obvious matches such as:

- Exact normalized skill names.
- Canonical or alias matches only when deterministic and unambiguous.

When a requirement is linked to a skill, existing Portfolio & Pengalaman already linked to that skill is reusable automatically across jobs.

The user should primarily review unresolved cases.

Recommended structure:

- **Perlu kamu cek** — unresolved or ambiguous requirements shown prominently.
- **Sudah cocok** — resolved requirements shown compactly and optionally collapsed.

For unresolved items, use natural copy such as:

> Belum menemukan skill yang cocok.

Primary action:

> Hubungkan skill

Do not expose implementation labels such as:

- exact match
- manual mapping
- automatic mapping
- requirement mapping
- evidence mapping

Manual connection remains a fallback when automatic linking cannot safely resolve a requirement.

Do not add a redundant standalone “review mapping results” step after the user has resolved the necessary items. When the state is valid, the progression action can go directly to **Lihat analisis**.

### 7.4 Analisis

Fit Analysis explains the user's fit with the selected job.

The Fit Score should remain the primary visual focus, but the page should lead with useful exceptions rather than forcing users through exhaustive proof.

Example summary:

> 10 dari 12 persyaratan sudah terbukti. Dua lainnya belum punya skill yang cocok di profil kamu.

The analysis should provide:

- Overall Fit Score.
- A concrete one-sentence summary of the result.
- Clear but compact status counts.
- Missing / unresolved requirements first.
- An actionable `Perlu perhatian` area that can take the user back to unresolved profile connections.
- Compact requirement rows.
- Expandable details for linked skills, Portfolio & Pengalaman, and score contribution.
- One quiet link to the centralized `Cara Fit Score dihitung` explainer.

Avoid repeating formula math on every collapsed requirement row. If the hero already summarizes the statuses, do not add another large summary card that says the same thing.

A job selector on this page is a workspace switcher, not a “score comparison” control.

`Cara Fit Score dihitung` is preferred over technical labels such as `Transparansi Skor`. Do not repeat the formula in an expandable block at the bottom of Analisis when the centralized explainer is available.

On mobile, lead with exceptions and next actions before exhaustive proof.

ApplyFit must not recommend whether the user should or should not apply.

---

## 8. Requirement Status and Fit Score

Requirement statuses are derived from the relationship between a verified requirement, a profile skill, and reusable supporting Portfolio & Pengalaman.

### Status semantics

- **Proven** — mapped to an active profile skill with at least one linked supporting item.
- **Partial** — mapped to an active profile skill with no linked supporting item.
- **Learning** — mapped to a profile skill marked as learning.
- **Missing** — no skill mapping exists for the requirement.

A requirement cannot become Partial without first being connected to a skill.

### Score scope

Only scoreable skill/tool requirements contribute to Fit Score.

Education, experience, location, and other informational context do not affect the score unless explicitly changed by a later approved product decision.

### Baseline scoring

Current deterministic baseline:

- Required weight: 3.
- Preferred weight: 1.
- Proven multiplier: 1.0.
- Partial multiplier: 0.5.
- Learning multiplier: 0.2.
- Missing multiplier: 0.

Formula:

`Fit Score = current weighted points / maximum weighted points × 100`

AI must not determine this score.

### Fit Score explainer

The existing `/contoh-perhitungan` destination is the single `Cara Fit Score dihitung` explainer. It contains:

- Proven, Partial, Learning, and Missing semantics and multipliers.
- Wajib and Preferensi weighting.
- The deterministic Fit Score formula and score scope.
- The concrete worked example under a `Contoh perhitungan` section.

The expanded global sidebar may show a compact educational guide linking to this page above Pengaturan. The collapsed rail shows only one Fit Score/help utility icon. This module is explanatory navigation, not a completeness widget, promotional card, or product metric.

### Requirement classification semantics

Classification should follow the meaning of the requirement, not a shallow keyword rule.

Examples:

- `Experience with React` is a React skill requirement and is scoreable.
- `Knowledge of PostgreSQL` is a skill/tool requirement and is scoreable.
- `Familiar with Docker` is a skill/tool requirement and is scoreable.
- `3+ years of professional experience` is an Experience requirement and is not scoreable under the current Fit Score scope.

Quantified tenure, general professional experience, and education remain contextual rather than being forced into skill/tool scoring.

---

## 9. Ringkasan

Ringkasan is a **calm continuation surface**, not a dashboard full of widgets.

Its main job is to answer:

- What am I currently working on?
- What should I do next?
- Is there one important career-profile gap I need to know about?

The default screen should remain intentionally sparse.

Preferred structure:

1. A small greeting/orientation.
2. **Current work + next action** as the primary focal area.
3. A compact career-foundation summary when useful.
4. Latest analysis context only when it helps the user continue.
5. Lightweight workflow progress only when it improves orientation.

Do not create separate cards for every available count or metric.

Avoid:

- grids of statistic cards,
- generic recommendation feeds,
- decorative trend charts,
- application-count dashboards,
- large “top skills” widgets,
- repeated next-action cards,
- card-based representations of every workflow step.

If workflow progress is shown, prefer a light inline/step treatment rather than four large feature cards.

The workflow area owns the primary next action. Other sections must not repeat the same CTA.

Page state must be internally consistent. For example, do not show a `Simpan lowongan` empty action when the same page already knows the user has an active saved job or mapping progress.

Use a number only when it materially helps orientation or the next decision.

Do not show empty-state copy until relevant data has actually finished resolving.

Avoid system-facing labels such as `Data akun terhubung`.

Whitespace is intentional. Do not add content merely to make Ringkasan feel fuller.

---

## 10. Authentication

Authentication screens should remain visually simple and consistent. Preserve the current split-screen desktop structure and its compact mobile adaptation unless a real usability issue requires redesign; the current refinement is primarily a copy and hierarchy cleanup.

The brand panel should use one consistent proposition across sign-in, registration, and password recovery rather than inventing a different marketing headline for every auth state.

Preferred proposition:

> **Cek kesiapanmu sebelum melamar.**  
> Bandingkan persyaratan lowongan dengan skill dan pengalaman yang sudah kamu punya.

Fit Score principle may be communicated concisely:

> Fit Score membantu kamu melihat gap, bukan menentukan apakah kamu harus melamar.

### Login

Preferred heading:

> Masuk ke ApplyFit

Preferred supporting copy:

> Lanjutkan dari tempat terakhir kamu berhenti.

Primary action:

> Masuk

### Registration

Preferred heading:

> Buat akun ApplyFit

Preferred supporting copy:

> Buat profilmu, tambahkan skill, lalu mulai cek lowongan yang kamu incar.

Avoid pseudo-legal consent checkboxes unless they correspond to real Terms / Privacy requirements.

### Password recovery

Preferred heading:

> Lupa kata sandi?

Preferred explanation:

> Masukkan email akunmu. Kami akan kirim kode untuk membuat kata sandi baru.

Code helper:

> Kami akan kirim kode 6 digit ke email ini.

Primary action:

> Kirim kode

Do not expose authentication vendors such as InsForge Auth in user-facing copy.

---

## 11. Pengaturan

Pengaturan contains account identity and security, separate from Profil Karier. Preserve the current two-part settings structure unless a real usability issue requires redesign; simplify the copy rather than inventing a new settings IA.

Preferred page introduction:

> **Pengaturan akun**  
> Atur nama, foto profil, dan keamanan akunmu.

### Name and profile image

- Name.
- Profile image link or equivalent supported input.

Preferred field label when the current implementation uses a URL:

> Link foto profil

Preferred helper:

> Dipakai di menu akun dan tidak mengubah Profil Karier.

URL helper:

> Pakai link gambar HTTPS, atau kosongkan untuk menggunakan inisial.

Primary action:

> Simpan perubahan

### Login & security

- Email.
- Verification state when useful, for example `Terverifikasi`.
- Password recovery/change flow.

Do not expose vendor or implementation terminology, and do not add meaningless badges such as `Identitas login`.

Preferred password section:

> **Ubah kata sandi**  
> Kami akan kirim kode verifikasi ke email kamu.

Primary action:

> Kirim kode

---

## 12. Loading and Async States

Loading should be invisible when fast and quiet when necessary.

### Initial protected-route bootstrap

- Do not show `Menyiapkan ruang kerjamu...`.
- Keep the page visually neutral and empty while auth/session resolution is pending.
- Do not show an ApplyFit mark, branded copy, animation, full-screen loader, or skeleton solely for session resolution.
- Do not render protected-page empty or error states before the authenticated session has resolved.
- Render the application only after the session resolves; redirect unauthenticated visitors without an intermediate branded screen.

### Internal navigation

- Do not use full-screen loaders during normal authenticated navigation.
- Preserve the application shell where possible.
- Use local placeholders only when genuinely needed.

Loading, empty, and error are distinct states. Never show an empty state before data has finished resolving.

---

## 13. Product Voice and Copy Rules

ApplyFit uses Indonesian as its default product language, with common English product/career terms when they are more natural, such as:

- role
- skill
- Fit Score
- GitHub
- portfolio

Voice should be:

- Natural.
- Light.
- Specific.
- Concise.
- Task-oriented.
- Appropriate for Indonesian fresh grads and young jobseekers.

Avoid:

- Corporate HR-system language.
- Database language.
- Motivational clichés.
- Generic SaaS marketing prose.
- Copy that explains things the UI already makes obvious.
- Internal architecture/vendor terms.
- Forced variation where one consistent sentence would be clearer.

If the interface already communicates the state or action clearly, silence is preferable to decorative helper copy.

Examples to avoid:

- Wujudkan karier impianmu.
- Maksimalkan potensimu.
- Data akun terhubung.
- 24 tautan bukti.
- Identitas login dikelola langsung oleh InsForge Auth.

Prefer user meaning over implementation meaning.

---

## 14. Visual Foundation and Interaction Principles

### Typography

ApplyFit uses **Inter** as the primary UI typeface.

Typography should feel neutral, sharp, and highly readable rather than expressive for its own sake.

Preferred weight range:

- 400 for body and secondary content.
- 500 for controls, navigation, and compact emphasis.
- 600 for primary headings or genuinely important emphasis.

Avoid excessive bold weight, oversized dashboard numbers, all-caps eyebrow labels, and aggressive letter spacing.

Hierarchy should come primarily from size, weight, spacing, and placement.

### Color system

Preserve ApplyFit's identity while reducing visual noise:

- **Neutral light/off-white chrome** — top bar and sidebar in the light theme.
- **Soft off-white** — default light application canvas.
- **White / near-white** — grouped light-theme surfaces only when a distinct surface is actually needed.
- **Neutral near-black / charcoal** — dark-theme chrome, canvas, and surfaces with subtle tonal separation.
- **Muted neutral / gray-green** — secondary text, borders, inactive navigation, and metadata.
- **Forest green** — intentional brand and primary-action moments, not a structural shell background.
- **Lime** — restrained punctuation for a small number of important active states, progress signals, or brand details.

Lime must not simultaneously color the text, icon, indicator, border, and background of the same state.

Color should clarify state, not decorate every component.

### Appearance

ApplyFit provides three appearance preferences:

- **System** — default; follows the operating-system or browser color-scheme preference.
- **Light** — explicitly uses the neutral light foundation.
- **Dark** — explicitly uses the neutral near-black foundation.

An explicit Light or Dark selection is persisted locally. Returning to System removes the explicit override and resumes following the current system preference.

Shared components consume semantic theme concepts such as:

- background,
- chrome,
- surface and subtle surface,
- foreground and muted foreground,
- border,
- primary,
- accent,
- destructive.

The dark theme must remain neutral rather than becoming a green-tinted dashboard. Both themes use flat surfaces, subtle borders, and absent or extremely soft shadows.

### Surfaces, borders, and radius

ApplyFit should use fewer visible containers.

- Prefer spacing or a divider before introducing another card.
- Use subtle neutral borders for structure.
- Shadows should be absent or very soft; do not rely on floating-card shadows as the default hierarchy mechanism.
- Use small-to-moderate corner radii, roughly in the 8–12px range for most product surfaces.
- Avoid giant pill containers except for controls whose interaction genuinely benefits from that shape.
- Avoid nested cards unless the nesting expresses a real relationship.

### Spacing and density

- Default to generous whitespace around the primary task.
- Dense screens should become compact through rows, tables, or progressive disclosure, not through tiny text.
- Forms and reading surfaces should use intentional content widths rather than stretching to fill every available pixel.
- Job workflows may use wider content than profile/settings forms because they contain requirement lists and comparison detail.
- Every global app-shell screen uses the same centered content-container width.
- Every selected-job workspace screen uses the same job-workspace content-container width. The two layout families may use different widths.

### Sidebar

The sidebar should take structural inspiration from quiet professional tools rather than generic SaaS dashboards.

- Compact width and spacing.
- Neutral light or charcoal chrome that follows the active appearance.
- Muted default navigation.
- One restrained tonal active treatment; avoid a large CTA-like pill or lime rail.
- Section labels are subtle, sentence case, and low-emphasis.
- Profil, Portfolio & Pengalaman, and Lowongan use the same row alignment as Ringkasan; do not present the Karier group as a tree.
- Lowongan follows the same compact row rhythm as the other Karier destinations.
- A compact `Cara Fit Score dihitung` guide may sit near the bottom; in the collapsed rail it becomes one Fit Score/help icon.
- Pengaturan remains the only account utility item and uses one subtle divider above it.
- No completeness widgets, promotional cards, or dashboard metrics.
- No account identity, email, appearance controls, or account actions.
- Collapsed rail remains visually coherent with the expanded version.
- Collapsed navigation keeps one consistent icon rhythm and does not reproduce expanded grouping gaps literally.

### Top bar

The global top bar owns brand, the navigation control, and account access. It remains slim, flat, and separated with a subtle bottom border. It must not add notification controls, promotional utilities, streaks, or other unrelated chrome.

On desktop, the ApplyFit mark and wordmark remain visible in both expanded and collapsed sidebar states. The collapse or expand control sits directly after the wordmark with a small gap. Collapsing changes only the sidebar width; it does not collapse or reposition the top-bar brand area.

Global pages do not show breadcrumbs. This applies to Ringkasan, Profil, Portfolio & Pengalaman, and Lowongan. Their existing centered main-content width and page spacing remain unchanged.

The focused job workspace is the only shell that shows a breadcrumb: `← Lowongan / {Role} — {Company}`. It provides a clear return path to Lowongan, no global sidebar, and the approved job navigation directly below it.

The focused breadcrumb, job navigation, and main workspace share one content grid, with restrained vertical spacing between the tabs and feature content.

### Components

- Buttons, inputs, dropdowns, selectors, modals, badges, and status treatments must use consistent hierarchy and interaction patterns across pages.
- Primary buttons should be obvious without dominating an entire screen.
- Secondary actions should remain quiet.
- Inputs should feel like working controls rather than decorative cards.
- Badges are only for useful state.
- Destructive actions should not dominate default views.
- Prefer compact rows and progressive disclosure for dense information.

### General interaction principles

- Prioritize hierarchy over decoration.
- Avoid turning every section into eyebrow + title + subtitle + rounded card.
- Mobile should prioritize exceptions and next actions rather than reproducing all desktop detail vertically.
- Motion should be purposeful and restrained.
- If removing an element leaves context, state, and next action equally clear, remove it.

Responsive navigation mechanics already implemented should be preserved unless a real bug requires change. The visual foundation may refine sizing and styling, but it should not casually regress established breakpoint behavior.

---

## 15. Current Implementation Boundaries

The current product refinement may include:

- Visual foundation reset around the calm-workspace north star.
- Inter typography migration.
- Refined color, spacing, surface, border, radius, and base component tokens.
- Compact global app shell/sidebar refinement.
- Focused job-workspace shell that does not require the full global sidebar.
- Global IA/sidebar restructuring.
- Job workspace contextual navigation.
- Copy simplification.
- Portfolio & Pengalaman terminology and hierarchy improvements.
- Review-first requirement matching.
- Deterministic obvious skill auto-linking.
- Reuse of existing skill-support relationships across jobs.
- Fit Analysis simplification and progressive disclosure.
- Auth and settings copy cleanup.
- Loading-state simplification.
- Ringkasan simplification away from widget-heavy dashboard patterns.
- UI consistency and mobile-density improvements.

The following are not required for the current refinement unless explicitly requested:

- Advanced semantic / transferable-skill matching.
- AI-driven evidence ranking.
- Large curated role/skill taxonomy.
- Advanced role/industry/skill autocomplete.
- Job import from LinkedIn, JobStreet, Glints, or arbitrary URLs.
- Application tracking.
- AI recommendations on whether to apply.
- Google OAuth.

Future candidates belong in `docs/roadmap.md`.

---

## 16. Technical Product Invariants

These are product-level invariants, not a complete technical architecture specification.

- Authentication identity is provided by the platform auth system; do not create a duplicate product-level user identity model without a deliberate architecture decision.
- Fit Score is deterministic and calculated from verified requirements and profile relationships.
- AI extraction output is a draft and remains user-reviewable.
- A Missing requirement has no associated profile skill.
- A mapped active skill with no supporting item is Partial, not Missing.
- Portfolio & Pengalaman linked to a skill is reusable across jobs.
- Historical documentation must not override this specification.

Implementation details such as exact database columns, indexes, migrations, ownership, API paths, and service structure should be derived from the codebase and migrations rather than duplicated here unless they represent a product invariant.

---

## 17. Documentation Priority

Repository documentation should be interpreted in this order:

1. `docs/product-spec.md` — current product source of truth.
2. `docs/prd-v1.0.md` — archived v1.0 Core MVP context.
3. `docs/roadmap.md` — future candidates only.

If these documents conflict, follow `docs/product-spec.md`.

Roadmap items must not be implemented solely because they appear in `docs/roadmap.md`.
