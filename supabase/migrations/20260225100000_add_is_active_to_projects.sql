-- Toggle actif/inactif sur projet : inactif = potentiel uniquement, actif = devis/acompte etc.
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.projects.is_active IS 'false = pipeline (potentiel uniquement), true = client actif (devis, acompte, etc.)';
