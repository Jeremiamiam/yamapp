CREATE TABLE IF NOT EXISTS public.retroplanning (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deadline date NOT NULL,
  tasks jsonb NOT NULL DEFAULT '[]',
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT retroplanning_client_unique UNIQUE (client_id)
);

ALTER TABLE public.retroplanning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read retroplanning"
  ON public.retroplanning FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert retroplanning"
  ON public.retroplanning FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update retroplanning"
  ON public.retroplanning FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete retroplanning"
  ON public.retroplanning FOR DELETE
  TO authenticated
  USING (true);
