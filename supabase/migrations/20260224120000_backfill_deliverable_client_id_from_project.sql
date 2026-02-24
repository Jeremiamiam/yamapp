-- Backfill client_id on deliverables that have a project_id but no client_id.
-- These were created before the fix that auto-propagates client_id from the project.
-- Retroactively assign client_id from the linked project.

UPDATE public.deliverables d
SET client_id = p.client_id
FROM public.projects p
WHERE d.project_id = p.id
  AND d.client_id IS NULL;
