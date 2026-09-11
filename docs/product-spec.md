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

### Current visual direction

The current visual redesign uses the approved warm-paper and blue-ink palette with horizontal desktop navigation. DM Sans, soft grouped surfaces, and touch-friendly layouts supersede the earlier serif-and-rules treatment. The user explicitly authorized replacing previous visual guidelines. `docs/visual-system.md` describes the current shared system; product behavior below remains authoritative.

Ringkasan places its greeting beside the current work on wide screens. Profil places career direction beside the skill collection. These context columns stack on smaller screens. Portfolio collections use connected support lanes; saved jobs use responsive cards with a search field and stage filter. Review-complete connections may be collapsed, and missing analysis rows are presented last without changing their scoring or review semantics.

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

At 1024px and wider, the shell uses horizontal navigation in the application top bar. Tablet uses a fixed compact navigation rail without an expand/collapse control. Mobile keeps the four primary destinations in a fixed bottom navigation with safe-area spacing, plus a scrollable drawer for profile and utility access. Opening the drawer locks background scrolling and traps keyboard focus.

The top bar is the application-level chrome and contains:

- the ApplyFit mark and wordmark,
- the primary navigation on desktop, or the tablet/mobile navigation control,
- a compact account/avatar trigger.

Desktop provides a quiet Panduan link to the Fit Score explanation. The tablet rail and mobile drawer retain the compact guide.

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
- **Profil**
- **Portfolio & Pengalaman**
- **Lowongan**

These are direct destinations, shown as a flat list. Desktop presents a horizontal list.
Tablet uses a fixed inset rail with icons and short labels; it does not need expansion.
Mobile uses a full-height drawer with a fixed heading and an independently scrolling menu.
Panduan opens Cara Fit Score dihitung. Pengaturan and
Keluar remain available through the top bar account menu. The drawer also retains
Pengaturan as a utility link. No redundant Semua Lowongan submenu is needed.

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

Profil uses this career-foundation model:

- **Bidang Karier → Target Role → Skill.**
- Skill status such as active or learning when required by product logic.

Bidang Karier provides context for the direction the user is exploring. Selecting a Bidang should prioritize relevant Target Role suggestions, but role search remains global because a role may belong to more than one field. Bidang Karier does not directly affect requirement matching or Fit Score.

ApplyFit maintains curated canonical catalogs for roles and skills, plus deterministic aliases for common alternate names such as `JS` → `JavaScript`, `ReactJS` / `React.js` → `React`, and `TS` → `TypeScript`. Alias resolution must not use AI.

Catalog relationships are many-to-many rather than rigid trees:

- One role may be relevant to multiple Bidang Karier.
- One skill may be common to multiple roles.
- Role-to-skill relationships prioritize useful suggestions; they do not automatically add skills to a profile or change scoring.

Users may keep a manual/custom Bidang, role, or skill when no catalog entry matches. A recognized canonical entry or alias should resolve to the canonical name while preserving the existing profile and scoring behavior.

The profile should represent the user's career model, not their authentication identity.

Account name, avatar, email, and password belong in Pengaturan.

Profil does not ask users for proficiency labels because they do not affect requirement matching or Fit Score. Existing stored proficiency values remain compatibility data and must not imply scoring significance.

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

Job sources use a dropdown of familiar portals and media (LinkedIn, JobStreet, Glints, Kalibrr, Indeed, Karir.com, Dealls, company careers sites, Instagram, Telegram, WhatsApp), followed by **Lainnya — isi sendiri**. Custom sources retain the existing free-text storage format. Empty job and portfolio collections use original illustrations; filtered empty results use a distinct search illustration.

### 7.1 Detail

Purpose: provide the job context and one clear next action.

Show:

- Job metadata.
- Original job description under a simple `Deskripsi lowongan` heading.
- Job information edit and delete controls live on the saved-job card, not the Detail header. The description editor remains beside the original description.
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

Review state is separate from the scoring result:

- **Perlu dicocokkan** — the requirement has not completed review because no profile skill has been connected and the user has not explicitly confirmed that no evidence is available.
- **Sudah ditinjau · tanpa bukti** — the user has explicitly completed review without connecting a skill or supporting evidence.

