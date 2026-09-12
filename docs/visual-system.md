# ApplyFit visual system

## Direction

Warm paper, blue ink, and comfortable working surfaces. The approved color and
navigation concepts remain. Typography and composition now prioritize everyday
reading and touch use, with quieter headings and fewer structural lines.

Requirement → Skill → Evidence → Fit Analysis is expressed through connected
content, grouped supporting information, and expandable proof. Lines are reserved
for meaningful progress or navigation; they are not a repeated page decoration.

## Shared ownership

- `app/design-system.css` owns semantic tokens, composition, and responsive
  presentation. It loads after legacy feature styles in `app/globals.css`.
- `ContentHeaders` owns page and section hierarchy; `ActionControl` retains shared
  control semantics, variants, focus, and disabled behavior.
- `AppShell`, `AppTopBar`, and `AppSidebar` share the same navigation destinations.
  Desktop has horizontal navigation; tablet a fixed compact rail; mobile bottom navigation and a utility drawer.
- `JobFocusShell` and `JobWorkspaceNav` provide context and job-specific chapters.
- `RelationshipLane` connects supporting information in portfolio, matching,
  and expanded analysis. `ConnectionPath` presents the ordered model in auth.
- `ExpandableText` keeps complete portfolio descriptions available, showing its
  disclosure only when the rendered text exceeds three lines.

Use semantic colors and shared dimensions, not a separate palette per page.
The single light appearance uses warm off-white paper and cobalt. Inverse panels
retain readable white text. Status meanings remain explicit in copy.

