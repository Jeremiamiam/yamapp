---
phase: 12-refonte-page-client-v2
plan: 01
subsystem: database
tags: [supabase, typescript, postgres, zustand, documents]

# Dependency graph
requires: []
provides:
  - project_id column on documents table (SQL migration ready to apply)
  - ClientDocument.projectId optional field for client vs project document distinction
  - DocumentRow.project_id mapping in supabase-mappers (read + write)
  - addDocument store action accepts optional projectId parameter
  - ModalType report-upload carries optional projectId
  - openReportUploadModal helper extended with optional projectId
affects:
  - 12-02
  - 12-03
  - 12-04

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "projectId undefined = client doc, projectId string = project doc — convention for filtering"
    - "toSupabaseDocument maps projectId -> project_id in insert payload"

key-files:
  created:
    - supabase/migrations/20260222210000_add_project_id_to_documents.sql
  modified:
    - src/types/index.ts
    - src/lib/supabase-mappers.ts
    - src/lib/store/types.ts
    - src/lib/store/actions/clients.ts
    - src/hooks/useModal.ts

key-decisions:
  - "No index on project_id — low document volume, FK lookup sufficient"
  - "No backfill — existing docs remain NULL (= client docs), backward-compatible"
  - "addDocument projectId passed as third parameter (not in docData) — keeps Omit<ClientDocument> clean"
  - "openReportUploadModal extended with optional projectId — callers can pass context without breaking existing usage"

patterns-established:
  - "project_id nullable FK references projects(id) ON DELETE SET NULL — project deletion detaches docs rather than cascading"

requirements-completed: [CLV2-02]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 12 Plan 01: Data Layer — document project_id Summary

**SQL migration + types + mapper + store wiring to associate documents with projects using optional projectId field, preserving backward compatibility for existing client documents**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T17:28:53Z
- **Completed:** 2026-02-22T17:30:46Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Migration file creates `project_id` FK column on `documents` table with `ON DELETE SET NULL`
- `ClientDocument.projectId?: string` added — undefined = client doc, string = project doc
- `DocumentRow` interface + `mapDocumentRow` + `toSupabaseDocument` all handle `project_id`
- `addDocument(clientId, doc, projectId?)` signature updated in store action and AppState type
- `ModalType report-upload` carries optional `projectId` for PLAUD import targeting
- `openReportUploadModal` helper extended to pass projectId downstream

## Task Commits

Each task was committed atomically:

1. **Task 1: Supabase migration + TypeScript types for document project_id** - `be5528a` (feat)
2. **Task 2: Extend store addDocument + ModalType for project context** - `a08466a` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `supabase/migrations/20260222210000_add_project_id_to_documents.sql` - ALTER TABLE adds project_id FK
- `src/types/index.ts` - ClientDocument.projectId?: string added
- `src/lib/supabase-mappers.ts` - DocumentRow.project_id, mapDocumentRow, toSupabaseDocument all extended
- `src/lib/store/types.ts` - ModalType report-upload gets projectId?, addDocument signature updated
- `src/lib/store/actions/clients.ts` - addDocument accepts projectId?, inserts project_id to Supabase
- `src/hooks/useModal.ts` - openReportUploadModal accepts optional projectId

## Decisions Made
- No index on `project_id` — low document volume, FK lookup sufficient
- No backfill — existing docs remain NULL (backward-compatible: NULL = client doc)
- `addDocument` takes `projectId` as 3rd param, not embedded in `docData` — avoids touching the `Omit<ClientDocument>` shape
- `project_id` FK uses `ON DELETE SET NULL` — project deletion detaches documents rather than cascading

## Deviations from Plan

**1. [Rule 2 - Missing Critical] Extended useModal.ts openReportUploadModal helper**
- **Found during:** Task 2 (checking if modal helper existed)
- **Issue:** Plan noted "if a helper exists, extend it" — `openReportUploadModal` in `useModal.ts` needed projectId extension
- **Fix:** Added optional `projectId?: string` parameter to `openReportUploadModal`
- **Files modified:** src/hooks/useModal.ts
- **Verification:** TypeScript compiles, no new errors
- **Committed in:** `a08466a` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical plumbing noted in plan itself)
**Impact on plan:** Plan explicitly mentioned this case. No scope creep.

## Issues Encountered
- 4 pre-existing TypeScript errors in `src/app/proto/client-detail-v2/page.tsx` — unrelated to this plan, not introduced by our changes.

## User Setup Required
The migration file must be applied to the Supabase database:
```bash
supabase db push
# or via Supabase Studio: run the SQL from supabase/migrations/20260222210000_add_project_id_to_documents.sql
```

## Next Phase Readiness
- Data layer complete — all UI plans (12-02 to 12-04) can filter `client.documents` by `projectId` without further data changes
- `addDocument(clientId, doc, projectId)` ready for use in project drawer import flows
- `ModalType report-upload { projectId? }` ready for PLAUD import context

---
*Phase: 12-refonte-page-client-v2*
*Completed: 2026-02-22*
