# Project State

## Project Reference

Voir : `planning/PROJECT.md`, `planning/ROADMAP.md`

**Core value:** Avoir une vue d'ensemble claire de tous les clients et deadlines en un coup d'œil, sans surcharge d'information.

**Current focus:** Phase 8 (Web Brief Preview & Zoning) — Plan 01 complété.

---

## Current Position

**Phase en cours:** 8 (Web Brief Preview & Zoning)
**Current Plan:** 08-02 of 3

**Complété:**
- Phases 1–4 (Timeline, Clients, Deliverables/Calls, Documents) ✅
- Phase 3.7 (Refacto, ModalManager, forms zod, store selectors) ✅
- Phase 7 (Supabase, store branché, auth, migrations) ✅
- Phase 7.1 (Security: Auth, middleware, RLS authenticated only — migration 00006) ✅
- Phase 7.2 (Admin/Member, user_roles, Compta/Settings réservés admins, prix masqués members) ✅
- **Phase 6 Plan 01:** Year-based filtering with status-driven KPIs ✅
- **Phase 8 Plan 01:** UUID section identity, layout fallback, LayoutPlaceholder, ROLE_SIMILARITY_MAP ✅

**Dernière activité:** 2026-02-22 — Phase 8 Plan 01 complété (UUID section identity + layout fallback)

**Progress:** [█████████░] ~93%

---

## What's Next

**Phase 8 – Web Brief Preview & Zoning:**
- [x] Plan 08-01: UUID migration + layout fallback system (foundation) ✅
- [ ] Plan 08-02: Navigation submenus + page delete + section DnD + section add/delete
- [ ] Plan 08-03: Dynamic edit form + merged AI button + strategy context re-read

---

## Accumulated Context

### Roadmap

- Phases 1–4, 3.7, 7, 7.1, 7.2 : complètes
- Phase 5 : Mobile & Polish — à faire
- Phase 6 : Vue Comptabilité — Plan 01 complété (year filtering, status-based KPIs), reste Plan 02 (histogram)
- Phase 8 : Web Brief Preview & Zoning — Plan 01 complété

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

### Blockers

Aucun.

---
*State initial: 2026-02-13*
*Updated: 2026-02-22 — Phase 8 Plan 01 complété (UUID section identity + layout fallback)*
