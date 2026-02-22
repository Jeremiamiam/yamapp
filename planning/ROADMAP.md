# Roadmap: YAM Dashboard

## Overview

Build a minimalist client management timeline for communication agencies, starting with mock data to validate UX before implementing persistence. The journey progresses from timeline visualization foundations through client and deliverable management, then adds lightweight note-taking and mobile polish. Architecture prioritizes visual-first accessibility and performance from day one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Timeline MVP** - Timeline visualization with mock data, accessibility foundations ✅
- [x] **Phase 2: Client Cards & Detail Views** - Navigation and contact management ✅
- [x] **Phase 3: Deliverables & Calls Management** - CRUD operations for timeline items ✅
- [x] **Phase 4: Text Notes & Files** - Documents (briefs, reports PLAUD, notes) ✅
- [x] **Phase 3.7: Code Quality & Refactoring** - Clean architecture before Mobile ✅
- [ ] **Phase 5: Mobile & Polish** - Responsive design and performance optimization
- [ ] **Phase 6: Vue Comptabilite / Facturation** - Vue dediee tresorerie avec sélecteur année, KPIs, detail par client, histogramme mensuel
- [ ] **Phase 9: Retroplanning IA** - Génération automatique de retroplanning par l'IA à partir du brief client, vue Gantt dans la fiche client
- [x] **Phase 7: Supabase & Persistence** - BDD réelle, store branché Supabase, auth, migrations ✅
- [x] **Phase 7.1: Security (Auth + RLS)** - Login, RLS tables, middleware ✅
- [x] **Phase 7.2: Admin & Permissions** - user_roles, Compta/Settings réservés admins, champs prix masqués members ✅

## Phase Details

### Phase 1: Foundation & Timeline MVP ✅
**Goal**: Users can view horizontal timeline showing all clients, deliverables, and calls with clear visual distinction between prospects and active clients
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, TIME-01, TIME-02, TIME-03, TIME-04
**Success Criteria** (what must be TRUE):
  1. ✅ User sees horizontal timeline as primary interface displaying 10+ mock clients
  2. ✅ User can view deliverables and calls positioned on timeline with their dates
  3. ✅ User can distinguish prospects from active clients through visual indicators (C/P badges)
  4. ✅ Timeline loads with 5-10 sample clients and remains performant (< 2 seconds render)
  5. ✅ Interface is dyslexia-friendly with generous spacing, clear typography, minimal text
**Completed**: 2026-02-13

**Extras delivered (not in original scope):**
- Time-based vertical positioning (items show at their scheduled hour)
- 3-month horizontal scroll with 7-day visible view
- Team member assignment to deliverables/calls with avatar display
- Editorial/Industrial dark theme design with neon accents
- Animated card transitions

Plans:
- [x] 01-01: Timeline MVP with mock data

### Phase 2: Client Cards & Detail Views ✅
**Goal**: Users can navigate between timeline overview and detailed client information with contact management
**Depends on**: Phase 1
**Requirements**: CLIENT-01, CLIENT-02, CLIENT-05, CLIENT-06
**Success Criteria** (what must be TRUE):
  1. ✅ User can view client cards on timeline showing name, status, and next deliverable
  2. ✅ User can click any client card to open detailed view
  3. ✅ User can add and view multiple contacts for a client (CRUD complet)
  4. ✅ User can navigate back to timeline from client detail view
**Completed**: 2026-02-13

**Extras delivered (not in original scope):**
- Timeline d'activité fusionnant tous les deliverables + calls triés par date
- Section Documents avec types (brief, report PLAUD, note)
- Modale de lecture des documents avec contenu complet
- Distinction visuelle passé/aujourd'hui/futur dans la timeline d'activité

Plans:
- [x] 02-01: Client detail view with navigation

