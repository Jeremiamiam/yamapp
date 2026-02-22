---
phase: 09-retroplanning-ia
verified: 2026-02-22T12:00:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
---

# Phase 9: Retroplanning IA — Verification Report

**Phase Goal:** Génération automatique de retroplanning par l'IA à partir du brief client (web brief ou autre). L'IA déduit les étapes et durées, propose un planning inversé depuis la deadline. Vue Gantt/Timeline dans la fiche client, édition drag & drop + formulaire. Usage interne uniquement.

**Verified:** 2026-02-22T12:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | L'IA peut recevoir le contenu d'un brief + deadline et retourner un JSON de taches structurees | VERIFIED | `POST /api/retroplanning`: calls `anthropic.messages.create`, parses `<structured_output>`, returns `{ tasks: RetroplanningTask[] }` with computed dates (route.ts L67–131) |
| 2 | Les dates de debut/fin sont calculees en arriere depuis la deadline (retroplanning) | VERIFIED | `computeDatesFromDeadline` in `retroplanning-utils.ts`: walks tasks array in reverse, last task ends at deadline, each prior task ends day before next starts (L25–58) |
| 3 | Le retroplanning est persistable en base via Supabase upsert | VERIFIED | `saveRetroplanning` in `actions/retroplanning.ts` L59–91: `supabase.from('retroplanning').upsert(...)` with `onConflict: 'client_id'`; migration file defines UNIQUE constraint |
| 4 | Le store Zustand expose les actions CRUD pour retroplanning | VERIFIED | 4 actions in `store/actions/retroplanning.ts`: `loadRetroplanning`, `saveRetroplanning`, `deleteRetroplanning`, `getRetroplanningByClientId`. Wired in `store/index.ts` L12+L24 |
| 5 | L'utilisateur voit une section Retroplanning dans la fiche client | VERIFIED | `RetroplanningSection` imported at `ClientDetail.tsx` L11 and rendered at L116 inside full-width `<div className="mt-6">` |
| 6 | L'utilisateur peut generer un retroplanning en cliquant un bouton (si brief existe) | VERIFIED | `handleGenerate` in `RetroplanningSection.tsx` L143–178: extracts brief content, POSTs to `/api/retroplanning`, calls `saveRetroplanning` on success; "Generer" button disabled if no deadline or `isGenerating` |
| 7 | L'utilisateur voit un Gantt avec des barres horizontales colorees par etape | VERIFIED | `RetroplanningGantt.tsx` (417 lines): CSS Grid `gridTemplateColumns: repeat(totalDays, 1fr)`, colored bars with `COLOR_MAP`, month-label header, week grid lines, today red indicator |
| 8 | L'utilisateur peut drag-move et resize les barres du Gantt pour ajuster les dates | VERIFIED | `onPointerDown`/`onPointerMove`/`onPointerUp` handlers with `setPointerCapture`; separate resize handle (right edge, `cursor: ew-resize`) via `handleResizePointerDown`; preview state avoids re-render flood |
| 9 | L'utilisateur peut cliquer une barre pour editer la tache dans un formulaire | VERIFIED | `handleBarClick` checks `hasMoved` guard; `setEditingTask` triggers `RetroplanningTaskForm` inline below Gantt; form has label, startDate, endDate inputs + 6-color selector + Enregistrer/Annuler |
| 10 | Les modifications sont persistees en base via le store | VERIFIED | `handleTaskUpdate` and `handleFormSave` both call `saveRetroplanning(clientId, ...)` after task edit or drag update |

**Score:** 10/10 truths verified

---

## Required Artifacts

