-- Colonne utilisée par l'app pour afficher les livrables dans le backlog "À planifier"
-- ou sur la timeline (due_date + in_backlog = false). Sans cette colonne, l'insert
-- depuis le report (événements suggérés) échouait et les événements n'apparaissaient pas.
ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS in_backlog boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.deliverables.in_backlog IS 'Si true : affiché dans le backlog "À planifier". Si false : affiché sur la timeline à due_date.';
