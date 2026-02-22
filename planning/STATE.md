# Project State

## Project Reference

Voir : `planning/PROJECT.md`, `planning/ROADMAP.md`

**Core value:** Avoir une vue d'ensemble claire de tous les clients et deadlines en un coup d'œil, sans surcharge d'information.

**Current focus:** Phase 9 (Retroplanning IA) — Plan 01 complété. Plan 02 (UI Gantt) restant.

---

## Current Position

**Phase en cours:** 9 (Retroplanning IA) — Plan 01 complété
**Current Plan:** Plan 02 (UI Gantt)

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

**Dernière activité:** 2026-02-22 — Phase 9 Plan 01 complété (retroplanning data layer: types + migration + API + store)

**Progress:** [███████░░░] 71%

---

## What's Next

**Phase 9 – Retroplanning IA:**
- [x] Plan 09-01: Types + Supabase migration + AI endpoint + Zustand CRUD ✅
- [ ] Plan 09-02: UI Gantt — RetroplanningView component + Gantt chart + client integration

---

## Accumulated Context

### Roadmap

- Phases 1–4, 3.7, 7, 7.1, 7.2 : complètes
- Phase 5 : Mobile & Polish — à faire
- Phase 6 : Vue Comptabilité — Plan 01 complété (year filtering, status-based KPIs), reste Plan 02 (histogram)
- Phase 8 : Web Brief Preview & Zoning — Plans 01, 02 et 03 complétés (phase complète)
- Phase 9 : Retroplanning IA — Plan 01 complété (data layer), Plan 02 (UI Gantt) en cours

### Roadmap Evolution

- Phase 8 added: Web Brief Preview & Zoning

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

### Blockers

Aucun.

---
*State initial: 2026-02-13*
*Updated: 2026-02-22 — Phase 9 Plan 01 complété (retroplanning data layer: types + migration + AI endpoint + Zustand CRUD)*
