# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Avoir une vue d'ensemble claire de tous les clients et deadlines en un coup d'œil, sans surcharge d'information.
**Current focus:** Git (remote, workflow) puis Phase 5/6 ; Supabase en dernier (Phase 7) — Phase 7 = rendre l’app viable avec BDD réelle

## Current Position

Phase: 5 (Mobile & Polish)
Status: Phases 1-4 complètes, CRUD fonctionnel
Last activity: 2026-02-13 — CRUD complet implémenté

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: - min
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Roadmap Evolution

- Phase 6 added: Vue Comptabilité/Facturation — vue dédiée (comme Clients, Calendrier) avec CA, dépenses, marge, histogramme mensuel
- Phase 7 added: Supabase & Persistence — BDD réelle, seed depuis JSON, store branché API, rendre l’app viable

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Mock data avant vraie persistence: Valider layout, navigation et utilité avant d'investir dans le backend
- Timeline horizontale (pas calendrier grid): Besoin de voir flux temporel des rendus, pas planning détaillé
- Distinction Prospect/Client: Statut commercial important pour l'équipe (badges C/P)
- Pas d'images dans fiches: Rester sobre et focus sur l'info essentielle
- Design Editorial/Industrial: Thème sombre avec accents néon, typo Syne + Instrument Sans
- Vue 7 jours + scroll 3 mois: Timeline affiche 7 jours en full-width, scrollable pour voir 3 mois
- Positionnement horaire: Cards positionnées verticalement selon l'heure du RDV/deadline
- Assignation équipe: TeamMember avec rôles (founder/employee/freelance) assignables aux tasks
- Fiche client: Navigation timeline ↔ detail view via Zustand state
- Timeline d'activité: Fusion deliverables + calls triés chronologiquement dans fiche client
- Documents: 3 types (brief, report PLAUD, note) avec modale de lecture
- Modale documents: ESC pour fermer, backdrop click, contenu adapté au type
- CRUD via modales: Choix validé pour contacts, documents, deliverables, calls
- Composant Modal générique: Réutilisable avec header, footer, tailles configurables
- Toggle inline statut: Clic sur badge pour cycler pending → in-progress → completed
- Formulaires avec validation: Champs requis, format email, messages d'erreur

### Pending Todos

- [x] CRUD contacts (ajouter/modifier contacts client) ✅
- [x] CRUD documents (créer/modifier briefs, reports, notes) ✅
- [x] CRUD deliverables (créer/modifier livrables depuis fiche client) ✅
- [x] CRUD calls (créer/modifier appels depuis fiche client) ✅

**Phase 5 - À faire:**
- [ ] Responsive mobile (timeline, fiche client, modales)
- [ ] Touch targets 44x44px minimum
- [ ] Performance sur mobile

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-13
Stopped at: Phases 1-4 complètes, CRUD fonctionnel
Resume file: None

## What's Next (Phase 5)

**Mobile & Polish:**
1. Responsive timeline (scroll horizontal touch-friendly)
2. Fiche client adaptée mobile (stack vertical)
3. Modales plein écran sur mobile
4. Touch targets 44x44px minimum
5. Test performance sur devices réels

**Phase 7 — Supabase & Persistence (dernière étape) :**
- Ajoutée au roadmap : BDD Supabase alignée sur `seed.json`, store branché sur l’API, seed depuis JSON. On y vient en dernier, après Git, Mobile, Compta.

**Optionnel / Nice to have:**
- PWA / Installation mobile
- Notifications push

---
*State initialized: 2026-02-13*
*Updated: 2026-02-13 — Phases 1-4 ✅ CRUD complet*