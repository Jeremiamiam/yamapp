---
phase: 10-layout-gallery-variants
plan: "01"
subsystem: layout-gallery
tags: [layout, gallery, modal, variants, wiki]
dependency_graph:
  requires:
    - section-registry (getAvailableLayouts, getLayoutForRoleWithFallback)
    - custom-layouts (CUSTOM_LAYOUTS)
    - /api/generate-layout (variant creation)
    - LayoutPlaceholder (fallback render)
  provides:
    - LayoutGallery modal component
    - LayoutGalleryGrid grouped display
    - LayoutCard scaled preview card
    - Gallery entry point in WikiView
    - Gallery entry point in SectionDrawer LayoutPicker
  affects:
    - src/features/wiki/components/WikiView.tsx
    - src/features/clients/components/SectionDrawer.tsx
    - src/features/wiki/wiki-data.ts
tech_stack:
  added:
    - src/features/layout-gallery/components/LayoutCard.tsx
    - src/features/layout-gallery/components/LayoutGalleryGrid.tsx
    - src/features/layout-gallery/components/LayoutGallery.tsx
  patterns:
    - CSS transform scale(0.22) + 454% dimensions for scaled layout previews
    - data-theme="light" wrapper so layouts render with client-facing CSS vars
    - Local useState gallery state, no Zustand
    - fetch POST /api/generate-layout for variant creation
    - Escape key capture-phase listener for modal close
key_files:
  created:
    - src/features/layout-gallery/components/LayoutCard.tsx
    - src/features/layout-gallery/components/LayoutGalleryGrid.tsx
    - src/features/layout-gallery/components/LayoutGallery.tsx
  modified:
    - src/features/wiki/components/WikiView.tsx
    - src/features/wiki/wiki-data.ts
    - src/features/clients/components/SectionDrawer.tsx
decisions:
  - Scale factor 0.22 with 454% dimensions (1/0.22 = 4.545) gives full-width layout preview within 160px card height
  - Gallery state is local useState (not Zustand) — gallery is ephemeral UI, not persistent state
  - Variant creation uses inline modal-within-modal (no separate route) with auto-dismiss toast
  - LayoutPicker gallery icon button: only rendered when onOpenGallery prop is provided (backward-compatible)
  - Wiki gallery button styled as full-width banner card distinct from standard FeatureCards
metrics:
  duration: "~3 min"
  completed: "2026-02-22"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 3
---

# Phase 10 Plan 01: Layout Gallery & Variants — Summary

**One-liner:** Full-screen layout gallery modal with CSS-scaled live previews, variant creation via generate-layout API, and dual entry points from WikiView and SectionDrawer LayoutPicker.

---

## What Was Built

### Task 1: LayoutGallery modal + LayoutCard + LayoutGalleryGrid

Three new components in `src/features/layout-gallery/components/`:

**LayoutCard.tsx** — Single layout preview card:
- 160px height container with CSS `scale(0.22)` + `454%` dimensions for scaled live preview
- `data-theme="light"` wrapper so layout components render with client-facing CSS variables
- Uses `getLayoutForRoleWithFallback()` to resolve layout component; falls back to `LayoutPlaceholder`
- Selected state: `ring-2 ring-[var(--accent-cyan)]`
- Footer: label + group badge (cyan = standard, violet = custom) + "+ variante" button

**LayoutGalleryGrid.tsx** — Grouped grid:
- Calls `getAvailableLayouts()` from section-registry
- Renders Standard group then Custom group, each with count badge
- Responsive grid: `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

**LayoutGallery.tsx** — Full-screen overlay modal:
- `fixed inset-0 z-[100]` with backdrop blur
- Header: title, selected role badge, "Appliquer" button (enabled when role selected), close button
- Escape key closes (capture phase, high priority)
- Variant creation: inline modal-within-modal with `baseRole_suffix` input, calls `fetch('/api/generate-layout')`, `router.refresh()` on success
- Success/error toast with 3-second auto-dismiss
- All state local, no Zustand

### Task 2: Wire entry points + wiki data

**WikiView.tsx:**
- Added `LayoutGallery` import
- Added `galleryOpen` useState
- Added `LayoutGridIcon` SVG component + `'layout-grid'` entry in `ICON_MAP`
- Added full-width gallery access banner button below the feature cards grid
- Renders `<LayoutGallery isOpen onClose=... />` when galleryOpen

**SectionDrawer.tsx — LayoutPicker:**
- Added `onOpenGallery?: () => void` prop
- Added 4-square grid icon button next to dropdown trigger (only when prop provided)
- Backward-compatible: existing usages without `onOpenGallery` unaffected

**SectionDrawer.tsx — SectionDrawer main:**
- Added `galleryOpen` and `galleryContextSectionId` states
- Passes `onOpenGallery` to LayoutPicker (sets context section ID, opens gallery)
- Renders `<LayoutGallery>` with `initialRole` from context section, `onSelectRole` callback → calls `onRoleChange`

**wiki-data.ts:**
- Added `layout-gallery` entry to `FEATURE_SECTIONS` with violet accent, `layout-grid` icon

---

## Verification Passed

1. `npx tsc --noEmit` — 0 errors
2. `npm run build` — completes successfully, 21 static pages generated
3. Three new files exist: LayoutGallery.tsx, LayoutGalleryGrid.tsx, LayoutCard.tsx
4. WikiView.tsx has `galleryOpen` state and LayoutGallery render
5. SectionDrawer.tsx LayoutPicker has `onOpenGallery` button
6. wiki-data.ts has `layout-gallery` feature entry

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Self-Check: PASSED

Files created:
- `src/features/layout-gallery/components/LayoutCard.tsx` — FOUND
- `src/features/layout-gallery/components/LayoutGalleryGrid.tsx` — FOUND
- `src/features/layout-gallery/components/LayoutGallery.tsx` — FOUND

Commits:
- `73720c8` — feat(10-01): LayoutGallery modal + LayoutCard + LayoutGalleryGrid — FOUND
- `ee8f604` — feat(10-01): wire gallery entry points — WikiView + SectionDrawer + wiki data — FOUND
