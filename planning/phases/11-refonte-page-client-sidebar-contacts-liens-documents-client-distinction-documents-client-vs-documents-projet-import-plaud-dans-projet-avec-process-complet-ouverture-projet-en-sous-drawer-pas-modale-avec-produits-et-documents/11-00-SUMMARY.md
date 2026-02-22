---
phase: 11-refonte-page-client
plan: 00
subsystem: ui
tags: proto, layout, client-detail, nextjs, react

requires: []
provides:
  - Page proto /proto/client-detail-v2 avec layout sidebar + main + ProjectDrawer
  - Bouton "Voir proto" dans ClientsList et ClientDetail
affects: 11-02 (migration layout)

tech-stack:
  added: []
  patterns: Proto page autonome avec mock data (pas de store)

key-files:
  created: src/app/proto/client-detail-v2/page.tsx
  modified: src/features/clients/components/ClientsList.tsx, src/features/clients/components/ClientDetail.tsx

key-decisions:
  - "Proto page autonome avec mock data (useState) pour valider layout sans toucher au store"
  - "Bouton 'Voir proto' discret (text-[10px], violet) dans header ClientsList et ClientDetail"

requirements-completed: []

duration: ~15 min
completed: 2026-02-23
---

# Phase 11 Plan 00: Page Proto Layout Summary

**Page proto client-detail-v2 avec layout Phase 11 (sidebar fixe + main + ProjectDrawer) et accès via "Voir proto"**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2
- **Files modified:** 3 (1 créé, 2 modifiés)

## Accomplishments

- Page `/proto/client-detail-v2` avec layout cible : sidebar (contacts, liens, documents, retro) + zone principale (projets, produits groupés)
- ProjectDrawer proto slide-in au clic projet, affiche produits et documents du projet
- Bouton "Voir proto" dans ClientsList (header) et ClientDetail (barre contextuelle)
- Mock data réaliste : 2 projets, 5 produits, 2 contacts, 2 liens, 2 docs client, docs projet

## Files Created/Modified

- `src/app/proto/client-detail-v2/page.tsx` — Page proto complète avec mock data
- `src/features/clients/components/ClientsList.tsx` — Link "Voir proto" dans header
- `src/features/clients/components/ClientDetail.tsx` — Link "Voir proto" à côté du bouton Modifier

## Decisions Made

- Proto autonome : mock data en local, pas de store Zustand
- Réutilisation des styles existants (var(--bg-primary), border-subtle, etc.)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Layout proto validable — tester /proto/client-detail-v2
- Ready for 11-01 (migration project_id) et 11-02 (migration layout proto → ClientDetail)

---
*Phase: 11-refonte-page-client*
*Completed: 2026-02-23*