| Artifact | Plan | Expected | Status | Line Count |
|----------|------|----------|--------|-----------|
| `src/types/index.ts` | 01 | RetroplanningTask, RetroplanningPlan, RetroplanningTaskColor types | VERIFIED | Types at L203–221 |
| `supabase/migrations/20260222200000_create_retroplanning.sql` | 01 | retroplanning table with JSONB tasks, RLS policies | VERIFIED | 32 lines, 4 RLS policies, UNIQUE client_id |
| `src/app/api/retroplanning/route.ts` | 01 | POST endpoint for AI retroplanning generation | VERIFIED | 131 lines, exports `POST` |
| `src/lib/retroplanning-utils.ts` | 01 | computeDatesFromDeadline algorithm + daysBetween | VERIFIED | 69 lines, exports both functions |
| `src/lib/store/actions/retroplanning.ts` | 01 | loadRetroplanning, saveRetroplanning, deleteRetroplanning, getRetroplanningByClientId | VERIFIED | 120 lines, all 4 actions |
| `src/lib/store/types.ts` | 01 | AppState extended with retroplanning Map + 4 action signatures | VERIFIED | L139–143 |
| `src/lib/store/index.ts` | 01 | createRetroplanningActions wired | VERIFIED | L12+L24 |
| `src/features/clients/components/sections/RetroplanningSection.tsx` | 02 | Section wrapper with generate button, deadline input, empty state | VERIFIED | 336 lines (min 80 req.) |
| `src/features/clients/components/RetroplanningGantt.tsx` | 02 | CSS Grid Gantt with drag-move and resize via pointer events | VERIFIED | 417 lines (min 120 req.) |
| `src/features/clients/components/RetroplanningTaskForm.tsx` | 02 | Edit form for task (label, dates, duration, color) | VERIFIED | 162 lines (min 50 req.) |
| `src/features/clients/components/sections/index.ts` | 02 | RetroplanningSection exported | VERIFIED | L7 |
| `src/features/clients/components/ClientDetail.tsx` | 02 | RetroplanningSection integrated as full-width row | VERIFIED | L11 import, L116 render |
| `src/features/wiki/wiki-data.ts` | 01+02 | Retroplanning IA feature entry, RETROPLANNING_AGENTS, pipeline step | VERIFIED | L141, L212, L232 |
| `src/features/wiki/components/WikiView.tsx` | 02 | CalendarRangeIcon, ICON_MAP entry, RetroplanningAgentsSection | VERIFIED | L77, L111, L508, L598, L650 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/retroplanning/route.ts` | Anthropic SDK | `client.messages.create` | WIRED | L97: `await anthropic.messages.create({...})` with model `claude-sonnet-4-6` |
| `src/app/api/retroplanning/route.ts` | `src/lib/retroplanning-utils.ts` | `computeDatesFromDeadline` import | WIRED | L4 import, L124 call |
| `src/lib/store/actions/retroplanning.ts` | supabase.retroplanning | `supabase.from('retroplanning').upsert` | WIRED | L37 (select), L65 (upsert), L97 (delete) |
| `src/features/clients/components/sections/RetroplanningSection.tsx` | `/api/retroplanning` | `fetch POST` on generate button click | WIRED | L152: `fetch('/api/retroplanning', { method: 'POST', ... })` |
| `src/features/clients/components/sections/RetroplanningSection.tsx` | `data.slice.ts` (actions) | `saveRetroplanning` after AI response or edit | WIRED | L166 (after generate), L185 (after edit) |
| `src/features/clients/components/RetroplanningGantt.tsx` | pointer events | `onPointerDown/Move/Up` for drag and resize | WIRED | L135–166 (`onPointerDown`), L168–206 (`onPointerMove`, `onPointerUp`) |
| `src/features/clients/components/ClientDetail.tsx` | `RetroplanningSection` | import and render | WIRED | L11 import from `./sections`, L116 render with `clientId={client.id}` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| RETRO-01 | 09-01 | AI reads existing brief content (web-brief, brief, report) to deduce project milestones | SATISFIED | `extractBriefContent` in RetroplanningSection.tsx handles `web-brief`, `brief`, `report`, `creative-strategy` types; passes to `/api/retroplanning` |
| RETRO-02 | 09-01 | AI adapts milestones to detected project type (no fixed template) | SATISFIED | SYSTEM_PROMPT explicitly: "Aucun template fixe : tu lis le brief et deduis ce qui est necessaire"; adapts to "site web, identite visuelle, video, campagne..." |
| RETRO-03 | 09-01 | Retroplanning computed backward from user-supplied deadline | SATISFIED | `computeDatesFromDeadline` in retroplanning-utils.ts: backward walk algorithm, last task ends at deadline |
| RETRO-04 | 09-01 | Retroplanning data persisted per client in Supabase (JSONB tasks) | SATISFIED | Migration: `tasks jsonb NOT NULL DEFAULT '[]'`; `saveRetroplanning` upserts tasks as JSONB |
| RETRO-05 | 09-01 | Store CRUD actions for retroplanning (load, save, delete) | SATISFIED | All 4 CRUD actions in `actions/retroplanning.ts`, wired into store via `createRetroplanningActions` |
| RETRO-06 | 09-02 | Gantt chart visualization with horizontal bars per task in client detail | SATISFIED | `RetroplanningGantt.tsx` renders CSS Grid Gantt; `ClientDetail.tsx` renders `RetroplanningSection` which embeds the Gantt |
| RETRO-07 | 09-02 | User can drag-move and resize Gantt bars to adjust dates | SATISFIED | Pointer-event drag (handleBarPointerDown) + resize-right handle (handleResizePointerDown) with `setPointerCapture`; hasMoved guard; `onTaskUpdate` called on pointerUp |
| RETRO-08 | 09-02 | User can edit task details via inline form (label, dates, color) | SATISFIED | `RetroplanningTaskForm.tsx` with label input, startDate/endDate inputs, auto-computed durationDays, 6-color selector; saves to store on Enregistrer |

**Orphaned requirements:** None. All 8 RETRO IDs are claimed by plans and verified in codebase.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| RetroplanningSection.tsx | 61 | `return null` | Info | Valid guard — returns null when no brief documents exist (expected behavior for extractBriefContent helper) |
| RetroplanningSection.tsx | 206 | `return null` | Info | Valid guard — returns null while client data is loading (standard loading pattern) |
| RetroplanningTaskForm.tsx | 78 | `placeholder=` | Info | HTML input placeholder attribute — not a stub, used for label input hint text |

No blocker or warning anti-patterns found. All `return null` cases are legitimate early-return guards, not stub implementations.

---

## Human Verification Required

### 1. Gantt Drag-Move Behavior

**Test:** Open a client detail page that has a web-brief document. Generate a retroplanning. Drag a Gantt bar horizontally.
**Expected:** Bar moves smoothly during drag (preview), releases at new position. Dates update visually. Changes persisted to Supabase after `pointerup`.
**Why human:** Real-time pointer event behavior, visual smoothness, and actual Supabase write cannot be verified programmatically from code alone.

### 2. Gantt Resize Handle

**Test:** Hover over the right edge of a Gantt bar. Drag to resize.
**Expected:** Cursor changes to `ew-resize`. Bar extends/shrinks rightward. `durationDays` updates. Clamped at deadline.
**Why human:** Visual cursor behavior and resize clamping at edge cases require runtime interaction.

### 3. AI Generation Quality

**Test:** Generate a retroplanning from a web-brief document with a real deadline (e.g., 2026-06-01).
**Expected:** AI returns 4-10 task steps adapted to the project type, not a fixed template. Dates walk backward from deadline correctly.
**Why human:** AI output quality, task relevance to brief type, and end-to-end API call require live environment.

### 4. Empty States

**Test:** Visit a client detail page with NO brief documents. Check Retroplanning section.
**Expected:** Shows "Ajoutez un brief d'abord" message with no generate button.
**Why human:** Requires a client fixture with no documents.

### 5. Regeneration Flow

**Test:** After generating a retroplanning, click "Regénérer".
**Expected:** New AI call, new tasks, plan overwritten in Supabase. Previous Gantt replaced.
**Why human:** Requires verifying database state before/after.

---

## Gaps Summary

No gaps found. All phase artifacts exist, are substantive (no stubs), and are fully wired. All 8 requirement IDs (RETRO-01 through RETRO-08) are implemented and verifiable in the codebase. All 4 documented commits (1c36527, 79114d8, 62b8faf, 42f975e) exist in git history.

The implementation exceeds minimum line requirements significantly: RetroplanningSection (336 vs. min 80), RetroplanningGantt (417 vs. min 120), RetroplanningTaskForm (162 vs. min 50).

---

_Verified: 2026-02-22T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