Completing review without evidence does not prove the requirement. It remains `missing` internally for deterministic scoring and is presented as **Belum ada kecocokan** in result and analysis contexts. For an unmapped requirement, review completion comes from the separate `reviewed_without_evidence` state rather than from its scoring status.

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

The Fit Score remains the primary visual focus. Keep the attention summary and place unmatched items last in the detailed requirement list.

Example summary:

> 10 dari 12 persyaratan sudah terbukti. Dua lainnya belum punya skill yang cocok di profil kamu.

The analysis should provide:

- Overall Fit Score.
- A concrete one-sentence summary of the result.
- Clear but compact status counts.
- **Belum ada kecocokan** requirements last in Rincian persyaratan; keep the existing actionable attention summary.
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

- **Terbukti** — mapped to an active profile skill with at least one linked supporting item. The internal scoring status remains `proven`.
- **Belum terbukti** — mapped to an active profile skill with no linked supporting item. The internal scoring status remains `partial`.
- **Sedang dipelajari** — mapped to a profile skill marked as learning. The internal scoring status remains `learning`.
- **Belum ada kecocokan** — no skill mapping exists for the requirement. The internal scoring status remains `missing`.

A requirement cannot become **Belum terbukti** (`partial`) without first being connected to a skill.

Review completion and scoring status are independent. `reviewed_without_evidence = true` means the user has completed the review decision, while the requirement remains `missing` internally and **Belum ada kecocokan** to the user. It therefore receives the same score as any other `missing` requirement.

### Score scope

Only scoreable skill/tool requirements contribute to Fit Score.

Education, experience, location, and other informational context do not affect the score unless explicitly changed by a later approved product decision.

### Baseline scoring

Current deterministic baseline:

- Required weight: 3.
- Preferred weight: 1.
- Terbukti (`proven`) multiplier: 1.0.
- Belum terbukti (`partial`) multiplier: 0.5.
- Sedang dipelajari (`learning`) multiplier: 0.2.
- Belum ada kecocokan (`missing`) multiplier: 0.

Formula:

`Fit Score = current weighted points / maximum weighted points × 100`

AI must not determine this score.

### Fit Score explainer

The existing `/contoh-perhitungan` destination is the single `Cara Fit Score dihitung` explainer. It contains:

- Terbukti, Belum terbukti, Sedang dipelajari, and Belum ada kecocokan semantics and multipliers.
- Wajib and Preferensi weighting.
- The deterministic Fit Score formula and score scope.
- The concrete worked example under a `Contoh perhitungan` section.

The global drawer and tablet rail show a single Panduan Fit Score utility link above Pengaturan. The compact rail uses the short label Panduan. Status explanations belong on the guide page, not inside the navigation.

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

Choose the most useful page state in this order:

1. If no career profile exists, show inline first-login onboarding with the primary action `Buat profil karier` and a plain flow preview: `Profil karier → Portfolio & Pengalaman → Lowongan`.
2. If the profile exists but the career foundation is incomplete, show its most important actionable gap. A quiet link back to existing profile context may appear when it leads somewhere different from the primary action.
3. If the career foundation is ready but no jobs exist, use `Tambah lowongan` as the primary action and briefly explain that the existing profile and portfolio will be reused.
4. If the current job still has requirements in `Perlu dicocokkan`, show the ongoing workflow and its actual next action. Add at most one quiet route to the job detail or the saved-jobs list.
5. If every scoreable requirement has completed review and Analysis is available, show `Analisis terakhir` as the single primary card with Fit Score, summary, completed workflow, and `Lihat analisis`.

For a completed analysis with only one saved job, a plain `Cek lowongan berikutnya` section may explain profile and portfolio reuse and offer `Tambah lowongan`. With multiple saved jobs, replace it with a plain `Lowongan terbaru` list of at most three other jobs and one `Lihat semua lowongan` link.

Each state has one primary focus and, only when it helps continuation, one quiet secondary area. Secondary content stays open/plain rather than becoming another dashboard card.

Workflow completion follows requirement **review state**, not scoring status. A requirement marked `Sudah ditinjau · tanpa bukti` counts as reviewed even though its analysis result remains **Belum ada kecocokan**. Ringkasan must not add a separate section for those unproven requirements.

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

