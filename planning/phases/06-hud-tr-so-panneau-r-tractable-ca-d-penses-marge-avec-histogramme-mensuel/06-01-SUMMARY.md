---
phase: 06-compta
plan: 01
subsystem: ui
tags: [react, zustand, year-filtering, compta, deliverables, status-based-logic]

# Dependency graph
requires:
  - phase: 07-supabase
    provides: Supabase store integration with deliverables data
  - phase: 07.2-admin-member
    provides: Admin role checks for ComptaView access
provides:
  - Year-based filtering for comptability view (comptaYear state)
  - Status-based KPI calculation (completed = rentrées, pending/in-progress = potentiel)
  - Year selector component with navigation bounds
  - Client-grouped tables for rentrées and potentiel
affects: [06-02-histogram, 06-03-payments, 06-04-expenses]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Year-based deliverable filtering by dueDate
    - Status-based categorization (completed vs pending/in-progress)
    - Computed KPIs via useMemo (no derived state in store)

key-files:
  created:
    - src/features/compta/components/YearSelector.tsx
  modified:
    - src/lib/store.ts
    - src/features/compta/components/ComptaView.tsx
    - src/features/compta/components/index.ts

key-decisions:
  - "Use deliverable status field (completed, pending, in-progress) instead of isPotentiel flag for categorization"
  - "Filter by dueDate year (exclude backlog items with no dueDate)"
  - "Compute KPIs in component via useMemo (avoid storing derived data in Zustand)"
  - "Year selector bounds: 2020 to current+2"

patterns-established:
  - "Year filtering: deliverables.filter(d => new Date(d.dueDate).getFullYear() === comptaYear)"
  - "Status-based logic: completed = rentrées, pending|in-progress = potentiel"
  - "Prospect indicator: client.status === 'prospect' shows (P) badge"

# Metrics
duration: 2min 42s
completed: 2026-02-15
---

# Phase 06 Plan 01: Year-based Filtering Summary

**Year-based deliverable filtering with status-driven KPIs (completed = rentrées, pending/in-progress = potentiel) and arrow-based year selector**

## Performance

- **Duration:** 2min 42s
- **Started:** 2026-02-15T11:19:27Z
- **Completed:** 2026-02-15T11:22:09Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added comptaYear state to Zustand store with setComptaYear action
- Created YearSelector component with arrow navigation (< 2026 >), bounds 2020 to current+2
- Rewrote ComptaView to filter deliverables by selected year's dueDate
- Implemented status-based KPI logic: completed = rentrées validées, pending/in-progress = potentiel
- Split client detail sections: "Rentrées par client" (completed) and "Potentiel par client" (pending/in-progress)
- Added prospect indicator (P badge) in potentiel client rows
- Removed old isPotentiel flag usage and comptaMonthly mock histogram

## Task Commits

Each task was committed atomically:

1. **Task 1: Add comptaYear state to Zustand store** - `fc53bf8` (feat)
2. **Task 2: Create YearSelector component** - `0c639ef` (feat)
3. **Task 3: Rewrite ComptaView with year filtering and status-based KPIs** - `19739de` (feat)

## Files Created/Modified

- `src/lib/store.ts` - Added comptaYear (number, defaults to current year) and setComptaYear action
- `src/features/compta/components/YearSelector.tsx` - Arrow-based year navigation component with disabled bounds
- `src/features/compta/components/ComptaView.tsx` - Complete rewrite with year filtering, status-based KPIs, two client sections (rentrées + potentiel), prospect indicators
- `src/features/compta/components/index.ts` - Export YearSelector

## Decisions Made

- **Status-based categorization:** Use deliverable `status` field (completed, pending, in-progress) instead of `isPotentiel` flag. Aligns with existing status workflow and provides clearer business logic.
- **Year filtering by dueDate:** Only include deliverables with a dueDate in the selected year. Backlog items (no dueDate) are excluded as they cannot be attributed to a specific year.
- **Computed KPIs in component:** Use useMemo for all derived calculations (totalFacturé, totalPotentiel, byClientCompleted) instead of storing in Zustand. Follows research guidance: "don't store derived data in Zustand."
- **Year selector bounds:** Min 2020, Max current year + 2. Provides reasonable historical access and near-future planning window.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Year filtering foundation complete and working
- Status-based KPI logic validated (completed = rentrées, pending/in-progress = potentiel)
- Ready for Plan 06-02: Monthly histogram implementation
- Ready for Plan 06-03: Payments/income tracking
- Ready for Plan 06-04: Expenses tracking (freelances, fixed costs)
- All downstream Phase 6 features can build on this year-filtered data foundation

## Self-Check: PASSED

All files created and commits verified:
- Created: YearSelector.tsx
- Modified: store.ts, ComptaView.tsx, index.ts
- Commits: fc53bf8, 0c639ef, 19739de

---
*Phase: 06-compta*
*Completed: 2026-02-15*
