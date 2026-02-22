# Project State

## Project Reference

Voir : `planning/PROJECT.md`, `planning/ROADMAP.md`

**Core value:** Avoir une vue d'ensemble claire de tous les clients et deadlines en un coup d'œil, sans surcharge d'information.

**Current focus:** Phase 12 (Refonte page client V2) — Plans 01 + 02 + 03 complétés.

---

## Current Position

**Phase en cours:** 12 (Refonte page client V2)
**Current Plan:** 04

**Complété:**
- Phases 1–4 (Timeline, Clients, Deliverables/Calls, Documents) ✅
- Phase 3.7 (Refacto, ModalManager, forms zod, store selectors) ✅
- Phase 7 (Supabase, store branché, auth, migrations) ✅
- Phase 7.1 (Security: Auth, middleware, RLS authenticated only — migration 00006) ✅
- Phase 7.2 (Admin/Member, user_roles, Compta/Settings réservés admins, prix masqués members) ✅
- **Phase 6 Plan 01:** Year-based filtering with status-driven KPIs ✅
- **Phase 8 Plan 01:** UUID section identity, layout fallback, LayoutPlaceholder, ROLE_SIMILARITY_MAP ✅
- **Phase 8 Plan 02:** Navigation submenus, children tabs, page delete, section DnD reorder + add/delete ✅
- **Phase 8 Plan 03:** Dynamic edit form (inferFieldType), merged AI button "IA ◆", strategy context wired to rewrite API ✅
- **Phase 9 Plan 01:** Retroplanning types, Supabase migration, date utility, AI endpoint, Zustand CRUD ✅
- **Phase 9 Plan 02:** CSS Grid Gantt, drag-move + resize, RetroplanningSection + ClientDetail integration, wiki updated ✅
- **Phase 10 Plan 01:** Layout Gallery modal (LayoutCard + LayoutGalleryGrid + LayoutGallery), dual entry points (WikiView + SectionDrawer), variant creation via /api/generate-layout, wiki entry ✅
- **Phase 10 Plan 02:** read-layout API, edit-layout API, LayoutCodeEditor (Code + AI tabs), generate-layout direct code write, gallery "Éditer" button ✅
- **Phase 12 Plan 02:** ClientDetailV2 layout (sidebar fixe + zone projets + footer retroplanning), ClientSidebarSection, ProjectsListSection, ClientDetail délègue à V2 ✅
- **Phase 12 Plan 03:** ProjectDrawer shell (overlay, tabs, keyboard close, state reset) + 3 tab components (Produits master-detail, Docs filtered + PLAUD import, Facturation hybride) ✅

**Dernière activité:** 2026-02-22 — Phase 12 Plan 02 complété (ClientDetailV2 layout + ClientSidebarSection + ProjectsListSection)

**Progress:** [███████░░░] 67%

---

## What's Next

**Phase 11 – Refonte page client & documents projet** (planifiée)
- [x] 11-00: Page proto + bouton Voir proto (validation layout) ✅
- [ ] 11-01: Migration project_id documents + DocumentsSection filtrée
- [ ] 11-02: Migrate layout proto → ClientDetail
- [ ] 11-03: ProjectDrawer (sous-fenêtre) au clic projet
- [ ] 11-04: Import Plaud dans projet + process complet

---

## Accumulated Context

### Roadmap

- Phases 1–4, 3.7, 7, 7.1, 7.2 : complètes
- Phase 5 : Mobile & Polish — à faire
- Phase 6 : Vue Comptabilité — Plan 01 complété (year filtering, status-based KPIs), reste Plan 02 (histogram)
- Phase 8 : Web Brief Preview & Zoning — Plans 01, 02 et 03 complétés (phase complète)
- Phase 9 : Retroplanning IA — Plans 01 et 02 complétés (phase complète)
- Phase 10 : Layout Gallery & Variants — Plans 01 et 02 complétés (phase complète)
- Phase 11 : Refonte page client — à planifier

### Roadmap Evolution

- Phase 8 added: Web Brief Preview & Zoning
- Phase 10 added: Layout Gallery & Variants
- Phase 11 added: Refonte page client (sidebar, docs client vs projet, import Plaud, sous-drawer projets)
- Phase 12 added: Refonte page client V2 — sidebar client fixe + drawer projet + distinction docs client/projet + import PLAUD double accès + retroplanning footer

### Decisions

Les décisions sont dans PROJECT.md (Key Decisions). Contexte technique dans `planning/research/`.

**Phase 6 Plan 01 decisions:**
- Use deliverable status field (completed, pending, in-progress) instead of isPotentiel flag for categorization
- Filter by dueDate year (exclude backlog items with no dueDate)
- Compute KPIs in component via useMemo (avoid storing derived data in Zustand)
- Year selector bounds: 2020 to current+2