Show `Dasar karier` only when there is a meaningful action to take. Do not keep it on the page as a permanent completion note.

Page state must be internally consistent. For example, do not show a `Simpan lowongan` empty action when the same page already knows the user has an active saved job or mapping progress.

Use a number only when it materially helps orientation or the next decision.

Do not show empty-state copy until relevant data has actually finished resolving.

Avoid system-facing labels such as `Data akun terhubung`.

Whitespace is intentional. Do not add content merely to make Ringkasan feel fuller.

---

## 10. Authentication

Authentication is a permanent, production-quality product surface. Its structure, copy hierarchy, responsive behavior, and account flows must remain coherent after Public Beta; they must not depend on Demo remaining the primary entry point.

Authentication screens should remain visually simple and consistent. Preserve the current split-screen desktop structure and its compact mobile adaptation unless a real usability issue requires redesign; the current refinement is primarily a copy and hierarchy cleanup.

The brand panel should use one consistent proposition across sign-in, registration, and password recovery rather than inventing a different marketing headline for every auth state.

Preferred proposition:

> **Cek kesiapanmu sebelum melamar.**  
> Bandingkan persyaratan lowongan dengan skill dan pengalaman yang sudah kamu punya.

Fit Score principle may be communicated concisely:

> Fit Score membantu kamu melihat gap, bukan menentukan apakah kamu harus melamar.

### Public Beta and Demo

The quiet `Beta` indicator beside the ApplyFit wordmark is explicitly temporary. It is the only Auth refinement element that should be designed for removal after Beta.

During Public Beta, Login provides a prominent `Coba demo` fast lane for recruiters and new visitors. Demo must remain a separate, optional entry action above the account form:

- It authenticates in one click through the same production session architecture as normal Login.
- Demo credentials stay server-side and are never displayed or embedded in client output.
- It opens the existing populated ApplyFit workspace without requiring setup.
- A session entered through `Coba demo` is view-only. The authenticated shell
  identifies it with one concise, unobtrusive notice that changes cannot be saved.
- Read-only behavior belongs to that demo-entry session, not permanently to the
  underlying account identity; a successful regular Login remains a normal,
  editable account session.
- Mutation attempts remain blocked on the server and must resolve as clear
  failures in the interface, never as saved or successful states.
- The regular Login form remains complete and visually clear on its own.
- Removing or reducing Demo prominence later must not require restructuring the Auth family.

`Coba demo` and `Masuk` must not compete as identical primary actions. Demo is the visible fast lane for trying the product during Public Beta; `Masuk` remains the primary submit action for an account owner.

### Login

Preferred heading:

> Masuk ke ApplyFit

Preferred supporting copy:

> Lanjutkan dari tempat terakhir kamu berhenti.

Primary action:

> Masuk

Preferred order:

1. Heading and supporting copy.
2. `Coba demo`.
3. Quiet `atau masuk dengan akunmu` separator.
4. Email and password.
5. `Masuk`.
6. Password recovery and registration links.

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

### Verification and new password

Verification screens state where the code was sent when the email can be shown safely and keep any existing resend behavior quiet. The new-password task uses `Buat kata sandi baru`, `Kata sandi baru`, `Konfirmasi kata sandi`, and `Simpan kata sandi` without provider or debug terminology.

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

ApplyFit's permanent product voice uses natural Indonesian as its default language. Common English product and career terms may remain when they sound more natural, such as:

- role
- skill
- Fit Score
- GitHub
- portfolio
- technology names

Voice should be:

- Natural Indonesian that sounds like everyday conversation.
- Human and concise.
- Calm and young-professional.
- Direct without sounding cold.
- Specific and task-oriented.
- Appropriate for Indonesian fresh graduates, early-career jobseekers, and career switchers.

Prefer everyday phrasing such as:

> Skill yang kamu punya atau lagi kamu pelajari.

Choose familiar phrasing over overly formal Indonesian or literal translations. Use only the words needed to help the user understand the current state, decision, or next action.

Approved status taxonomy must remain consistent. Precise security and legal wording must keep its exact meaning even when surrounding copy is simplified.

Avoid:

