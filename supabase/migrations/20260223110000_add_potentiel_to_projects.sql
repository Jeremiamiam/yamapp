-- Add potentiel column to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS potentiel decimal(10, 2);

COMMENT ON COLUMN public.projects.potentiel IS 'Potentiel projet';
