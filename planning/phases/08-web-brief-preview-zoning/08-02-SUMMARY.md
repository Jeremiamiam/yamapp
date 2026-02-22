---
phase: 08-web-brief-preview-zoning
plan: 02
subsystem: web-brief-preview
tags: [dnd, drag-drop, navigation, submenu, section-crud, page-delete, hello-pangea]
dependency_graph:
  requires:
    - phase: 08-01
      provides: UUID-based section identity, ensureSectionIds, LayoutPlaceholder
  provides:
    - LayoutNavbar with hierarchical submenu dropdowns for nav items with children
    - Children page slugs flattened into pageTabs (navigable tabs in preview)
    - Page delete with full nav + pages data cleanup
    - Section drag & drop reorder via @hello-pangea/dnd with grip handles
    - Section add (default hero section) and delete with order recalculation
  affects:
    - 08-03 (dynamic edit form phase)
tech-stack:
  added:
    - "@hello-pangea/dnd v18 (React 19 compatible)"
  patterns:
    - DragDropContext + Droppable + Draggable wrapping section list in edit mode only
    - reorder<T> utility for immutable array reorder
    - View mode renders sections without DnD wrapper (clean rendering path separation)
    - NavDropdown component with click-outside detection via useRef + useEffect
    - onDeletePage performs cascading cleanup (primary nav, children arrays, added_pages, footer_only, pages data)
key-files:
  created: []
  modified:
    - src/components/layouts/LayoutNavbar.tsx
    - src/features/clients/components/WebBriefView.tsx
    - src/features/clients/components/WebBriefDocumentContent.tsx
    - package.json
key-decisions:
  - "Use up/down move buttons alongside DnD drag handles for maximum accessibility (both methods work)"
  - "DnD only active in edit mode — view mode skips DragDropContext entirely for clean rendering"
  - "Page tabs with delete buttons shown as a separate edit-mode-only toolbar below the navbar"
  - "handleDeletePage cascades through all 4 nav lists (primary, children, added_pages, footer_only)"
  - "handleAddSection creates a default hero section with empty intent and title 'Nouvelle section'"
requirements-completed:
  - WBPZ-04
  - WBPZ-05
  - WBPZ-06
  - WBPZ-07
duration: 9min
completed: 2026-02-22
---

# Phase 8 Plan 02: Navigation Submenus, Page/Section CRUD, and DnD Reorder — Summary

**LayoutNavbar submenu dropdowns for hierarchical nav + children tabs flattened into preview + page delete + DnD section reorder with grip handles + section add/delete via @hello-pangea/dnd**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-22T10:31:57Z
- **Completed:** 2026-02-22T10:40:42Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- LayoutNavbar now renders dropdown submenus for nav items with `children` array (desktop: click-to-toggle with click-outside close; mobile: inline expanded list)
- Children page slugs flattened into `pageTabs` in WebBriefView — clicking a child nav item navigates to the correct tab
- Page delete in edit mode: toolbar with delete button (trash icon) per page tab, confirmed with `window.confirm`, cascading cleanup of all nav lists and pages data
- Section drag & drop reorder: @hello-pangea/dnd DragDropContext wraps section list in edit mode, sections show 6-dot grip handles, `handleDragEnd` reorders array and calls `onReorderSections`
- Section add: "+" button at bottom of section list, creates default `hero` section with UUID
- Section delete: trash icon in edit toolbar per section, with confirmation

## Task Commits

1. **Task 1: Submenu + children tabs + page delete + section add/delete/reorder (buttons)** - `4eedc1b` (feat)
2. **Task 2: @hello-pangea/dnd install + DnD section reorder** - `9fbc618` (feat)

## Files Created/Modified
- `src/components/layouts/LayoutNavbar.tsx` — Added `NavDropdown` component (desktop dropdown + mobile expanded list), updated `NavItem` interface to include optional `children`
- `src/features/clients/components/WebBriefView.tsx` — New props: `onDeletePage`, `onDeleteSection`, `onAddSection`, `onReorderSections`; DnD integration; childTabs flattening; page delete toolbar; `dragHandleProps` passed to `PreviewSectionWithEdit`
- `src/features/clients/components/WebBriefDocumentContent.tsx` — New handlers: `handleDeletePage`, `handleReorderSections`, `handleAddSection`, `handleDeleteSection`; import `HomepageSection`, `ZonedSection`, `generateSectionId`
- `package.json` / `package-lock.json` — Added `@hello-pangea/dnd` v18

## Decisions Made
- Used up/down move buttons alongside DnD drag handles — both reorder methods work; buttons accessible without mouse drag
- DnD only active in edit mode — view mode skips `DragDropContext` entirely for clean rendering path separation
- Edit-mode page tabs rendered as a separate toolbar below the navbar (not inside the nav itself)
- `handleDeletePage` cascades through all 4 nav lists (primary nav, children arrays, added_pages, footer_only)
- `handleAddSection` creates a default `hero` section with empty intent and title 'Nouvelle section'
- `reorder<T>` utility function for immutable array swap via splice

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DraggableProvidedDragHandleProps type mismatch**
- **Found during:** Task 2 (DnD integration)
- **Issue:** `dragHandleProps` typed as `Record<string, unknown>` but @hello-pangea/dnd returns `DraggableProvidedDragHandleProps` — not assignable
- **Fix:** Imported `DraggableProvidedDragHandleProps` from @hello-pangea/dnd, used as prop type; removed invalid cast
- **Files modified:** src/features/clients/components/WebBriefView.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** `9fbc618` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Required for type-correct DnD integration. No scope creep.

## Issues Encountered
- File was modified between initial read and write attempt (linter/other process); resolved by re-reading and using targeted Edit tool instead of Write.

## Next Phase Readiness
- Navigation submenu, page/section CRUD and DnD reorder complete
- Ready for Phase 8 Plan 03: dynamic edit form + merged AI button + strategy context re-read

---

## Self-Check: PASSED

Files verified:
- FOUND: `src/components/layouts/LayoutNavbar.tsx`
- FOUND: `src/features/clients/components/WebBriefView.tsx`
- FOUND: `src/features/clients/components/WebBriefDocumentContent.tsx`
- FOUND: `.planning/phases/08-web-brief-preview-zoning/08-02-SUMMARY.md`

Commits verified:
- `4eedc1b` — Task 1: feat(08-02): submenu dropdowns + children tabs + page/section CRUD
- `9fbc618` — Task 2: feat(08-02): @hello-pangea/dnd + DnD section reorder

---
*Phase: 08-web-brief-preview-zoning*
*Completed: 2026-02-22*
