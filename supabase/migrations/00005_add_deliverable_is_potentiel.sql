-- Livrable réel vs potentiel : chaque livrable peut être "réel" (facturé) ou "potentiel" (pipeline).
-- En Compta : Total facturé / Marge = livrables réels ; Potentiel = somme des livrables marqués potentiel.
ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS is_potentiel boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.deliverables.is_potentiel IS 'Si true : livrable potentiel (pipeline), compté en Compta Potentiel. Si false : livrable réel (facturé). Modifiable à tout moment.';
