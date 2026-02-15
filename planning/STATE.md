# Project State

## Project Reference

Voir : `planning/PROJECT.md`, `planning/ROADMAP.md`

**Core value:** Avoir une vue d'ensemble claire de tous les clients et deadlines en un coup d'œil, sans surcharge d'information.

**Current focus:** Phase 5 (Mobile & Polish) ou Phase 6 (Compta) — au choix. Phases 7, 7.1, 7.2 terminées (Supabase, Auth, RLS, Admin/Member).

---

## Current Position

**Phase en cours:** 6 (Compta)
**Current Plan:** 06-02 of 2

**Complété:**
- Phases 1–4 (Timeline, Clients, Deliverables/Calls, Documents) ✅
- Phase 3.7 (Refacto, ModalManager, forms zod, store selectors) ✅
- Phase 7 (Supabase, store branché, auth, migrations) ✅
- Phase 7.1 (Security: Auth, middleware, RLS authenticated only — migration 00006) ✅
- Phase 7.2 (Admin/Member, user_roles, Compta/Settings réservés admins, prix masqués members) ✅
- **Phase 6 Plan 01:** Year-based filtering with status-driven KPIs ✅

**Dernière activité:** 2026-02-15 — Phase 6 Plan 01 complété (year filtering, status-based KPIs)

**Progress:** [█████████░] ~92% (reste Mobile + finition Compta Phase 6)

---

## What's Next

**Phase 5 – Mobile & Polish:**
- [ ] Responsive timeline (scroll horizontal touch-friendly)
- [ ] Fiche client et modales adaptées mobile
- [ ] Touch targets 44x44px minimum
- [ ] Performance sur devices réels

**Phase 6 – Compta (détail dans ROADMAP + `phases/06-.../06-CONTEXT.md`):**
- [x] Plan 06-01: Year-based filtering with status-driven KPIs
- [ ] Plan 06-02: Monthly histogram
- À finaliser selon roadmap : entrées payé/prévu, sorties (freelances + coûts fixes)

---

## Accumulated Context

### Roadmap

- Phases 1–4, 3.7, 7, 7.1, 7.2 : complètes
- Phase 5 : Mobile & Polish — à faire
- Phase 6 : Vue Comptabilité — Plan 01 complété (year filtering, status-based KPIs), reste Plan 02 (histogram)

### Decisions

Les décisions sont dans PROJECT.md (Key Decisions). Contexte technique dans `planning/research/`.

**Phase 6 Plan 01 decisions:**
- Use deliverable status field (completed, pending, in-progress) instead of isPotentiel flag for categorization
- Filter by dueDate year (exclude backlog items with no dueDate)
- Compute KPIs in component via useMemo (avoid storing derived data in Zustand)
- Year selector bounds: 2020 to current+2

### Blockers

Aucun.

---
*State initial: 2026-02-13*
*Updated: 2026-02-15 — Phase 6 Plan 01 complété (year filtering + status-based KPIs)*