### Phase 3: Deliverables & Calls Management ✅
**Goal**: Users can create, edit, and manage deliverables and calls that appear on the timeline
**Depends on**: Phase 2
**Requirements**: DELIV-01, DELIV-02, DELIV-03, DELIV-04, DELIV-05, DELIV-06
**Success Criteria** (what must be TRUE):
  1. ✅ User can create deliverable with name, due date, type, and status
  2. ✅ User can create call/meeting with date and time
  3. ✅ User can edit existing deliverables and calls
  4. ✅ User can mark deliverables as completed (toggle inline sur le badge de statut)
  5. ✅ User can view all deliverables and calls for a client in detail view
**Completed**: 2026-02-13

**Delivered:**
- Composant Modal générique réutilisable
- DeliverableForm : création/édition avec date, heure, type, statut, assignation
- CallForm : création/édition avec date, heure, durée, notes, assignation
- Toggle inline du statut (pending → in-progress → completed)
- Suppression avec confirmation dans les modales

Plans:
- [x] 03-01: CRUD Deliverables & Calls with modals

### Phase 4: Text Notes & Files (Documents) ✅
**Goal**: Users can attach and view documents (briefs, reports PLAUD, notes) to clients
**Depends on**: Phase 2
**Requirements**: CLIENT-03, CLIENT-04
**Success Criteria** (what must be TRUE):
  1. ✅ User can add documents to any client card
  2. ✅ User can view list of attached documents for a client
  3. ✅ User can open and read document content in modal view
  4. ✅ User can edit existing document content
**Completed**: 2026-02-13

**Delivered:**
- Documents avec 3 types : brief, report (PLAUD), note
- Liste des documents dans la fiche client
- Modale de lecture avec design adapté au type
- DocumentForm : création/édition avec type, titre, contenu
- Suppression de documents
- ContactForm : CRUD complet contacts client

Plans:
- [x] 04-01: Document viewing (list + modal)
- [x] 04-02: Document & Contact CRUD with modals

### Phase 3.7: Code Quality & Refactoring 🔧
**Goal**: Clean architecture, optimize performance, and eliminate technical debt before Mobile phase
**Depends on**: Phase 4
**Type**: INSERTED - Critical refactoring before Mobile adaptation
**Success Criteria** (what must be TRUE):
  1. ClientDetail.tsx decomposed into 5+ autonomous components (< 200 lines each)
  2. All modals centralized in single ModalManager component
  3. Timeline uses memoization for expensive calculations (useMemo, useCallback)
  4. Store has optimized selectors for filtered data
  5. Forms use react-hook-form + zod for validation
  6. No duplicate icon definitions (centralized in ui/Icons.tsx)
  7. Error handling implemented with user feedback
  8. Performance audit shows < 100ms render time for Timeline with 50 items

Plans:
- [x] 3.7-01: Day 1 - Decompose ClientDetail + Centralize Modals ✅
- [x] 3.7-02: Day 2 - Optimize Timeline + Store Selectors (sélecteurs store, date-utils, styles) ✅
- [x] 3.7-03: Day 3 - Refactor Forms + Error Handling (react-hook-form + Zod, error-handler) ✅

### Phase 5: Mobile & Polish
**Goal**: Application is fully responsive and optimized for mobile devices with excellent performance
**Depends on**: Phase 3.7
**Requirements**: MOBILE-01, MOBILE-02, MOBILE-03, MOBILE-04
**Success Criteria** (what must be TRUE):
  1. Timeline view adapts to mobile screens with horizontal scrolling and readable text
  2. All forms and client cards are usable on mobile devices
  3. Touch targets meet accessibility standards (44x44px minimum)
  4. Interface performs smoothly on mobile browsers
**Plans**: TBD

