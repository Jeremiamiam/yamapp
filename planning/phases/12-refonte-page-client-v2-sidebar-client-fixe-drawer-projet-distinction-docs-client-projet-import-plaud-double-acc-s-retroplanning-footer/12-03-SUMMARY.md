---
phase: 12
plan: "03"
subsystem: clients
tags:
  - drawer
  - project
  - tabs
  - billing
  - documents
dependency_graph:
  requires:
    - "12-01"  # project_id on ClientDocument, store action addDocument with projectId
  provides:
    - "ProjectDrawer component with 3 tabs"
    - "Project-filtered documents display"
    - "Hybrid billing view (project + product level)"
  affects:
    - "src/features/clients/components/ClientDetail.tsx"  # will wire ProjectDrawer
tech_stack:
  added: []
  patterns:
    - "Master-detail layout (1/3 list + 2/3 detail)"
    - "Controlled drawer with overlay, keyboard close (Escape), state reset on project change"
    - "Hybrid billing display (project-level quote + product-level invoicing)"
key_files:
  created:
    - "src/features/clients/components/ProjectDrawer.tsx"
    - "src/features/clients/components/ProjectDrawerProductsTab.tsx"
    - "src/features/clients/components/ProjectDrawerDocsTab.tsx"
    - "src/features/clients/components/ProjectDrawerBillingTab.tsx"
  modified:
    - "src/features/clients/components/index.ts"
decisions:
  - "deliverables prop passed from parent (not fetched inside) — avoids store coupling inside drawer tabs"
  - "billing badge status 'none' hidden from header — only shown when project has a quote"
  - "product count badge in tab label for quick at-a-glance info"
  - "PLAUD import button opens report-upload modal with projectId pre-set (per Phase 12 Plan 01 decision)"
metrics:
  duration: "3 minutes"
  completed: "2026-02-22"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 12 Plan 03: ProjectDrawer — 3-tab drawer shell + content components

**One-liner:** Sliding right drawer for project details with Produits (master-detail 1/3+2/3), Docs (project-filtered + PLAUD import), and Facturation (hybrid project-level + product-level billing) tabs.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | ProjectDrawer shell | `9e0deb1` | `ProjectDrawer.tsx` |
| 2 | Three tab content components | `24020e3` | `ProjectDrawerProductsTab.tsx`, `ProjectDrawerDocsTab.tsx`, `ProjectDrawerBillingTab.tsx`, `index.ts` |

## What Was Built

### ProjectDrawer.tsx (shell)
- Absolute-positioned overlay (bg-black/40, z-10) + drawer panel (z-20, 600px, max-w-90vw)
- Left border accent: `border-l-2 border-l-[var(--accent-cyan)]`
- Header: project name, quote amount (or "Facturation produit"), billing status badge via `computeProjectBilling`
- 3 tabs (Produits | Docs | Facturation) with `border-b-2` active indicator pattern from ProjectModal
- Escape key handler via `useEffect` + `window.addEventListener`
- State reset on `project.id` change: resets `activeTab` to `'produits'` and auto-selects first product
- Props: `{ project, client, deliverables, onClose }`

### ProjectDrawerProductsTab.tsx
- Master-detail split: `w-1/3 border-r` list + `w-2/3` detail panel
- Left: product list with status badges, active product highlighted with cyan accent border
- Right: ProductDetail sub-component with fields (status, assignee, dates, contractor, prix facturé, coût ST), notes block, billing rows (devis/acompte/avancements/solde/total)
- Empty state: "Aucun produit dans ce projet"

### ProjectDrawerDocsTab.tsx
- Filters `client.documents` by `d.projectId === project.id`
- "Import PLAUD" button → `openModal({ type: 'report-upload', clientId, projectId })` (per Phase 12 Plan 01 decision)
- Doc list with file icon, title, colored type badge, date
- Empty state: "Aucun document — Importez un rapport PLAUD"

### ProjectDrawerBillingTab.tsx
- Section 1 (if project has quote): progress bar, project-level rows (devis/acompte/avancements/solde), total encaissé
- Section 2: per-product billing cards with header (dot, name, billing status, total invoiced) + detail rows (devis/acompte/avancements/solde) — montant + date only
- Handles both: with-quote (project-level + product detail) and without-quote (product cards only)
- Empty state when no quote and no products

## Deviations from Plan

### Auto-fix: deliverables passed as prop

The plan specified `client.deliverables` but `Client` type does not have a `deliverables` property (deliverables are stored separately in the Zustand store as a flat array).

**Fix:** Added `deliverables: Deliverable[]` prop to `ProjectDrawer` and all tab components, to be passed by the parent (`ClientDetail`). This is the clean pattern used elsewhere in the codebase (e.g., `ProjectModal` which uses `useAppStore()` internally — but a prop-based approach avoids store coupling inside a presentational drawer component).

### Auto-fix: `void client` suppression in ProductsTab

The `client` prop is not used in `ProjectDrawerProductsTab` currently (products come from filtered deliverables), but is kept for future extensibility. Added `void client` to suppress the unused variable warning without changing the interface.

## Self-Check

Files created:
- `src/features/clients/components/ProjectDrawer.tsx` — exists
- `src/features/clients/components/ProjectDrawerProductsTab.tsx` — exists
- `src/features/clients/components/ProjectDrawerDocsTab.tsx` — exists
- `src/features/clients/components/ProjectDrawerBillingTab.tsx` — exists

TypeScript: No errors in new files. 4 pre-existing errors in `src/app/proto/client-detail-v2/page.tsx` (unrelated, existed before this plan).

Commits: `9e0deb1`, `24020e3`

## Self-Check: PASSED
