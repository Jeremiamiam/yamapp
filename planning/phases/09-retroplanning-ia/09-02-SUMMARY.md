---
phase: 09-retroplanning-ia
plan: 02
subsystem: ui, components, wiki
tags: [retroplanning, gantt, drag-and-drop, pointer-events, css-grid, typescript, wiki]

# Dependency graph
requires:
  - phase: 09-retroplanning-ia
    plan: 01
    provides: RetroplanningTask/RetroplanningPlan types, store CRUD (loadRetroplanning, saveRetroplanning, deleteRetroplanning), /api/retroplanning endpoint, daysBetween utility

provides:
  - RetroplanningSection component (generate button, deadline input, empty states, Gantt + form integration)
  - RetroplanningGantt component (CSS Grid Gantt, drag-move, resize-right, today indicator)
  - RetroplanningTaskForm component (inline edit form: label/dates/color, auto durationDays)
  - ClientDetail integration (full-width row below the 3-col grid)
  - Wiki: RETROPLANNING_AGENTS array, CalendarRangeIcon, RetroplanningAgentsSection

affects: [client-detail-view, wiki-view]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS Grid Gantt: gridTemplateColumns: repeat(totalDays, 1fr) — each column = 1 calendar day"
    - "Pointer events drag-move: setPointerCapture for capture across boundaries"
    - "Resize via thin right-edge handle with e.stopPropagation() to avoid triggering move"
    - "Preview state pattern: local previewTask state avoids full store re-render on each drag move"
    - "Clamp delta: ensure bars cannot move before projectStart or after deadline"
    - "Brief extraction: web-brief JSON → essential fields only; plain docs → first 4000 chars"

key-files:
  created:
    - src/features/clients/components/RetroplanningTaskForm.tsx
    - src/features/clients/components/RetroplanningGantt.tsx
    - src/features/clients/components/sections/RetroplanningSection.tsx
  modified:
    - src/features/clients/components/sections/index.ts (export RetroplanningSection added)
    - src/features/clients/components/ClientDetail.tsx (import + full-width row)
    - src/features/wiki/wiki-data.ts (RETROPLANNING_AGENTS array added)
    - src/features/wiki/components/WikiView.tsx (CalendarRangeIcon, ICON_MAP, RetroplanningAgentsSection, nav chip)

key-decisions:
  - "CSS Grid Gantt (not a library): gridTemplateColumns repeat(totalDays, 1fr) gives pixel-perfect day columns with no dependency"
  - "Pointer events for drag (not @hello-pangea/dnd): plan explicitly required onPointerDown/Move/Up pattern"
  - "Preview state local to Gantt: previewTask useState avoids calling saveRetroplanning on every pointer move"
  - "Click detection via hasMoved flag: click fires only if pointer did not move during drag"
  - "Brief extraction: web-brief JSON parsed to extract only architecture essentials and homepage section roles — stays under 6000 char limit"
  - "Month segments computed forward: walk from projectStart to totalDays, each segment = days until end of month capped by remaining"

requirements-completed: [RETRO-06, RETRO-07, RETRO-08]

# Metrics
duration: 4min
completed: 2026-02-22
---

# Phase 09 Plan 02: Retroplanning IA — Gantt UI Summary