Plans:
- [ ] 05-01: [To be planned]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Timeline MVP | 1/1 | ✅ Complete | 2026-02-13 |
| 2. Client Cards & Detail Views | 1/1 | ✅ Complete | 2026-02-13 |
| 3. Deliverables & Calls Management | 1/1 | ✅ Complete | 2026-02-13 |
| 4. Text Notes & Files (Documents) | 2/2 | ✅ Complete | 2026-02-13 |
| 5. Mobile & Polish | 0/1 | 📋 Planned | - |
| 6. Vue Comptabilite | 0/2 | 📋 Planned | - |
| 7. Supabase & Persistence | 4/4 | ✅ Complete | Implémenté |
| 7.1. Security (Auth + RLS) | 1/1 | ✅ Complete | Implémenté |
| 7.2. Admin & Permissions | 1/1 | ✅ Complete | Implémenté |

### Phase 6: Vue Comptabilite / Facturation

**Goal**: Vue dediee pour la tresorerie annuelle (rentrees, depenses, marge, potentiel) avec selecteur d'annee, detail par client, et histogramme mensuel
**Depends on**: Phase 5
**Design**: Enhancement du ComptaView existant avec filtrage par annee et logique basee sur le statut des deliverables
**Plans:** 2 plans

Plans:
- [ ] 06-01-PLAN.md -- Store comptaYear + YearSelector + Rewrite ComptaView (KPIs, filtrage annee, tables par client)
- [ ] 06-02-PLAN.md -- MonthlyHistogram (donnees reelles) + integration + verification visuelle

### Phase 7: Supabase & Persistence ✅

**Goal**: Remplacer le mock par une base Supabase (PostgreSQL), rendre les données persistantes et l'app viable pour un usage quotidien
**Depends on**: Phase 4 (CRUD et seed.json en place = schéma clair)
**Completed**: Implémenté (store branché Supabase, migrations, auth)

**Success Criteria** (what must be TRUE):
  1. ✅ Projet Supabase créé, schéma DB (migrations 00001–00005)
  2. (Optionnel) Script seed JSON → Supabase
  3. ✅ Store (Zustand) branché Supabase : loadData + CRUD sur toutes les tables
  4. ✅ Écrans timeline, fiches client, compta fonctionnent avec les données en base
  5. ✅ Auth Supabase (login/signup, middleware, logout)

Plans:
- [x] 07-01: Setup Supabase & Schema ✅
- [ ] 07-02: Script seed JSON → Supabase (optionnel si données déjà en base)
- [x] 07-03: Store Zustand branché Supabase ✅
- [x] 07-04: Auth + middleware + pages login/signup ✅

**Plan détaillé**: `planning/PHASE-7-SUPABASE-PLAN.md` (créé 2026-02-14)

### Phase 7.1: Security (Auth + RLS) 🔐 ✅
**Goal**: Sécuriser l'app avec authentification Supabase et Row Level Security pour protéger les données en production
**Depends on**: Phase 7
**Type**: INSERTED - Sécurité critique avant déploiement production
**Completed**: Implémenté

**Success Criteria** (what must be TRUE):
  1. ✅ Auth Supabase (email/password), pages login/signup
  2. Users créés côté Supabase (jeremy@yam.agency, etc.)
  3. ✅ RLS sur les tables (middleware + redirect si non authentifié)
  4. ✅ LoginPage + auth guard (middleware)
  5. ✅ Bouton logout dans Header
  6. ✅ Session persistence (cookies @supabase/ssr)
  7. ✅ RLS "authenticated only" sur tables métier (migration 00006 appliquée via MCP)

Plans:
- [x] 7.1-01: Activer Auth + RLS + LoginPage + Tests ✅

**Plan détaillé**: `planning/PHASE-7.1-SECURITY-PLAN.md` (créé 2026-02-14)

### Phase 7.2: Admin & Permissions 🔐 ✅
**Goal**: Ajouter gestion des rôles (Admin vs Member) pour protéger les données financières
**Depends on**: Phase 7.1
**Type**: INSERTED - Protection données financières avant usage équipe
**Completed**: Implémenté