The cobalt navigation band and four meeting shapes provide a recurring signature.
`BrandMotif` is a quiet reference to requirement, skill, evidence, and fit; it appears
as cropped accents in selected cards and auth. Empty collections use contextual CollectionIllustration artwork. It does not imply completion or add
new metrics. Search and filter controls share surfaces, focus treatment, and radii.
The references were [Jobstreet](https://id.jobstreet.com/) and
[Dealls](https://dealls.com/): consistent branded navigation and supporting shapes,
rather than their exact palettes, assets, or marketing composition.

`LanguageProvider` owns the persisted ID/EN preference. Explicit translation calls
and server-page `Message` boundaries translate interface copy. User-authored text
and internal option values are preserved. Translation does not mutate the DOM or
recreate the page on language changes.

## Composition

| Area                   | Composition                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| Shell                  | Typographic brand, horizontal desktop destinations, quiet account menu        |
| Ringkasan              | Full-width greeting, one readiness checkpoint, real score when available      |
| Profil                 | Blue career-direction card beside an open skill index                         |
| Portfolio & Pengalaman | Two-column collection of works; support relationships in each footer          |
| Lowongan               | Self-contained job cards with context and actual requirement state            |
| Detail                 | Large role heading, readable job description, restrained contextual aside     |
| Persyaratan            | Reviewable rows directly beneath the introduction                             |
| Cocokkan Profil        | Unresolved reviews first; reviewed relationships in disclosure                |
| Analisis               | Typographic score with a percentage rule, explanation, gaps, expandable proof |
| Pengaturan             | Section context beside constrained account forms                              |
| Auth                   | Editorial brand panel and ordered product model beside existing forms         |

The shared content grid caps at 1200px, keeping 1920px screens readable. Forms
stay constrained. Columns stack at widths appropriate to their content; portfolio
becomes a single column on mobile. The job workflow keeps its clear return path.

## Type and geometry

DM Sans handles headings, body text, controls, and numerals. Titles use a restrained 28–36px scale, body text 15–16px,
and secondary metadata 12–14px. Mobile form text stays at 16px. Controls have 8px
corners; grouped surfaces use 12–16px corners. Whitespace and tonal contrast carry
hierarchy. Avoid both repeated separator lines and unnecessary nested cards.

Tablet and mobile actions have at least 44px touch height. Menus and destructive
confirmations must stay anchored inside the viewport. Columns reflow before their
reading widths become cramped; shrinking the desktop composition is insufficient.

Tablet navigation is an inset rounded rail with icons and short labels, fixed without an expand/collapse control. Mobile uses a full-height drawer with an anchored brand/close header
and a separate scrollable menu. Active destinations use a quiet blue surface.
Panduan and Pengaturan sit below the primary destinations. Opening the drawer locks
the page at its existing scroll position, contains keyboard focus, and makes the
background inert; closing restores scroll and focus. Respect safe-area insets.

## Actions and forms

- Bordered buttons retain their original border, dimensions, and resting shadow on pointer hover. Do not add a ring, outline, stronger shadow, or underline.
- Filled actions darken slightly. Transparent secondary buttons gain a subtle blue tint while preserving their original text color. The light CTA on the blue score panel keeps readable blue text.
- Arrow CTAs translate their arrow by 3px on hover or keyboard focus. Other icons stay still. Respect reduced-motion preferences.
- Edit/delete entry actions use the shared ui-record-action treatment: icon only, accessible name, 16px icon, and 44px target. Their backgrounds remain transparent; edit uses blue feedback and delete uses red feedback. Confirmation actions retain explicit text.
- Keyboard focus remains visible and disabled actions remain distinguishable.
- Cancel/save controls sit side by side, cancel left and save right, including narrow career editors.
- Compound search fields own their focus treatment at the wrapper; the inner input must not add a second outline or shadow.

## Collection and account patterns

Saved-job cards own information-edit and delete actions beside Lihat detail. Editing expands inline within the card; deletion requires confirmation. The detail header does not duplicate these actions. Mobile description editing stays aligned to the right of the section title.

Original vector illustrations distinguish empty jobs, empty portfolio collections, and empty search results. Reuse CollectionIllustration rather than adding unrelated stock icons. Source fields share JobSourceField, including common portals and an optional custom source whose draft survives option and language changes.

The identity settings card groups its introduction, avatar, and live display name in a softly tinted panel beside the form. Whitespace separates the preview and save action; neither uses a decorative divider. Tablet moves the preview beside the introduction and mobile stacks the sections.

## Behavior and validation

Presentation preserves existing editors, authentication, APIs, ownership, and deterministic scoring. Analysis lists unmatched requirements last while preserving the relative order of other items. Review status and fit status remain distinct.

Run npm run lint, npm run build, and the render/i18n tests for UI changes. npm run qa:ui captures 11 authenticated routes at 390, 768, 1024, and 1440 CSS pixels and checks document overflow. It uses the existing ignored demo authentication state and blocks data-changing requests.

For CSS cleanup, run the UI script with --snapshot=before, then --snapshot=after to compare computed styles. Screenshots and reports remain ignored under screenshots/ui-qa/. The dedicated button and source QA scripts cover hover/focus behavior and intercepted source payloads. A successful route capture alone does not establish coverage of every editor or error state.

## Responsive requirement review

Priority controls keep their intrinsic width at every viewport. At 1024–1199px, requirement cards use two rows: the requirement text spans the content width, followed by compact priority controls with review status and actions aligned to the right. Deletion confirmation gets its own row. Tablet and mobile retain their dedicated layouts, and selection mode keeps the checkbox separate from the text.

Run `node scripts/screenshots/requirements-responsive.mjs` to check list, edit, delete-confirmation, and selection states at 12 widths from 360 to 1440px. The script blocks writes and checks priority-control width and clipped controls. Set `QA_WIDTHS` to a comma-separated list when running `npm run qa:ui` to inspect additional breakpoints; the standard widths remain unchanged. Responsive review includes boundary widths around 768, 1024, 1100, and 1200px, not only named device presets.

## Readiness illustrations

Skill empty states and Ringkasan checkpoints use CollectionIllustration, sharing the paper, cobalt, and muted sand palette of Portfolio and Lowongan. Use contextual profile, skills, portfolio, jobs, requirements, matching, or analysis artwork instead of the ApplyFit logo or a warning icon for ordinary incomplete data. Illustrations are decorative; headings, stage labels, and action text communicate the actual state. Completed analysis retains the real score, including zero, without a placeholder illustration.

Early Ringkasan checkpoints share SummaryCheckpoint: concise context and copy beside one illustrated action panel. Job-progress cards use the same proportions, with workflow progress below. Narrow screens stack these areas. Secondary links must not repeat the primary destination. Run `node scripts/screenshots/checkpoints-qa.mjs` to inspect twelve dashboard states and empty Skill, Portfolio, and Lowongan collections at 390, 768, 1024, and 1440px. Responses are browser fixtures and writes are intercepted.

## Empty collection composition and actions

EmptyCollectionState owns the illustration, heading, description, spacing, and action layout for Profil skill, Portfolio, and Lowongan empty states. Show one add action; hide collection counts and filters when no collection data exists. An open add editor replaces the empty-state prompt. Filtered zero results retain filter recovery actions. All button variants and text CTAs remain free of underlines on hover and keyboard focus; preserve focus indicators and arrow motion.

DeleteConfirmation owns the shared inline confirmation for Skill, Portfolio, and Persyaratan; the Lowongan modal retains its focus management. Delete confirmations use readable 14px copy above two equal-width text actions: Batal on the left and Hapus on the right, with minimum 44px targets. Do not reuse icon-only record-action classes for confirmation buttons. Keep the existing job modal focus management and cancellation behavior. Run `node scripts/screenshots/delete-qa.mjs` to check all four deletion entry points at 390, 768, 1024, and 1440px without deleting data.
