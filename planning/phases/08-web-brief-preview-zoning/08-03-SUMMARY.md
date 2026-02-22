---
phase: 08-web-brief-preview-zoning
plan: 03
subsystem: ui
tags: [react, typescript, anthropic, dynamic-form, web-brief]

# Dependency graph
requires:
  - phase: 08-01
    provides: UUID section identity (id field on sections, ensureSectionIds, find-by-id mutations)

provides:
  - inferFieldType() — classifies content values into string/text/array-strings/array-objects/object/unknown
  - DynamicSectionFields component — iterates Object.entries(content), renders appropriate field type per key
  - Single "IA ◆" merged AI button replacing separate Yam + Rewrite buttons
  - Strategy context (brandPlatform, copywriterText, reportContent) wired into rewrite API call
  - Sauvegarder button + Enter-key save (inputs only) with accumulated-patch pattern

affects: [web-brief, ai-rewrite, section-edit, strategy-context]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "inferFieldType: runtime value classification for dynamic form generation"
    - "accumulated-patch with useRef: collect changes, flush on explicit save"
    - "StableField: useRef + useEffect to prevent cursor-jump on re-render"

key-files:
  created: []
  modified:
    - src/features/clients/components/WebBriefView.tsx
    - src/features/clients/components/WebBriefDocumentContent.tsx
    - src/app/api/web-section-rewrite/route.ts

key-decisions:
  - "inferFieldType threshold: string > 80 chars = textarea, else input"
  - "Accumulated patch pattern: collect via useRef, flush on Sauvegarder or Enter-on-input"
  - "Enter key on textarea = newline (not save); Enter on input = save"
  - "Empty AI prompt = YAM_PROMPT (creative direction); non-empty = custom rewrite"
  - "Strategy context truncated to 2000 chars each to stay within token limits"
  - "Single handleAiRewrite replaces handleSectionRewrite + handleSectionYam"

patterns-established:
  - "DynamicSectionFields: always use Object.entries(content) — never hardcode field names"
  - "StableField: always use for text inputs in forms that re-render from external state"
  - "AI rewrite: always include strategy context in API body (brandPlatform, copywriterText, reportContent)"

requirements-completed:
  - WBPZ-08
  - WBPZ-09
  - WBPZ-10

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 8 Plan 03: Dynamic Edit Form + Merged AI Button Summary

**Dynamic section edit form using Object.entries introspection, single "IA ◆" button replacing Yam/Rewrite split, and strategy context (brand platform, copywriter, report) wired into the rewrite API**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-22T10:31:50Z
- **Completed:** 2026-02-22T10:36:24Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Dynamic section edit form that renders all content keys automatically — no more hardcoded title/subtitle/text only
- `inferFieldType()` classifies values at runtime: short strings → input, long strings → textarea, arrays → list with add/remove, objects with label/url → CTA pair, generic objects → sub-fields one level deep
- Accumulated-patch pattern: all field changes collected in `useRef`, flushed on explicit Sauvegarder button or Enter key (only on `<input>`, not `<textarea>`)
- Single "IA ◆" button replaces the previous "◆ Yam" + "Réécrire" dual-button UX — clicking toggles inline prompt textarea with placeholder "Laisser vide = touche Yam"
- Strategy context (brandPlatform, copywriterText, reportContent) now sent to `/api/web-section-rewrite` in every call — AI output aligned with brand tone and project values

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Dynamic form + merged AI button (WebBriefView)** - `b67c940` (feat)
2. **Task 2: Merge AI handlers + strategy context wire-up** - `836cff1` (feat)

## Files Created/Modified

- `src/features/clients/components/WebBriefView.tsx` — `inferFieldType`, `DynamicSectionFields`, merged AI button, accumulated-patch save mechanism
- `src/features/clients/components/WebBriefDocumentContent.tsx` — `handleAiRewrite` + `handlePageAiRewrite` replace 4 separate handlers; `getStrategyContext()` called in both
- `src/app/api/web-section-rewrite/route.ts` — accepts `brandPlatform`, `copywriterText`, `reportContent`; builds strategy context block; updated SYSTEM_PROMPT

## Decisions Made

- `inferFieldType` threshold set at 80 chars: strings longer than 80 chars render as textarea — handles typical descriptions/paragraphs correctly
- Accumulated-patch pattern chosen over per-keystroke save: avoids excessive `updateDocument` calls, preserves cursor position via StableField
- Enter key behavior: fires save only on `<input>` (`tagName === 'INPUT'`), so textareas retain natural newline behavior
- Empty AI prompt routes to YAM_PROMPT constant (same creative direction as old "Yam" button) — no functional regression
- Strategy context truncated at 2000 chars each to stay safely within Claude's token window when combined with section + architecture

## Deviations from Plan

None — plan executed exactly as written. The linter/formatter added `onDeletePage`, `onDeleteSection`, `onAddSection`, `onReorderSections` props to the WebBriefView interface (plan 02 work that was already in-progress); those were preserved without conflict.

## Issues Encountered

None — TypeScript check and build passed cleanly on first attempt.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 8 Plan 03 complete — all three plans of phase 8 are now done
- Dynamic edit form ready for any content shape the AI agents produce
- Single AI button reduces UI complexity; strategy context ensures output quality
- No blockers for next phase

---
*Phase: 08-web-brief-preview-zoning*
*Completed: 2026-02-22*
