-- Phase 11: Add project_id to documents table
-- Documents with project_id IS NULL = client documents (generic)
-- Documents with project_id set = project-scoped documents

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS project_id text
  REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
