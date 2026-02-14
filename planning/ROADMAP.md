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
- [ ] **Phase 6: Vue Comptabilité / Facturation** - Vue dédiée trésorerie (CA, dépenses, marge) avec histogramme mensuel
- [ ] **Phase 7: Supabase & Persistence** - BDD réelle, données viables (dernière étape du roadmap)

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
| 6. Vue Comptabilité | 0/4 | 📋 Planned | - |
| 7. Supabase & Persistence | 0/4 | 📋 Planned | - |
| 7.1. Security (Auth + RLS) | 0/1 | 📋 Planned | - |

### Phase 6: Vue Comptabilité / Facturation

**Goal**: Avoir une vue dédiée pour la trésorerie (CA, dépenses, marge), au même niveau que "Calendrier" et "Clients" dans la navigation
**Depends on**: Phase 5
**Design**: Nouvelle vue "Comptabilité" ou "Facturation" dans la barre de nav (comme Calendrier, Clients)

**Success Criteria** (what must be TRUE):
  1. Onglet/icône "Comptabilité" ou "Facturation" dans le Header, à côté de Calendrier et Clients
  2. Vue affiche 3 KPIs instantanés (période configurable ex: Janvier–Décembre) :
     - **Total Facturé** (encaissé + à venir) 🟢
     - **Total Dépensé** (freelances + charges) 🔴
     - **Marge Nette** (reste dans ta poche) 🔵
  3. **Entrées** : somme des milestones "gommettes" (acomptes/soldes), avec nuance :
     - Sécurisé (Vert/Payé) vs Théorique (Gris/Prévu) — ex: "CA Annuel : 120k€ (dont 40k€ déjà en banque)"
  4. **Sorties** : variables (freelances liés aux projets) + fixes (paramétrage "Coûts Fixes Mensuels", ex: 2000€ × 12)
  5. **Histogramme mensuel** : 2 barres par mois (vert = entrées, rouge = sorties) + ligne courbe du solde cumulé (rouge si < 0 = alerte découvert)

Plans:
- [ ] 06-01: Vue Comptabilité (navigation + layout, comme Clients)
- [ ] 06-02: Calcul CA (entrées milestones + nuance payé/prévu)
- [ ] 06-03: Sorties (variables freelances + coûts fixes paramétrables)
- [ ] 06-04: Histogramme mensuel (barres + courbe tréso cumulée)

### Phase 7: Supabase & Persistence

**Goal**: Remplacer le mock par une base Supabase (PostgreSQL), rendre les données persistantes et l’app viable pour un usage quotidien
**Depends on**: Phase 4 (CRUD et seed.json en place = schéma clair)
**Note**: Peut être faite après Phase 5/6 ou en parallèle selon priorité (viabilité vs mobile/compta)

**Success Criteria** (what must be TRUE):
  1. Projet Supabase créé, schéma DB aligné sur `seed.json` (team, clients, contacts, client_links, documents, deliverables, calls)
  2. Seed initial : script qui charge `src/lib/seed.json` (ou export) et insère en base
  3. Store (Zustand) branché sur Supabase : lecture/écriture via client Supabase au lieu des tableaux mock
  4. Les écrans existants (timeline, fiches client, compta) fonctionnent avec les données en base
  5. (Optionnel) Auth Supabase pour protéger l’app

Plans:
- [ ] 07-01: Setup Supabase & Schema (Jour 1 - 3-4h)
- [ ] 07-02: Script seed JSON → Supabase (Jour 2 - 3-4h)
- [ ] 07-03: Adapter store Zustand pour Supabase (Jour 3 - 5-6h)
- [ ] 07-04: Tests CRUD complet & Polish (Jour 4 - 3-4h)

**Plan détaillé**: `planning/PHASE-7-SUPABASE-PLAN.md` (créé 2026-02-14)
**Guide Cursor**: `planning/PHASE-7-CURSOR-GUIDE.md` (prompts prêts à l'emploi)

### Phase 7.1: Security (Auth + RLS) 🔐
**Goal**: Sécuriser l'app avec authentification Supabase et Row Level Security pour protéger les données en production
**Depends on**: Phase 7
**Type**: INSERTED - Sécurité critique avant déploiement production
**Success Criteria** (what must be TRUE):
  1. Auth Supabase activé (email/password)
  2. Users créés pour l'agence (jeremy@yam.agency, etc.)
  3. RLS activé sur 8 tables avec policies "authenticated users only"
  4. LoginPage fonctionnelle avec design cohérent
  5. Auth guard dans app (redirect login si non authentifié)
  6. Bouton logout dans Header
  7. Session persistence fonctionne
  8. RLS bloque accès non authentifié (testé)

Plans:
- [ ] 7.1-01: Activer Auth + RLS + LoginPage + Tests (2-3h)

**Plan détaillé**: `planning/PHASE-7.1-SECURITY-PLAN.md` (créé 2026-02-14)
**Guide Cursor**: `planning/PHASE-7.1-CURSOR-GUIDE.md` (prompts prêts à l'emploi)

---
*Roadmap created: 2026-02-13*
*Phases 1-4 completed: 2026-02-13*
*Phase 3.7 refactoring: 93% complete (2026-02-14)*
*Phase 6 added: 2026-02-14 — Vue Comptabilité/Facturation*
*Phase 7 added: Supabase & Persistence — rendre l'app viable avec BDD réelle*
*Phase 7 detailed plan created: 2026-02-14 (4 jours, 14-18h)*
*Phase 7.1 added: 2026-02-14 — Security (Auth + RLS) pour production (2-3h)*
*Next: Phase 7 (Supabase) → Phase 7.1 (Security) → Phase 5 (Mobile) ou Phase 6 (Compta)*
