---
phase: 10-layout-gallery-variants
plan: "02"
subsystem: layout-gallery
tags: [layout, gallery, code-editor, ai-edit, api]

requires:
  - phase: 10-01
    provides: LayoutGallery modal, LayoutCard, LayoutGalleryGrid, gallery entry points
  - phase: generate-layout-api
    provides: POST /api/generate-layout (file write + custom-layouts.ts update)

provides:
  - GET /api/read-layout — reads Layout{PascalRole}.tsx from disk by role
  - POST /api/edit-layout — AI-prompted layout code modification (returns code, no disk write)
  - LayoutCodeEditor component — Code + AI tab panel for viewing/editing layout TSX
  - generate-layout accepts direct `code` field for deterministic file write
  - Gallery "Éditer" pencil button on each card → opens LayoutCodeEditor overlay

affects:
  - src/features/layout-gallery/ (editor integration)
  - src/app/api/generate-layout/ (code field addition)

tech-stack:
  added: []
  patterns:
    - "read-layout API: simple fs.readFileSync wrapper with role→PascalCase path resolution"
    - "edit-layout API: AI returns modified code only — saving delegated to generate-layout caller"
    - "generate-layout: direct code write bypasses AI when body.code provided (placed before idempotence check)"
    - "LayoutCodeEditor: fetch on mount pattern for code loading, activeTab local state, spinner loading state"
    - "Standard vs custom distinction: STANDARD_ROLES Set in component, textarea readOnly for standards"

key-files:
  created:
    - src/app/api/read-layout/route.ts
    - src/app/api/edit-layout/route.ts
    - src/features/layout-gallery/components/LayoutCodeEditor.tsx
  modified:
    - src/app/api/generate-layout/route.ts
    - src/features/layout-gallery/components/LayoutGallery.tsx
    - src/features/layout-gallery/components/LayoutGalleryGrid.tsx
    - src/features/layout-gallery/components/LayoutCard.tsx

key-decisions:
  - "edit-layout returns code only (no disk write) — save is a separate user action via generate-layout, enables preview before commit"
  - "direct code write in generate-layout placed BEFORE idempotence check so it always writes when code field provided"
  - "STANDARD_ROLES set hardcoded in LayoutCodeEditor (not imported from section-registry) — avoids circular dependency risk at component level"
  - "onEditLayout prop on LayoutCard is optional — backward compatible, all existing usages unaffected"
  - "AI tab switches back to Code tab after successful AI edit so user sees the modified code immediately"

requirements-completed:
  - LGAL-07
  - LGAL-08
  - LGAL-09

duration: ~15min
completed: 2026-02-22
---

# Phase 10 Plan 02: Layout Code Editor & AI Editing — Summary

**read-layout and edit-layout API endpoints plus LayoutCodeEditor component with Code/AI tabs, enabling view, manual edit, and AI-prompted modification of layout TSX directly from the gallery.**

---

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-22T14:12:04Z
- **Completed:** 2026-02-22T14:30:00Z
- **Tasks:** 2
- **Files modified:** 7

---

## Accomplishments

- Two new API endpoints: `GET /api/read-layout` reads layout TSX from disk; `POST /api/edit-layout` accepts existing code + prompt, returns AI-modified code without writing
- `LayoutCodeEditor` panel with Code tab (editable textarea, save to disk) and AI tab (prompt → preview → save workflow)
- Standard layouts read-only with note; custom layouts fully editable
- `generate-layout` patched to accept `code` field for deterministic file write (bypasses AI, placed before idempotence check)
- Gallery cards get pencil "Éditer" icon button wired through `LayoutGalleryGrid` → `LayoutCard` → `LayoutGallery`

---

## Task Commits

1. **Task 1: read-layout and edit-layout API endpoints** — `fff0ba9` (feat)
2. **Task 2: LayoutCodeEditor component + gallery integration** — `c4f3807` (feat)

---

## Files Created/Modified

- `src/app/api/read-layout/route.ts` — GET endpoint, role→PascalCase path, fs.readFileSync, returns `{ role, code, componentName }`
- `src/app/api/edit-layout/route.ts` — POST endpoint, Anthropic SDK, SYSTEM_PROMPT + modification instruction, returns `{ code }`
- `src/app/api/generate-layout/route.ts` — added `code?: string` to body type; direct write block before idempotence check
- `src/features/layout-gallery/components/LayoutCodeEditor.tsx` — Code + AI tab panel, 220 lines
- `src/features/layout-gallery/components/LayoutGallery.tsx` — added `editingRole` state, LayoutCodeEditor import + render
- `src/features/layout-gallery/components/LayoutGalleryGrid.tsx` — added `onEditLayout?: (role: string) => void` prop, threaded to LayoutCard
- `src/features/layout-gallery/components/LayoutCard.tsx` — added `onEditLayout?: () => void` prop, pencil SVG button in card footer

---

## Decisions Made

- **edit-layout returns code only** — saving is a separate deliberate user action via generate-layout. This enables the user to review AI output before committing to disk.
- **direct code write before idempotence check** — the `if (body.code)` block in generate-layout must come before `if (fs.existsSync(filePath))` so that saving always writes, even if the file already exists.
- **STANDARD_ROLES hardcoded in LayoutCodeEditor** — avoids importing section-registry in a client component that would pull in server-side code; the set is stable and small.
- **AI tab auto-switches to Code tab after edit** — `setActiveTab('code')` after successful AI response so the user immediately sees the modified code and can review before saving.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Self-Check: PASSED

Files created:
- `src/app/api/read-layout/route.ts` — FOUND
- `src/app/api/edit-layout/route.ts` — FOUND
- `src/features/layout-gallery/components/LayoutCodeEditor.tsx` — FOUND

Commits:
- `fff0ba9` — feat(10-02): read-layout and edit-layout API endpoints — FOUND
- `c4f3807` — feat(10-02): LayoutCodeEditor + gallery integration — FOUND

Build: `npm run build` completed successfully, `/api/read-layout` appears in build output.

---

## Issues Encountered

None.

---

## Next Phase Readiness

Phase 10 is now complete. Both plans delivered:
- Plan 01: gallery modal with scaled previews, variant creation, dual entry points
- Plan 02: code viewer/editor and AI-prompted editing for any layout

No blockers for future phases.

---
*Phase: 10-layout-gallery-variants*
*Completed: 2026-02-22*
