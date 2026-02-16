-- Migration: ajouter colonnes facturation aux deliverables
-- Billing status: to-quote → quoted → deposit → progress → balance → paid

ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS billing_status text NOT NULL DEFAULT 'to-quote'
    CHECK (billing_status IN ('to-quote', 'quoted', 'deposit', 'progress', 'balance', 'paid')),
  ADD COLUMN IF NOT EXISTS quote_amount decimal(10, 2),
  ADD COLUMN IF NOT EXISTS deposit_amount decimal(10, 2),
  ADD COLUMN IF NOT EXISTS progress_amount decimal(10, 2),
  ADD COLUMN IF NOT EXISTS balance_amount decimal(10, 2),
  ADD COLUMN IF NOT EXISTS total_invoiced decimal(10, 2);

CREATE INDEX IF NOT EXISTS idx_deliverables_billing_status ON public.deliverables(billing_status);

COMMENT ON COLUMN public.deliverables.billing_status IS 'Étape de facturation: to-quote, quoted, deposit, progress, balance, paid';
COMMENT ON COLUMN public.deliverables.quote_amount IS 'Montant du devis';
COMMENT ON COLUMN public.deliverables.deposit_amount IS 'Montant acompte';
COMMENT ON COLUMN public.deliverables.progress_amount IS 'Montant facturé en cours';
COMMENT ON COLUMN public.deliverables.balance_amount IS 'Montant solde';
COMMENT ON COLUMN public.deliverables.total_invoiced IS 'Total déjà facturé (dépôt + progress + balance)';
