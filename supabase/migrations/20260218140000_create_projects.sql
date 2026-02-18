-- Projects: regroupement de deliverables avec facturation hybride
CREATE TABLE IF NOT EXISTS public.projects (
  id text PRIMARY KEY,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  -- Facturation projet (optionnel — si null, c'est juste un label)
  quote_amount numeric,
  quote_date text,
  deposit_amount numeric,
  deposit_date text,
  progress_amounts numeric[] DEFAULT '{}',
  progress_dates text[] DEFAULT '{}',
  balance_date text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ajout project_id sur deliverables
ALTER TABLE public.deliverables ADD COLUMN IF NOT EXISTS project_id text REFERENCES public.projects(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (true);