**Phase 8 Plan 01 decisions:**
- Use crypto.randomUUID() with Math.random() fallback for section UUID generation
- Optional id field on ZonedSection and HomepageSection types (backward compat with AI agent outputs)
- ensureSectionIds applied at parse time in WebBriefDocumentContent (not in WebBriefView)
- ROLE_SIMILARITY_MAP covers 14 common AI alias patterns (testimonials, about, cta, etc.)
- Section mutations now use find-by-id instead of sorted array index lookup

**Phase 8 Plan 02 decisions:**
- DnD only active in edit mode — view mode skips DragDropContext entirely (clean path separation)
- Up/down move buttons alongside DnD drag handles (accessibility: both methods work)
- Page tabs with delete shown as separate edit-mode-only toolbar below navbar
- handleDeletePage cascades through all 4 nav lists (primary, children, added_pages, footer_only)
- handleAddSection creates default hero section with UUID and empty intent

**Phase 8 Plan 03 decisions:**
- inferFieldType threshold: string > 80 chars = textarea, else input
- Accumulated patch pattern: collect via useRef, flush on Sauvegarder or Enter-on-input
- Enter key on textarea = newline (not save); Enter on input = save
- Empty AI prompt = YAM_PROMPT (creative direction); non-empty = custom rewrite
- Strategy context truncated to 2000 chars each to stay within token limits
- Single handleAiRewrite replaces handleSectionRewrite + handleSectionYam

**Phase 9 Plan 01 decisions:**
- Store retroplanning in actions/ file (not data.slice.ts) — follows established projects.ts pattern
- One retroplan per client enforced by UNIQUE constraint on client_id in Supabase
- computeDatesFromDeadline uses UTC dates to avoid DST issues; durationDays is inclusive range
- AI endpoint receives briefContent (6000 chars max) + deadline; returns durationDays only, dates computed server-side
- [Phase 09]: CSS Grid Gantt: gridTemplateColumns repeat(totalDays,1fr) each column = 1 day, bar positions via daysBetween
- [Phase 09]: Pointer capture drag-move: setPointerCapture ensures tracking outside bar boundary, hasMoved guards click
- [Phase 09]: Preview state local to Gantt: previewTask useState flushed to store only on pointerup (no O(n) writes per move)

**Phase 10 Plan 01 decisions:**
- Scale factor 0.22 with 454% dimensions (1/0.22 = 4.545) gives full-width layout preview within 160px card height
- Gallery state is local useState (not Zustand) — gallery is ephemeral UI, not persistent state
- Variant creation uses inline modal-within-modal with auto-dismiss toast, no separate route
- LayoutPicker gallery icon button only rendered when onOpenGallery prop provided (backward-compatible)
- Wiki gallery button styled as full-width banner card distinct from standard FeatureCards

**Phase 10 Plan 02 decisions:**
- edit-layout returns code only (no disk write) — save is a separate user action, enables review before commit
- direct code write in generate-layout placed BEFORE idempotence check so it always writes when code field provided
- STANDARD_ROLES hardcoded in LayoutCodeEditor — avoids importing section-registry in client component
- AI tab auto-switches to Code tab after successful AI edit so user sees result immediately
- onEditLayout prop on LayoutCard is optional — backward-compatible with all existing usages

**Phase 12 Plan 01 decisions:**
- No index on project_id — low document volume, FK lookup sufficient
- No backfill — existing docs remain NULL (backward-compatible: NULL = client doc)
- addDocument takes projectId as 3rd param (not in docData) — keeps Omit<ClientDocument> shape clean
- project_id FK uses ON DELETE SET NULL — project deletion detaches documents rather than cascading
- openReportUploadModal extended with optional projectId — existing callers unbroken

**Phase 12 Plan 02 decisions:**
- ClientDetail.tsx réduit à un simple wrapper qui rend ClientDetailV2 — routing Zustand (view 'client-detail') inchangé
- selectedProjectId est state local dans ClientDetailV2 (pas Zustand) — état éphémère de navigation
- Zone projets dimmée (opacity-30 + pointer-events-none) quand projet sélectionné — placeholder pour drawer Plan 03
- Escape: désélectionne projet d'abord, navigateBack seulement si aucun projet sélectionné
- ClientSidebarSection gère liens en interne (pas via LinksSection) — style compact sidebar différent du style card

**Phase 12 Plan 03 decisions:**
- deliverables passed as prop to ProjectDrawer (not fetched from store inside) — avoids store coupling in presentational drawer
- billing badge status 'none' hidden from drawer header — only shown when project has a quote
- product count badge in Produits tab label for at-a-glance count
- PLAUD import button in DocsTab opens report-upload modal with projectId pre-set (reuses Plan 01 infrastructure)

### Blockers

Aucun.

---
*State initial: 2026-02-13*
*Updated: 2026-02-22 — Phase 12 Plan 02 complété (ClientDetailV2 layout + ClientSidebarSection + ProjectsListSection + ClientDetail wrapper)*
