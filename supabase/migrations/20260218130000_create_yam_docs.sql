-- Table pour les liens/ressources partagés YAM (questionnaires, templates, etc.)
CREATE TABLE IF NOT EXISTS public.yam_docs (
  id text PRIMARY KEY,
  title text NOT NULL,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS : tous les utilisateurs authentifiés peuvent lire
ALTER TABLE public.yam_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read yam_docs"
  ON public.yam_docs FOR SELECT
  TO authenticated
  USING (true);

-- Seuls les admins peuvent modifier (insert, update, delete)
CREATE POLICY "Admins can insert yam_docs"
  ON public.yam_docs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team t
      WHERE t.auth_user_id = auth.uid()
      AND t.app_role = 'admin'
    )
  );

CREATE POLICY "Admins can update yam_docs"
  ON public.yam_docs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team t
      WHERE t.auth_user_id = auth.uid()
      AND t.app_role = 'admin'
    )
  );

CREATE POLICY "Admins can delete yam_docs"
  ON public.yam_docs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team t
      WHERE t.auth_user_id = auth.uid()
      AND t.app_role = 'admin'
    )
  );
