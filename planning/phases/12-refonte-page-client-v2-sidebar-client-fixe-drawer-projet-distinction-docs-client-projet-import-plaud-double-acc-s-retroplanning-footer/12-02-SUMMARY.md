---
phase: 12-refonte-page-client-v2
plan: 02
subsystem: ui
tags: [react, zustand, tailwind, client-detail, sidebar, projects, retroplanning]

# Dependency graph
requires:
  - phase: 12-01
    provides: ClientDocument.projectId field, addDocument(projectId) store action, openReportUploadModal(projectId)

provides:
  - ClientSidebarSection: sidebar fixe contacts + liens + docs client filtrés (!projectId)
  - ProjectsListSection: grille de cards projet cliquables avec badge facturation et progress bar
  - ClientDetailV2: layout sidebar fixe + zone projets + footer retroplanning full-width + breadcrumb
  - ClientDetail délègue à ClientDetailV2 (routing Zustand inchangé)

affects:
  - 12-03: ProjectDrawer s'intègre dans la zone main de ClientDetailV2 (placeholder déjà en place)
  - 12-04: Import PLAUD depuis projet utilise openReportUploadModal(clientId, projectId)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sidebar fixe w-72/xl:w-80 avec overflow-y-auto interne"
    - "Zone principale dimmée (opacity-30 + pointer-events-none) quand drawer ouvert"
    - "Breadcrumb inline avec state local selectedProjectId"
    - "DOC_TYPE_BADGE map pour badges colorés par type de document"

key-files:
  created:
    - src/features/clients/components/sections/ClientSidebarSection.tsx
    - src/features/clients/components/sections/ProjectsListSection.tsx
    - src/features/clients/components/ClientDetailV2.tsx
  modified:
    - src/features/clients/components/ClientDetail.tsx
    - src/features/clients/components/sections/index.ts

key-decisions:
  - "ClientDetail.tsx réduit à un simple wrapper qui rend ClientDetailV2 — routing Zustand inchangé"
  - "selectedProjectId est state local dans ClientDetailV2 (pas Zustand) — état éphémère"
  - "Zone projets dimmée (opacity-30) quand projet sélectionné — placeholder pour drawer Plan 03"
  - "Escape: désélectionne projet d'abord, navigateBack seulement si aucun projet sélectionné"
  - "ClientSidebarSection gère les liens en interne (pas via LinksSection existante) — style compact sidebar"

patterns-established:
  - "DOC_TYPE_BADGE: Record<DocumentType, {label, color, bg}> pour badges cohérents par type"
  - "SidebarSectionHeader: composant interne réutilisable pour headers de section sidebar"

requirements-completed: [CLV2-01, CLV2-07, CLV2-09]

# Metrics
duration: 4min
completed: 2026-02-22
---

# Phase 12 Plan 02: ClientDetailV2 Layout Summary

**Nouveau layout page client avec sidebar fixe (contacts/liens/docs client), zone principale projets avec cards facturation, et footer retroplanning full-width; ClientDetail délègue entièrement à ClientDetailV2**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-22T17:33:45Z
- **Completed:** 2026-02-22T17:36:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- ClientSidebarSection: sidebar fixe avec 3 sections (contacts, liens, docs client filtrés par !projectId), bouton Import PLAUD sans projectId, badges colorés par type de document
- ProjectsListSection: grille responsive de cards projet cliquables avec badge facturation (status/couleur depuis computeProjectBilling) et barre de progression
- ClientDetailV2: layout header + breadcrumb + (sidebar | zone projets) + footer retroplanning — selectedProjectId local avec dimming de la zone projets quand projet sélectionné
- ClientDetail.tsx simplifié à un wrapper de 3 lignes (routing Zustand inchangé)

## Task Commits

1. **Task 1: ClientSidebarSection + ProjectsListSection components** - `bd0e4a4` (feat)
2. **Task 2: ClientDetailV2 layout + ClientDetail delegates to V2** - `7b43f57` (feat)

## Files Created/Modified

- `src/features/clients/components/sections/ClientSidebarSection.tsx` — Sidebar fixe: contacts (openContactModal), liens (href external), docs client (filtrés !projectId + badge type + Import PLAUD)
- `src/features/clients/components/sections/ProjectsListSection.tsx` — Grille de cards projet: onClick onSelectProject, badge billing status, progress bar
- `src/features/clients/components/ClientDetailV2.tsx` — Layout principal: header retour+nom+badge, breadcrumb, aside w-72 + main + footer retroplanning
- `src/features/clients/components/ClientDetail.tsx` — Simplifié: délègue à ClientDetailV2
- `src/features/clients/components/sections/index.ts` — Exports des deux nouveaux composants ajoutés

## Decisions Made

- **ClientDetail comme wrapper pur:** Garde la compatibilité du routing Zustand (view 'client-detail' → ClientDetail → ClientDetailV2). Pas de changement dans page.tsx ni le store.
- **State local selectedProjectId:** État éphémère de navigation, pas besoin de Zustand. Plan 03 ajoutera le ProjectDrawer en utilisant ce même state.
- **Dimming opacity-30 + pointer-events-none:** Pattern proto validé pour signaler visuellement que la liste projets est "derrière" le drawer (Plan 03 le rendra réel).
- **Liens dans ClientSidebarSection (non réutilisation de LinksSection):** Le style compact de la sidebar (px-3, text-xs, no inline form) diffère du style card de LinksSection. Composant dédié plus propre.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Erreurs TypeScript pre-existantes dans `src/app/proto/client-detail-v2/page.tsx` et `src/features/clients/components/ProjectDrawer.tsx` (modules manquants `ProjectDrawerBillingTab`) — non liées à ce plan, non introduites par ce plan.

## Next Phase Readiness

- Plan 03 (ProjectDrawer) peut utiliser directement le placeholder commenté dans ClientDetailV2.tsx ligne ~119 et le state `selectedProjectId`
- Le pattern dimming (opacity-30) est déjà en place et fonctionnel
- openReportUploadModal(clientId) disponible depuis ClientSidebarSection pour Plan 04 (Import PLAUD double accès)

---
*Phase: 12-refonte-page-client-v2*
*Completed: 2026-02-22*