- Corporate or HR language.
- Database or system language.
- Overly formal Indonesian.
- Motivational career clichés.
- Generic SaaS copy.
- Forced Gen Z slang.
- Unnecessary explanation, including copy that repeats what the UI already makes obvious.
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

The current redesign supersedes previous typography, color, surface, composition,
and desktop-sidebar prescriptions. See [the visual system](visual-system.md) for
the implemented direction and shared component ownership.

DM Sans carries headings, body text, controls, and score numerals. Soft surfaces
and whitespace replace repeated decorative rules. Warm paper and blue ink define
the single light appearance. Shared semantic tokens govern all pages.

ApplyFit is light-only, regardless of OS preference or previously saved appearance.
The navigation bar offers ID/EN for interface copy, with Indonesian as the default
and a locally persisted choice. User-authored job descriptions, skill names, and
portfolio content remain in their original language. Locale changes must not reset
forms, alter filter values, change stored enums, or change scoring.

Global pages share a centered content grid. Desktop uses horizontal navigation;
tablet uses a fixed compact rail and mobile combines bottom navigation with a drawer. The selected-job workspace
keeps its return breadcrumb and Detail → Persyaratan → Cocokkan Profil → Analisis
navigation. Authentication remains a focused standalone flow.

Controls retain their accessible labels, focus states, disabled states, and
interaction semantics. Color never substitutes for a result or review label.
Presentation changes do not alter matching, evidence reuse, or deterministic
scoring. Forms remain constrained and dense proof stays available through
progressive disclosure.

---

## 15. Current Implementation Boundaries

The current product refinement may include:

- Visual foundation reset around the calm-workspace north star.
- DM Sans typography across headings, body, controls, and score numerals.
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
- A curated, representative career catalog with deterministic role/skill aliases and contextual autocomplete.

The following are not required for the current refinement unless explicitly requested:

- Advanced semantic / transferable-skill matching.
- AI-driven evidence ranking.
- A large external or exhaustive role/skill taxonomy.
- AI-driven or semantic role/industry/skill suggestions.
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
- A requirement with internal status `missing` has no associated profile skill and is labeled **Belum ada kecocokan** in the UI.
- A mapped active skill with no supporting item has internal status `partial` and is labeled **Belum terbukti**, not **Belum ada kecocokan**.
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

### Mobile navigation refinement

The mobile top bar shows only the ApplyFit motif wordmark and menu button. The drawer contains profile access, language selection, the Fit Score guide, settings, and sign-out. Primary destinations remain in the bottom navigation without duplication in the drawer. The job workspace retains its job tabs and provides the same utility drawer. The meeting motif serves as the logo and favicon; decorative instances are cropped accents in selected cards rather than page headings.

### Approved controls and collection actions

Button hover preserves the original border, dimensions, and resting shadow. Do not add a border, outline, ring, stronger shadow, or underline on pointer hover. Keep the keyboard focus-visible indicator.

Filled buttons may darken slightly. Transparent secondary buttons receive only a subtle background tint; their text color stays unchanged. The light Lihat analisis CTA retains readable blue text. Arrow CTAs retain their 3px arrow translation with reduced-motion support; other icons stay still.

Edit/delete entry actions are icon-only, have accessible names and at least 44px touch targets, and remain transparent without borders or shadows. Hover changes their ink subtly. Destructive confirmation buttons retain explicit text. Cancel and save share a two-column row, cancel left and save right.

Saved-job cards provide Edit and Delete beside Lihat detail. Edit opens an inline information form; successful saves update the card locally. Delete requires confirmation and removes the card only after the existing API succeeds. Failed requests retain the item and show an error. The Detail header is read-only; description editing remains beside its section title on all screen sizes.

Job sources use a shared optional dropdown: LinkedIn, JobStreet, Glints, Kalibrr, Indeed, Karir.com, Dealls, company career sites, Instagram, Telegram, WhatsApp, and Lainnya — isi sendiri. Custom values and drafts survive option and language changes. This does not import jobs from these services.

Empty job, portfolio, and search states use contextual illustrations and concise guidance. Search fields share the standard compound-input focus treatment without a second outline on the inner input.

Identity settings group the introduction, avatar, and live name preview beside the form. Use spacing rather than decorative dividers. The layout reflows on tablet and mobile. Account persistence and security settings remain unchanged.