**CSS Grid Gantt with pointer-event drag-move and resize, RetroplanningSection wired to ClientDetail, wiki updated with agent + icon**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-22T11:38:10Z
- **Completed:** 2026-02-22T11:42:26Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- `RetroplanningTaskForm`: inline form (not modal) with label, startDate, endDate, auto-computed durationDays, 6-color selector, Enregistrer/Annuler buttons
- `RetroplanningGantt`: CSS Grid chart (`gridTemplateColumns: repeat(totalDays, 1fr)`), month-label header, week grid lines, today red indicator, drag-move via pointer capture, right-edge resize handle, click detection with `hasMoved` guard
- `RetroplanningSection`: main container — loads retroplanning on mount, extracts brief content (web-brief JSON parsing + plain text truncation), POSTs to `/api/retroplanning`, calls `saveRetroplanning`, renders Gantt + inline edit form. Two empty states: no-brief ("Ajoutez un brief d'abord") and has-brief (deadline date input + generate button). Has-plan header shows deadline, Regénérer and Supprimer actions.
- `ClientDetail`: imports `RetroplanningSection`, renders full-width `<div className="mt-6">` below the 3-col grid, inside the `max-w-5xl` container
- Wiki: `RETROPLANNING_AGENTS` array added to `wiki-data.ts`; `CalendarRangeIcon` SVG added to `WikiView.tsx`; `calendar-range` added to `ICON_MAP`; `RetroplanningAgentsSection` component added; nav chip "Retroplanning IA" added

## Task Commits

1. **Task 1: RetroplanningSection + RetroplanningGantt + RetroplanningTaskForm** - `62b8faf` (feat)
2. **Task 2: ClientDetail integration + wiki update** - `42f975e` (feat)

## Files Created/Modified

- `src/features/clients/components/RetroplanningTaskForm.tsx` (new, 116 lines)
- `src/features/clients/components/RetroplanningGantt.tsx` (new, 286 lines)
- `src/features/clients/components/sections/RetroplanningSection.tsx` (new, 276 lines)
- `src/features/clients/components/sections/index.ts` (export added)
- `src/features/clients/components/ClientDetail.tsx` (import + row added)
- `src/features/wiki/wiki-data.ts` (RETROPLANNING_AGENTS array)
- `src/features/wiki/components/WikiView.tsx` (icon + section + nav chip)

## Decisions Made

- **CSS Grid Gantt**: `gridTemplateColumns: repeat(totalDays, 1fr)` gives each day an equal column. Bar positions computed as `colStart = daysBetween(projectStart, task.startDate)` (1-based). This avoids absolute pixel math and resizes naturally with the container.
- **Pointer capture pattern**: `e.currentTarget.setPointerCapture(e.pointerId)` ensures pointer moves outside the bar are still tracked — standard DOM drag approach without external libs
- **Preview state local to component**: `useState<RetroplanningTask | null>` for the dragging preview, flushed to store only on `pointerup`. Avoids O(n) store writes on every move event.
- **`hasMoved` flag**: prevents click handler firing after drag — set to `true` on first non-zero delta, checked in `handleBarClick`
- **Brief extraction**: web-brief JSON parsed to extract `architecture.{site_type,primary_objective,target_visitor}` and homepage section `{role,intent}` arrays. Plain text documents truncated to 4000 chars each. Total capped at 6000 chars for API call.
- **Color-mix for bar background**: bar background uses CSS `color-mix(in srgb, {color} 25%, transparent)` via string replacement — avoids hardcoded opacity hex values for each accent color

## Deviations from Plan

None - plan executed exactly as written.

The wiki already had the `retroplanning` feature section and pipeline step from Plan 01. Plan 02 required adding `RETROPLANNING_AGENTS` and integrating the feature card icon. Added `CalendarRangeIcon` to `ICON_MAP` (CLAUDE.md requirement: "Si tu ajoutes une nouvelle icône pour une feature, ajoute-la aussi dans ICON_MAP") and added a full `RetroplanningAgentsSection` component following the pattern of `PlaudAgentsSection` and `WebBriefAgentsSection`.

## Issues Encountered

None.

## Verification

- `npx tsc --noEmit` passes with zero errors
- All required files created at or above minimum line counts
- `RetroplanningSection` pattern matches `key_links` specified in plan frontmatter:
  - `fetch('/api/retroplanning', ...)` present
  - `saveRetroplanning(...)` called after AI response and after task edit
  - `onPointerDown` present in `RetroplanningGantt`
  - `RetroplanningSection` imported and rendered in `ClientDetail`

---
*Phase: 09-retroplanning-ia*
*Completed: 2026-02-22*

## Self-Check: PASSED
