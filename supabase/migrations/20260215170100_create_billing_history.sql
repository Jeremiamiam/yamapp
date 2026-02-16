-- Migration: table historique des changements de facturation
-- Référence deliverables(id) en text pour cohérence avec le schéma existant

CREATE TABLE IF NOT EXISTS public.billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id text NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('to-quote', 'quoted', 'deposit', 'progress', 'balance', 'paid')),
  amount decimal(10, 2),
  notes text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_history_deliverable_changed
  ON public.billing_history(deliverable_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_history_changed_by
  ON public.billing_history(changed_by);

COMMENT ON TABLE public.billing_history IS 'Historique des changements de statut et montants de facturation par livrable';

-- RLS
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select billing_history"
  ON public.billing_history FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert billing_history"
  ON public.billing_history FOR INSERT TO authenticated
  WITH CHECK (true);