**Success Criteria** (what must be TRUE):
  1. ✅ Table user_roles (migration 00005_user_roles_and_compta_rls), trigger sync team → user_roles
  2. ✅ useUserRole (user_roles + fallback team.app_role), isAdmin / isMember
  3. ✅ Members : accès tout sauf Compta et champs prix
  4. ✅ RLS compta_monthly "Admins only", RLS user_roles (read all, update admins only)
  5. ✅ Onglet Compta + bouton Settings visibles uniquement pour admins (Header)
  6. ✅ Champs prix facturé / coût sous-traitance masqués dans DeliverableForm pour members
  7. ✅ Page /settings : liste user_roles, toggle admin/member (réservée admins), blocage accès non-admin
  8. ✅ ComptaView + page d'accueil : redirect ou écran "Accès refusé" si member tente compta

Plans:
- [x] 7.2-01: Admin vs Member avec protection compta ✅

**Plan détaillé**: `planning/PHASE-7.2-ADMIN-PLAN.md` (créé 2026-02-14)

### Phase 8: Web Brief Preview & Zoning

**Goal:** Preview visuelle des pages web-brief avec zoning/layout, gestion du menu et navigation (sous-menus, suppression), banque de layouts avec fallback visible, et édition robuste des sections
**Depends on:** Phase 4
**Requirements:** WBPZ-01, WBPZ-02, WBPZ-03, WBPZ-04, WBPZ-05, WBPZ-06, WBPZ-07, WBPZ-08, WBPZ-09, WBPZ-10
**Plans:** 3 plans

Plans:
- [x] 08-01-PLAN.md -- UUID migration + layout fallback system (foundation) ✅
- [x] 08-02-PLAN.md -- Navigation submenus + page delete + section DnD + section add/delete ✅
- [x] 08-03-PLAN.md -- Dynamic edit form + merged AI button + strategy context re-read ✅

### Phase 9: Retroplanning IA

**Goal:** Génération automatique de retroplanning par l'IA à partir du brief client (web brief ou autre). L'IA déduit les étapes et durées, propose un planning inversé depuis la deadline. Vue Gantt/Timeline dans la fiche client, édition drag & drop + formulaire. Usage interne uniquement.
**Depends on:** Phase 8
**Requirements:** RETRO-01, RETRO-02, RETRO-03, RETRO-04, RETRO-05, RETRO-06, RETRO-07, RETRO-08
**Plans:** 1/2 plans executed

Plans:
- [ ] 09-01-PLAN.md -- Types + migration Supabase + store CRUD + endpoint IA + utilitaire dates
- [ ] 09-02-PLAN.md -- Gantt CSS Grid + RetroplanningSection + formulaire edition + integration ClientDetail + wiki

---
*Roadmap created: 2026-02-13*
*Phases 1-4 completed: 2026-02-13*
*Phase 3.7 refactoring: 93% complete (2026-02-14)*
*Phase 6 added: 2026-02-14 -- Vue Comptabilite/Facturation*
*Phase 7 added: Supabase & Persistence -- rendre l'app viable avec BDD reelle*
*Phase 7 detailed plan created: 2026-02-14 (4 jours, 14-18h)*
*Phase 7.1 added: 2026-02-14 -- Security (Auth + RLS) pour production (2-3h)*
*Phase 7.2 added: 2026-02-14 -- Admin & Permissions (2 roles) pour protection compta (4-5h)*
*Phase 7, 7.1, 7.2 marquees completes apres verification code (store Supabase, auth, user_roles, RLS, Settings, masquage prix).*
*2026-02-15: RLS Phase 7.1 finalise -- migration 00006_authenticated_only_rls appliquee via MCP Supabase (tables metier en authenticated only).*
*2026-02-15: Phase 6 planned -- 2 plans (06-01: store+year+KPIs+tables, 06-02: histogram+verification)*
*2026-02-22: Phase 8 Plan 02 complété -- LayoutNavbar submenus, children page tabs, page delete, @hello-pangea/dnd section reorder with grip handles, section add/delete*
*2026-02-22: Phase 8 Plan 03 complété -- dynamic edit form (inferFieldType), merged AI button "IA ◆", strategy context wired to rewrite API*
