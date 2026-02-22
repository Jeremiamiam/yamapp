-- Add balance_amount and potentiel columns to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS balance_amount decimal(10, 2),
  ADD COLUMN IF NOT EXISTS potentiel decimal(10, 2);

COMMENT ON COLUMN public.projects.balance_amount IS 'Montant solde projet';
COMMENT ON COLUMN public.projects.potentiel IS 'Montant potentiel — pipeline, pas encore signé';
