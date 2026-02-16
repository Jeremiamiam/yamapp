-- Add st_hors_facture to deliverables (hors facture / non billable)
ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS st_hors_facture BOOLEAN DEFAULT false;
