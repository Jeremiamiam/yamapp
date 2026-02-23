-- Projects can be in backlog (à planifier)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS in_backlog boolean DEFAULT false;
