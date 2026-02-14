-- Simplification : plus de table profiles. Connexion + rôle app = colonnes sur team.
-- Un membre team avec auth_user_id rempli peut se connecter ; app_role = admin (accès compta) ou editor (tout sauf compta).

-- 1. Colonnes sur team
ALTER TABLE public.team
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS app_role text NOT NULL DEFAULT 'editor' CHECK (app_role IN ('admin', 'editor'));

-- 2. RLS team
DROP POLICY IF EXISTS "Allow all for team" ON public.team;
CREATE POLICY "Authenticated read team"
  ON public.team FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own team row"
  ON public.team FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());
CREATE POLICY "Authenticated insert team"
  ON public.team FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Trigger : à l'inscription Auth, créer une ligne team
CREATE OR REPLACE FUNCTION public.handle_new_user_team()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE first_two text;
BEGIN
  first_two := upper(substring(coalesce(new.raw_user_meta_data->>'email', 'user') from 1 for 2));
  IF first_two = '' OR length(first_two) < 2 THEN first_two := 'U1'; END IF;
  INSERT INTO public.team (id, name, initials, role, color, email, auth_user_id, app_role)
  VALUES (
    'tm-' || new.id::text,
    coalesce(trim(split_part(new.raw_user_meta_data->>'email', '@', 1)), 'Utilisateur'),
    first_two,
    'employee',
    '#22d3ee',
    new.raw_user_meta_data->>'email',
    new.id,
    CASE WHEN (SELECT count(*) FROM public.team WHERE auth_user_id IS NOT NULL) = 0 THEN 'admin' ELSE 'editor' END
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_team();

-- 4. Supprimer profiles si elle existe (ancienne config)
DROP TABLE IF EXISTS public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_user();
