# ApplyFit Roadmap

**Status:** Planning reference only  
**Product source of truth:** `product-spec.md`  
**Historical baseline:** `prd-v1.0.md`

This document tracks possible future improvements for ApplyFit. It is **not** an implementation checklist and does not override `product-spec.md`.

Roadmap items may be explored, changed, postponed, or removed. A roadmap item only becomes active implementation scope after it is explicitly approved and promoted into `product-spec.md` or a dedicated implementation task.

---

## 1. Roadmap Principles

Future work should preserve the core ApplyFit model:

**Job Requirement → Skill → Evidence → Fit Analysis**

Roadmap work should also preserve these product principles:

- AI may assist, but it should not become the source of truth for Fit Score.
- Fit Score remains explainable and deterministic.
- ApplyFit helps users understand readiness; it does not decide whether they should apply.
- New automation should reduce repetitive work without hiding why a result exists.
- Ambiguous matches should remain reviewable by the user.
- New features should not turn ApplyFit into a generic job tracker, HR dashboard, or AI career coach.
- Product quality and clarity matter more than feature count.

---

## 2. Already Current — Do Not Treat as Roadmap

The following items are part of the current approved product direction and must **not** be deferred as future work:

- Grouped global information architecture:
  - Ringkasan
  - Karier
    - Profil
    - Portfolio & Pengalaman
  - Lowongan
- Job-specific workspace navigation:
  - Detail
  - Persyaratan
  - Cocokkan Profil
  - Analisis
- Review-first matching instead of manual-first matching.
- Safe deterministic auto-linking for obvious skill matches.
- Reuse of existing Skill ↔ Portfolio & Pengalaman relationships across jobs.
- Manual linking as fallback for unresolved requirements.
- Removal of redundant CRUD/system terminology from user-facing UI.
- Auth, Pengaturan, loading, and global copy simplification from the current product refinement pass.
- Fit Score explainability and current scoring invariants.

These belong to `product-spec.md`.

---

## 3. Career Profile Intelligence

### 3.1 Searchable role and field inputs

Improve target-role and career-field entry with searchable suggestions while preserving manual input.

Potential scope:

- searchable role suggestions
- searchable career-field suggestions
- manual fallback for values outside the curated set
- lightweight normalization to reduce duplicate variants

The goal is faster, cleaner profile setup without forcing users into a rigid taxonomy.

### 3.2 Skill taxonomy and aliases

Introduce a curated skill vocabulary that can recognize equivalent naming without changing the user's visible wording unnecessarily.

Examples:

- `React.js` ↔ `React`
- `Postgres` ↔ `PostgreSQL`
- common abbreviations and naming variants

Potential scope:

- canonical skill identifiers
- aliases
- duplicate detection
- safer normalization during profile setup and matching

This should remain transparent and editable.

### 3.3 Suggested skills from target role

After the taxonomy is reliable, ApplyFit may suggest skills commonly associated with the user's target role.

Suggestions are optional. They should never imply that the user possesses a skill simply because it is commonly associated with the role.

---

## 4. Job Intake Improvements

### 4.1 Better complete-job-description input

Improve job intake so users can paste a complete job posting and preserve useful structure instead of treating the input as one undifferentiated text block.

Potentially recognize:

- responsibilities
- required qualifications
- preferred qualifications
- tools / technologies
- experience context
- education context

The user must still be able to review the extracted result before it affects analysis.

### 4.2 Job URL import

Explore importing job information from URLs such as:

- LinkedIn
- JobStreet
- Glints
- company career pages

This is a larger feature because many job sites use dynamic rendering, login requirements, anti-bot protections, or inconsistent markup.

Any URL-import flow must keep manual paste/input as a reliable fallback.

### 4.3 Multilingual extraction quality

Improve requirement extraction for Indonesian, English, and mixed-language job descriptions.

Important behavior:

- preserve technical terms when translation would reduce precision
- classify by meaning, not shallow keywords
- avoid translating established tool/technology names
- keep the result editable before use

---

## 5. Matching Intelligence

### 5.1 Semantic skill suggestions

Add suggestions for requirements that do not have an obvious deterministic name/alias match.

Examples may include:

- related terminology
- transferable technical skills
- equivalent ecosystem terminology

These should be **suggestions**, not silent automatic links, unless confidence and product rules eventually justify deterministic behavior.

The user must be able to see and correct the proposed relationship.

### 5.2 Transferable-skill support

Explore relationships where an existing skill may partially support a requirement even when the names differ.

This is intentionally separate from current exact/normalized matching because it introduces interpretation and ambiguity.

Any implementation must preserve:

- explainability
- user review
- deterministic Fit Score calculation after the relationship is confirmed

### 5.3 Match confidence

If semantic matching is introduced, ApplyFit may expose confidence or uncertainty internally to decide when to:

- auto-link safely
- suggest a link for review
- leave the requirement unresolved

Avoid turning confidence into noisy user-facing percentages unless they genuinely help decision-making.

---

## 6. Portfolio & Pengalaman Relevance

### 6.1 Contextual suggestions during matching

When a skill is connected to a requirement, surface the most relevant existing Portfolio & Pengalaman items first.

The goal is to help users understand what supports the skill without forcing them to manually search through everything.

### 6.2 Smarter relevance ranking

Explore ranking existing projects, work experience, internships, and certificates by relevance to a matched skill or requirement.

AI may assist with relevance suggestions, but it must not silently change core evidence relationships or Fit Score logic.

### 6.3 Tighter Skill ↔ Portfolio workflow

Improve the relationship between Profil and Portfolio & Pengalaman so users can understand and manage which items support each skill without navigating through database-like CRUD flows.

---

## 7. Analysis Enhancements

Potential future improvements may make analysis easier to understand across repeated job evaluations, while keeping the decision with the user.

Possible directions:

- recurring gap patterns across multiple analyzed jobs
- clearer history of how profile improvements affect later analyses
- better filtering and grouping for large requirement sets

Do **not** turn this into an “apply / do not apply” recommendation system.

Side-by-side job comparison is not part of the current product direction unless explicitly reconsidered later.

---

## 8. Authentication and Convenience

### 8.1 Additional sign-in methods

Additional authentication methods such as Google sign-in may be considered later if they materially reduce onboarding friction.

This is not a current priority.

---

## 9. Parked Ideas

The following ideas are intentionally not active roadmap priorities:

### Application tracking

A full application tracker would broaden ApplyFit into a job-search management product. Revisit only if it directly strengthens the readiness workflow rather than becoming a separate product inside ApplyFit.

### Wawasan & Rekomendasi

Generic career recommendations, motivational guidance, and AI-generated “what to do next” advice are intentionally parked.

If revisited, they must be grounded in the user's actual requirements, skills, and Portfolio & Pengalaman rather than generic AI advice.

### Apply / don't apply recommendation

ApplyFit should not tell the user whether they should submit an application. The product provides evidence and gaps; the final decision belongs to the user.

---

## 10. Promotion Rule

A roadmap item becomes active product scope only when:

1. the user problem is clear,
2. the behavior and boundaries are explicitly approved,
3. it is added to `product-spec.md` or a dedicated approved implementation specification, and
4. an implementation task explicitly requests it.

Until then, Codex or other contributors should treat roadmap items as **future context only** and must not implement them opportunistically.
