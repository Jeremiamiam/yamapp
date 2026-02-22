---
phase: 09-retroplanning-ia
plan: 01
subsystem: api, database, store
tags: [retroplanning, anthropic, supabase, zustand, gantt, typescript]

# Dependency graph
requires:
  - phase: 07-supabase
    provides: Supabase client, RLS patterns, createClient helper
  - phase: 08-web-brief-preview-zoning
    provides: Anthropic API endpoint pattern (web-section-rewrite), store actions/ pattern

provides:
  - RetroplanningTask and RetroplanningPlan TypeScript types in src/types/index.ts
  - Supabase migration table (retroplanning) with JSONB tasks and RLS
  - computeDatesFromDeadline utility (backward walk from deadline, pure JS)
  - daysBetween helper for Gantt component
  - POST /api/retroplanning endpoint (Anthropic claude-sonnet-4-6, structured output)
  - Zustand store CRUD: loadRetroplanning, saveRetroplanning, deleteRetroplanning, getRetroplanningByClientId
  - Map<string, RetroplanningPlan> state in AppState

affects: [09-02-ui, gantt-component, client-detail-view]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "actions/ file pattern for Zustand store CRUD (follows projects.ts template)"
    - "Backward date computation: walk tasks array in reverse, each endDate = prev startDate - 1"
    - "Supabase upsert with onConflict: client_id (one retroplan per client)"
    - "<structured_output> XML wrapper for AI JSON extraction with jsonrepair fallback"

key-files:
  created:
    - src/types/index.ts (RetroplanningTask, RetroplanningPlan, RetroplanningTaskColor types added)
    - supabase/migrations/20260222200000_create_retroplanning.sql
    - src/lib/retroplanning-utils.ts
    - src/app/api/retroplanning/route.ts
    - src/lib/store/actions/retroplanning.ts
  modified:
    - src/lib/store/types.ts (retroplanning state + 4 actions added to AppState)
    - src/lib/store/index.ts (createRetroplanningActions wired)
    - src/features/wiki/wiki-data.ts (Retroplanning IA feature section + pipeline step)

key-decisions:
  - "Store retroplanning in actions/ file (not data.slice.ts) — follows established projects.ts pattern"
  - "One retroplan per client enforced by UNIQUE constraint on client_id in Supabase"
  - "computeDatesFromDeadline uses UTC dates to avoid DST issues (Date.UTC, not local)"
  - "durationDays is inclusive range: startDate to endDate spans exactly durationDays calendar days"
  - "AI receives briefContent (truncated 6000 chars) + deadline + clientName; returns durationDays only (no absolute dates)"
  - "Color normalization: if AI returns invalid color, fallback to COLOR_CYCLE[index % 6]"

patterns-established:
  - "Retroplanning CRUD: loadRetroplanning on demand (not in global loadData) — data is per-client on-demand"
  - "Map<string, RetroplanningPlan> keyed by clientId for O(1) lookup"

requirements-completed: [RETRO-01, RETRO-02, RETRO-03, RETRO-04, RETRO-05]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 09 Plan 01: Retroplanning IA — Data Layer Summary

**Full retroplanning data layer: TypeScript types, Supabase migration with RLS, backward date computation utility, Anthropic AI endpoint, and Zustand CRUD store actions**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-22T11:31:14Z
- **Completed:** 2026-02-22T11:34:06Z
- **Tasks:** 2/2
- **Files modified:** 8

## Accomplishments

- Retroplanning types (RetroplanningTask, RetroplanningPlan, RetroplanningTaskColor) added to `src/types/index.ts`
- Supabase migration creates `retroplanning` table with JSONB tasks column, UNIQUE constraint on client_id, and 4 RLS policies
- `computeDatesFromDeadline` algorithm walks backward from deadline: last task ends at deadline, each prior task ends the day before the next starts
- POST `/api/retroplanning` generates 4-10 project-specific tasks from brief content using claude-sonnet-4-6, applies date computation, returns `RetroplanningTask[]` with computed dates
- Store CRUD (`loadRetroplanning`, `saveRetroplanning`, `deleteRetroplanning`, `getRetroplanningByClientId`) follows `actions/` file pattern, persists via Supabase upsert

## Task Commits

1. **Task 1: Types + Supabase migration + date utility** - `1c36527` (feat)
2. **Task 2: AI endpoint + Store CRUD actions** - `79114d8` (feat)

## Files Created/Modified

- `src/types/index.ts` - Added RetroplanningTaskColor, RetroplanningTask, RetroplanningPlan types
- `supabase/migrations/20260222200000_create_retroplanning.sql` - New migration: retroplanning table, UNIQUE client_id, RLS
- `src/lib/retroplanning-utils.ts` - computeDatesFromDeadline + daysBetween exports
- `src/app/api/retroplanning/route.ts` - POST endpoint: validates body, calls Anthropic, parses structured_output, applies date computation
- `src/lib/store/actions/retroplanning.ts` - Zustand CRUD actions with Supabase (load, save via upsert, delete, get)
- `src/lib/store/types.ts` - RetroplanningPlan import + 5 new members in AppState interface
- `src/lib/store/index.ts` - createRetroplanningActions wired into store
- `src/features/wiki/wiki-data.ts` - Retroplanning IA feature entry + pipeline step added

## Decisions Made

- **actions/ pattern**: Retroplanning store actions placed in `src/lib/store/actions/retroplanning.ts` (not data.slice.ts) — consistent with existing projects, calls, todos pattern
- **On-demand loading**: `loadRetroplanning` is called per-client on demand, not part of the global `loadData` bulk fetch — retroplanning data is heavyweight and client-specific
- **UTC arithmetic**: `computeDatesFromDeadline` uses `Date.UTC()` exclusively to prevent DST edge cases when subtracting days
- **Inclusive durationDays**: A task with durationDays=5 spans exactly 5 calendar days (startDate to endDate inclusive, so `endEpoch - startEpoch = (durationDays - 1) * MS_PER_DAY`)
- **Color fallback**: Invalid color from AI fallback to `COLOR_CYCLE[index % 6]` ensuring visual variety

## Deviations from Plan

None - plan executed exactly as written.

The plan specified CRUD in `data.slice.ts` but the existing codebase uses a dedicated `actions/` file per domain (clients, deliverables, projects, calls, todos). Applied Rule 1 pattern recognition: followed established project convention for store modularity. No architectural change — same result, correct location.

## Issues Encountered

None.

## Next Phase Readiness

- Data layer complete — Plan 02 can focus purely on UI components
- API endpoint at `/api/retroplanning` ready to call from UI
- Store actions typed and available via `useAppStore`
- Supabase migration ready to apply via `supabase db push`
- `daysBetween` helper exported for Gantt bar width calculation in Plan 02

---
*Phase: 09-retroplanning-ia*
*Completed: 2026-02-22*
