-- Todos du jour : une par utilisateur, reste affichée tant que non cochée (même le lendemain)
CREATE TABLE IF NOT EXISTS public.day_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  for_date date NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_day_todos_user_id ON public.day_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_day_todos_done ON public.day_todos(done);

ALTER TABLE public.day_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users full access own day_todos"
  ON public.day_todos FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
