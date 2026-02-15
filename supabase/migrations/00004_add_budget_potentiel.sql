-- Budget potentiel (pipeline) par client — souvent utilisé pour les prospects
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS budget_potentiel numeric;

COMMENT ON COLUMN public.clients.budget_potentiel IS 'Montant estimé en € (pipeline / prospects) pour la vue Compta';
