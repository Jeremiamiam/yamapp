-- Phase 12 Plan 01: Add project_id to documents table
-- Allows distinction between client documents (project_id IS NULL) and project documents (project_id NOT NULL)

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS project_id text
  REFERENCES public.projects(id) ON DELETE SET NULL;
