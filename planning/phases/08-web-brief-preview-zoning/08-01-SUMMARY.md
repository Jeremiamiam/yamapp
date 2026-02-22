---
phase: 08-web-brief-preview-zoning
plan: 01
subsystem: web-brief-preview
tags: [uuid, section-identity, layout-registry, fallback, migration]
dependency_graph:
  requires: []
  provides:
    - UUID-based section identity for all web-brief sections
    - Intelligent layout matching with similarity fallback
    - LayoutPlaceholder component for unknown roles
  affects:
    - src/features/clients/components/WebBriefView.tsx
    - src/features/clients/components/WebBriefDocumentContent.tsx
    - src/lib/section-registry.ts
tech_stack:
  added:
    - crypto.randomUUID() for stable UUID generation
  patterns:
    - Find-by-id instead of array-index for section mutation
    - Transparent ID backfill on document parse (legacy compat)
    - Similarity map for AI role alias matching
key_files:
  created:
    - src/lib/section-id.ts
    - src/components/layouts/LayoutPlaceholder.tsx
  modified:
    - src/types/section-zoning.ts
    - src/types/web-brief.ts
    - src/lib/section-registry.ts
    - src/features/clients/components/WebBriefDocumentContent.tsx
    - src/features/clients/components/WebBriefView.tsx
decisions:
  - Use crypto.randomUUID() with Math.random() fallback (never triggers in Next.js 15+)
  - Optional id field on types (backward compat with AI agent outputs)
  - ensureSectionIds applied at parse time in WebBriefDocumentContent (not in WebBriefView)
  - ROLE_SIMILARITY_MAP covers 14 common AI alias patterns
metrics:
  duration: 309s
  completed: 2026-02-22
  tasks_completed: 2
  files_modified: 7
---

# Phase 8 Plan 01: UUID Section Identity and Layout Fallback — Summary

**One-liner:** UUID-based section identity with transparent legacy migration, intelligent role similarity matching (14 aliases), and visible LayoutPlaceholder fallback for unknown AI-generated roles.

---

## What Was Built

### Task 1: Foundation — section-id utility, type updates, registry enhancement, LayoutPlaceholder

**`src/lib/section-id.ts`** — New utility:
- `generateSectionId()`: UUID v4 via `crypto.randomUUID()` with Math.random fallback
- `ensureSectionIds<T>(sections: T[])`: Maps over sections array, adds `id` to any section missing one (legacy backfill)

**`src/types/section-zoning.ts`** — Added optional `id?: string` to `ZonedSection` interface

**`src/types/web-brief.ts`** — Added optional `id?: string` to `HomepageSection` interface

**`src/lib/section-registry.ts`** — Enhanced with:
- `ROLE_SIMILARITY_MAP`: 14 AI alias mappings (`about` -> `value_proposition`, `testimonials` -> `testimonial`, `cta` -> `cta_final`, etc.)
- `getLayoutForRoleWithFallback(role)`: Returns `{ layout, matched, isExact }` — exact match first, then similarity map, then null
- Existing `getLayoutForRole` and `isValidSectionRole` kept for backward compat

**`src/components/layouts/LayoutPlaceholder.tsx`** — New `'use client'` component:
- Shows role name in monospace, "Layout inexistant" message
- Displays matched similar role if available
- Optional "Generer ce layout" button
- Uses CSS variables (`--border-medium`, `--text-muted`, `--accent-cyan`, etc.)

### Task 2: Migration — WebBriefDocumentContent and WebBriefView

**`src/features/clients/components/WebBriefDocumentContent.tsx`**:
- New `parseAndMigrateWebBriefData()` helper applies `ensureSectionIds` to homepage and all pages on parse
- All handler signatures changed from `sectionIndex: number` to `sectionId: string`
- Section mutation uses `sections.find((s) => s.id === sectionId)` instead of `sections[sectionIndex]`
- `handleGeneratePageZoning` applies `ensureSectionIds` to newly generated page sections

**`src/features/clients/components/WebBriefView.tsx`**:
- Props: all `sectionIndex: number` params replaced with `sectionId: string`
- State: `rewritingIndex` -> `rewritingId`, `promptForIndex` -> `promptForSectionId`
- Section rendering: `section.id` as React key (with graceful fallback for legacy)
- `getLayoutForRole` replaced by `getLayoutForRoleWithFallback`
- Unknown roles render `<LayoutPlaceholder role={...} matchedRole={...} />` instead of `null`

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Verification Results

1. `npx tsc --noEmit` — PASSED, zero type errors
2. `npm run build` — PASSED, successful Next.js build
3. All required artifacts present at expected paths
4. Section identity is UUID-based throughout the web-brief preview system
5. Unknown roles will render LayoutPlaceholder instead of nothing
6. Legacy documents without section ids get UUIDs assigned transparently on parse

---

## Self-Check: PASSED

Files verified:
- FOUND: `src/lib/section-id.ts`
- FOUND: `src/components/layouts/LayoutPlaceholder.tsx`
- FOUND: `src/lib/section-registry.ts`
- FOUND: `src/features/clients/components/WebBriefDocumentContent.tsx` (migrated)
- FOUND: `src/features/clients/components/WebBriefView.tsx` (migrated)

Commits verified:
- `0e987bc` — Task 1: feat(08-01): section-id utility, types, registry, LayoutPlaceholder
- `a942869` — Task 2: feat(08-01): migrate WebBriefView and WebBriefDocumentContent to UUID-based section identity
