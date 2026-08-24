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

---

## 2. Target Users

Primary users:

- Fresh graduates.
- Early-career jobseekers.
- Career switchers.

The default product voice should assume users understand common job-search terms but should not require knowledge of recruitment systems, databases, or internal ApplyFit implementation concepts.

---

## 3. Information Architecture

ApplyFit separates reusable career information from job-specific work.

### Global navigation

- **Ringkasan**
- **Karier**
  - **Profil**
  - **Portfolio & Pengalaman**
- **Lowongan**

Account controls remain at the bottom of the navigation and provide access to Pengaturan and Keluar.

`Karier` is a subtle grouping label, not a heavy accordion or enterprise-style navigation tree.

`Lowongan` is a direct navigation item. Do not add a redundant `Semua Lowongan` submenu when there is no second global job destination.

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
- A concise explanation of how Fit Score is calculated.

Avoid repeating formula math on every collapsed requirement row. If the hero already summarizes the statuses, do not add another large summary card that says the same thing.

A job selector on this page is a workspace switcher, not a “score comparison” control.

`Cara Fit Score dihitung` is preferred over technical labels such as `Transparansi Skor`.

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

Ringkasan is a continuation and decision surface, not a generic analytics dashboard.

Preferred information order is:

1. Greeting and a short orientation.
2. Career/profile foundation status.
3. Current or latest job work / analysis.
4. Meaningful gaps that are distinct from the primary workflow action.
5. Workflow progress and the single primary next step.

It should answer:

- Where am I in the ApplyFit flow?
- What should I continue next?
- What was my latest job analysis?
- Is there an important profile gap I should know about?

The workflow component owns the primary next action. Other cards should not repeat the same CTA.

Page state must be internally consistent. For example, do not show a `Simpan lowongan` empty action when the same page already knows the user has an active saved job or mapping progress.

Use meaningful stats only when they help orientation; avoid decorative dashboard metrics.

Do not show empty-state copy until relevant data has actually finished resolving.

Avoid system-facing labels such as “Data akun terhubung”.

Do not add new Ringkasan features merely to make the page feel fuller; its job is to summarize and continue existing work.

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
- Avoid theatrical loading treatments.
- If auth/session resolution takes noticeable time, a minimal centered ApplyFit mark or neutral placeholder is sufficient.
- Do not use a looping flip animation or other theatrical branded motion.
- Do not introduce a full-page skeleton solely for session bootstrap.
- Motion should be subtle or absent.
- Preserve reduced-motion behavior if motion remains.

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

## 14. UI and Interaction Principles

- Prioritize hierarchy over decoration.
- Avoid excessive nested cards.
- Avoid turning every section into eyebrow + title + subtitle + rounded card.
- Do not add badges unless they communicate useful state.
- Destructive actions should not dominate default views.
- Buttons, inputs, dropdowns, selectors, modals, badges, and status treatments should use consistent hierarchy and interaction patterns across pages.
- Prefer compact rows and progressive disclosure for dense information.
- Mobile should prioritize exceptions and next actions rather than reproducing all desktop detail vertically.
- Motion should be purposeful and restrained.
- If removing an element leaves context, state, and next action equally clear, remove it.

Responsive navigation mechanics already implemented should be preserved unless a real bug requires change. IA/content changes should not casually reopen established breakpoint behavior.

---

## 15. Current Implementation Boundaries

The current product refinement may include:

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
